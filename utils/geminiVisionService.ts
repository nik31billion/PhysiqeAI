import * as FileSystem from 'expo-file-system';
import { FoodItem, NutritionData } from '../components/FoodAnalysisResults';
import { supabase } from './supabase';
import { captureException, addBreadcrumb, startTransaction } from './sentryConfig';

// Removed GeminiResponse interface as we're now using Supabase edge function

export class GeminiVisionService {
  private static instance: GeminiVisionService;

  public static getInstance(): GeminiVisionService {
    if (!GeminiVisionService.instance) {
      GeminiVisionService.instance = new GeminiVisionService();
    }
    return GeminiVisionService.instance;
  }

  private async imageToBase64(imageUri: string): Promise<string> {
    const transaction = startTransaction('food_scanner_image_conversion', 'file.read');
    try {
      addBreadcrumb('Starting image to base64 conversion', 'food_scanner', { imageUri });
      console.log('Converting image to base64:', imageUri);
      
      // Check if the image file exists and get info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        const error = new Error(`Image file does not exist at ${imageUri}`);
        captureException(error, {
          foodScanner: {
            operation: 'imageToBase64',
            imageUri: imageUri.substring(0, 50), // Truncate for privacy
            fileExists: false,
          },
        });
        throw error;
      }
      
      console.log('Image file info:', fileInfo);
      
      // Check file size (max 20MB for Gemini)
      if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
        const error = new Error('Image file is too large (max 20MB)');
        captureException(error, {
          foodScanner: {
            operation: 'imageToBase64',
            fileSize: fileInfo.size,
            maxSize: 20 * 1024 * 1024,
          },
        });
        throw error;
      }
      
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64 || base64.length === 0) {
        const error = new Error('Image conversion resulted in empty base64 string');
        captureException(error, {
          foodScanner: {
            operation: 'imageToBase64',
            imageUri: imageUri.substring(0, 50),
          },
        });
        throw error;
      }
      
      console.log('Successfully converted image to base64, size:', base64.length);
      addBreadcrumb('Image converted successfully', 'food_scanner', { base64Size: base64.length });
      transaction.finish();
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      transaction.finish();
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('does not exist')) {
          throw new Error('Selected image file could not be found. Please try selecting the image again.');
        } else if (error.message.includes('too large')) {
          throw new Error('Image file is too large. Please select a smaller image or try using the camera instead.');
        } else if (error.message.includes('permission')) {
          throw new Error('Permission denied to access the image. Please check app permissions.');
        }
      }
      
      throw new Error('Failed to process the selected image. Please try a different image or use the camera instead.');
    }
  }

  // Removed prompt methods as they're now in the Supabase edge function

  public async analyzeFood(
    imageUri: string,
    scanMode: 'food' | 'barcode' | 'label'
  ): Promise<FoodItem[]> {
    const transaction = startTransaction('food_scanner_analysis', 'api.call');
    const startTime = Date.now();
    
    try {
      addBreadcrumb('Starting food analysis', 'food_scanner', { scanMode, imageUri: imageUri.substring(0, 50) });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        const error = new Error('User not authenticated');
        captureException(error, {
          foodScanner: {
            operation: 'analyzeFood',
            scanMode,
            authError: userError?.message,
          },
        });
        throw error;
      }

      // Convert image to base64 (track performance)
      const imageConversionSpan = transaction.startChild('image_conversion', 'file.read');
      const base64Image = await this.imageToBase64(imageUri);
      imageConversionSpan.setData('image_size_bytes', base64Image.length);
      imageConversionSpan.finish();
      
      console.log('Calling Supabase edge function for food analysis...');
      addBreadcrumb('Calling Supabase edge function', 'food_scanner', { 
        scanMode, 
        imageSize: base64Image.length,
        userId: user.id,
      });

      // Call Supabase edge function (track performance)
      const apiCallSpan = transaction.startChild('supabase_edge_function', 'http.client');
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: {
          userId: user.id,
          imageBase64: base64Image,
          scanMode: scanMode,
        },
      });

      const apiDuration = Date.now();
      apiCallSpan.setTag('status', error ? 'error' : 'success');
      if (error) {
        apiCallSpan.setTag('error', 'true');
        apiCallSpan.setData('error_message', error.message);
      }
      apiCallSpan.finish();

      if (error) {
        console.error('Supabase function error:', error);
        const apiError = new Error(`Food analysis failed: ${error.message}`);
        captureException(apiError, {
          foodScanner: {
            operation: 'analyzeFood',
            scanMode,
            userId: user.id,
            supabaseError: error.message,
            errorCode: error.status || 'unknown',
          },
        });
        throw apiError;
      }

      if (!data || !data.success) {
        const error = new Error(data?.error || 'Food analysis failed');
        captureException(error, {
          foodScanner: {
            operation: 'analyzeFood',
            scanMode,
            userId: user.id,
            apiResponse: data,
          },
        });
        throw error;
      }

      if (!data.foodItems || !Array.isArray(data.foodItems)) {
        const error = new Error('Invalid response format from food analysis');
        captureException(error, {
          foodScanner: {
            operation: 'analyzeFood',
            scanMode,
            userId: user.id,
            responseFormat: typeof data.foodItems,
          },
        });
        throw error;
      }

      const duration = Date.now() - startTime;
      console.log('Food analysis completed successfully:', data.foodItems);
      addBreadcrumb('Food analysis completed', 'food_scanner', { 
        scanMode, 
        itemCount: data.foodItems.length,
        duration,
      });
      
      transaction.setTag('scanMode', scanMode);
      transaction.setTag('itemCount', data.foodItems.length.toString());
      transaction.setData('duration', duration);
      transaction.finish();
      
      return data.foodItems;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Error analyzing food:', error);
      transaction.setTag('error', 'true');
      transaction.setData('duration', duration);
      transaction.finish();
      
      // Return mock data for development/testing
      if (__DEV__) {
        console.log('Using mock data for development');
        return this.getMockFoodData(scanMode);
      }
      
      // Re-throw to let caller handle
      throw error;
    }
  }

  /**
   * Concurrent version of food analysis - processes multiple requests simultaneously
   * @param imageUri - Image URI to analyze
   * @param scanMode - Scan mode (food, barcode, label)
   * @returns Promise resolving to food items
   */
  public async analyzeFoodConcurrently(
    imageUri: string,
    scanMode: 'food' | 'barcode' | 'label'
  ): Promise<FoodItem[]> {
    const transaction = startTransaction('food_scanner_concurrent_analysis', 'api.call');
    const startTime = Date.now();
    
    try {
      addBreadcrumb('Starting concurrent food analysis', 'food_scanner', { scanMode });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        const error = new Error('User not authenticated');
        captureException(error, {
          foodScanner: {
            operation: 'analyzeFoodConcurrently',
            scanMode,
            authError: userError?.message,
          },
        });
        throw error;
      }

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);
      
      const { concurrentLLMProcessor } = await import('./concurrentLLMProcessor');
      
      console.log(`[GeminiVisionService] Adding food analysis request to concurrent processor for user ${user.id}`);
      addBreadcrumb('Added to concurrent processor', 'food_scanner', { 
        scanMode,
        userId: user.id,
      });
      
      const result = await concurrentLLMProcessor.addRequest(
        user.id,
        'food_analysis',
        {
          userId: user.id,
          imageBase64: base64Image,
          scanMode: scanMode,
        }
      );
      
      const duration = Date.now() - startTime;
      transaction.setTag('scanMode', scanMode);
      transaction.setData('duration', duration);
      transaction.finish();
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Error in analyzeFoodConcurrently:', error);
      transaction.setTag('error', 'true');
      transaction.setData('duration', duration);
      transaction.finish();
      
      if (error instanceof Error) {
        captureException(error, {
          foodScanner: {
            operation: 'analyzeFoodConcurrently',
            scanMode,
            errorMessage: error.message,
          },
        });
      }
      
      throw error;
    }
  }

  private getMockFoodData(scanMode: 'food' | 'barcode' | 'label'): FoodItem[] {
    // Mock data for development and testing
    const mockData: { [key: string]: FoodItem[] } = {
      food: [
        {
          name: 'Chicken Biryani',
          quantity: '1 plate (300g)',
          nutrition: {
            calories: 485,
            protein: 22,
            carbs: 58,
            fat: 18,
            fiber: 3,
            sugar: 4,
            sodium: 890,
            confidence: 85,
          },
        },
        {
          name: 'Raita',
          quantity: '1 small bowl (100g)',
          nutrition: {
            calories: 65,
            protein: 3,
            carbs: 8,
            fat: 2,
            fiber: 1,
            sugar: 6,
            sodium: 125,
            confidence: 75,
          },
        },
      ],
      barcode: [
        {
          name: 'Packaged Snack',
          quantity: '1 serving (30g)',
          nutrition: {
            calories: 150,
            protein: 3,
            carbs: 20,
            fat: 7,
            fiber: 2,
            sugar: 3,
            sodium: 200,
            confidence: 90,
          },
        },
      ],
      label: [
        {
          name: 'Nutrition Label Product',
          quantity: '1 serving',
          nutrition: {
            calories: 120,
            protein: 4,
            carbs: 15,
            fat: 5,
            fiber: 2,
            sugar: 8,
            sodium: 180,
            confidence: 95,
          },
        },
      ],
    };

    return mockData[scanMode] || mockData.food;
  }
}

export const geminiVisionService = GeminiVisionService.getInstance();
