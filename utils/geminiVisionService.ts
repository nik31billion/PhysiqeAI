import * as FileSystem from 'expo-file-system';
import { FoodItem, NutritionData } from '../components/FoodAnalysisResults';
import { supabase } from './supabase';

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
    try {
      console.log('Converting image to base64:', imageUri);
      
      // Check if the image file exists and get info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error(`Image file does not exist at ${imageUri}`);
      }
      
      console.log('Image file info:', fileInfo);
      
      // Check file size (max 20MB for Gemini)
      if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
        throw new Error('Image file is too large (max 20MB)');
      }
      
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64 || base64.length === 0) {
        throw new Error('Image conversion resulted in empty base64 string');
      }
      
      console.log('Successfully converted image to base64, size:', base64.length);
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      
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
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);
      
      console.log('Calling Supabase edge function for food analysis...');

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: {
          userId: user.id,
          imageBase64: base64Image,
          scanMode: scanMode,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Food analysis failed: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Food analysis failed');
      }

      if (!data.foodItems || !Array.isArray(data.foodItems)) {
        throw new Error('Invalid response format from food analysis');
      }

      console.log('Food analysis completed successfully:', data.foodItems);
      return data.foodItems;

    } catch (error) {
      console.error('Error analyzing food:', error);
      
      // Return mock data for development/testing
      if (__DEV__) {
        console.log('Using mock data for development');
        return this.getMockFoodData(scanMode);
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
