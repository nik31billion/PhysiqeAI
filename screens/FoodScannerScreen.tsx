import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import FoodScannerCamera from '../components/FoodScannerCamera';
import FoodAnalysisResults, { FoodItem } from '../components/FoodAnalysisResults';
import FoodAnalysisLoadingScreen from '../components/FoodAnalysisLoadingScreen';
import { geminiVisionService } from '../utils/geminiVisionService';
import { addMultipleFoodsToDaily } from '../utils/dailyFoodIntakeService';
import { useAuth } from '../utils/AuthContext';
import { captureException, addBreadcrumb } from '../utils/sentryConfig';

interface FoodScannerScreenProps {
  navigation: any;
  route: {
    params: {
      scanMode: 'food' | 'barcode' | 'label' | 'library';
    };
  };
}

const FoodScannerScreen: React.FC<FoodScannerScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'camera' | 'analyzing' | 'results'>('camera');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAddingToDaily, setIsAddingToDaily] = useState(false);
  const { scanMode } = route.params;

  // Clean up state when screen loses focus to prevent navigation errors
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup function when screen is unfocused
        setIsAnalyzing(false);
        setIsAddingToDaily(false);
        // Clear captured image to free up memory
        setCapturedImage('');
        setFoodItems([]);
      };
    }, [])
  );

  const handleImageCaptured = async (imageUri: string) => {
    console.log('Image captured for analysis:', imageUri);
    addBreadcrumb('Image captured for food analysis', 'food_scanner_ui', { 
      scanMode, 
      imageUri: imageUri.substring(0, 50),
    });
    
    setCapturedImage(imageUri);
    setIsAnalyzing(true);
    // Show the beautiful loading screen immediately after capture
    setCurrentScreen('analyzing');

    try {
      // Handle library mode by treating it as regular food analysis
      const analysisMode = scanMode === 'library' ? 'food' : scanMode;
      console.log(`Starting food analysis with mode: ${analysisMode}, scanMode: ${scanMode}`);
      
      const analyzedItems = await geminiVisionService.analyzeFoodConcurrently(imageUri, analysisMode);
      setFoodItems(analyzedItems);
      // Only change screen AFTER we have the results
      setCurrentScreen('results');
    } catch (error) {
      console.error('Error analyzing food:', error);
      
      // Capture error in Sentry with UI context
      if (error instanceof Error) {
        captureException(error, {
          foodScannerUI: {
            operation: 'handleImageCaptured',
            scanMode,
            analysisMode: scanMode === 'library' ? 'food' : scanMode,
            errorMessage: error.message,
            screenState: 'analyzing',
          },
        });
      } else {
        captureException(new Error(String(error)), {
          foodScannerUI: {
            operation: 'handleImageCaptured',
            scanMode,
            errorType: 'unknown',
          },
        });
      }
      
      // More specific error messages based on the error type
      let errorTitle = 'Analysis Failed';
      let errorMessage = 'Unable to analyze the image. Please try again or enter nutrition information manually.';
      
      if (error instanceof Error) {
        if (error.message.includes('file could not be found')) {
          errorTitle = 'Image Not Found';
          errorMessage = 'The selected image could not be found. Please try selecting a different image from your library.';
        } else if (error.message.includes('too large')) {
          errorTitle = 'Image Too Large';
          errorMessage = 'The selected image is too large. Please choose a smaller image or use the camera instead.';
        } else if (error.message.includes('Permission denied')) {
          errorTitle = 'Permission Required';
          errorMessage = 'Permission to access the image was denied. Please check app permissions and try again.';
        } else if (error.message.includes('Failed to process')) {
          errorTitle = 'Processing Error';
          errorMessage = 'There was an error processing the selected image. Please try a different image or use the camera.';
        }
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setCurrentScreen('camera');
              setFoodItems([]);
              setCapturedImage('');
            },
          },
          {
            text: 'Manual Entry',
            onPress: () => {
              // Create a default food item for manual entry
              setFoodItems([
                {
                  name: 'Unknown Food',
                  quantity: '1 serving',
                  nutrition: {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    fiber: 0,
                    sugar: 0,
                    sodium: 0,
                    confidence: 0,
                  },
                },
              ]);
              setCurrentScreen('results');
            },
          },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = useCallback(() => {
    // Safe navigation - check if we can go back, otherwise navigate to main tabs
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If no screen to go back to, navigate to main tabs
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    }
  }, [navigation]);

  const handleRetake = () => {
    setCurrentScreen('camera');
    setCapturedImage('');
    setFoodItems([]);
    setIsAnalyzing(false);
  };

  const handleConfirm = async (confirmedItems: FoodItem[]) => {
    if (!user?.id) {
      const error = new Error('User not authenticated in food scanner');
      captureException(error, {
        foodScannerUI: {
          operation: 'handleConfirm',
          scanMode,
          itemCount: confirmedItems.length,
        },
      });
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    setIsAddingToDaily(true);
    addBreadcrumb('Adding food items to daily intake', 'food_scanner_ui', {
      scanMode,
      itemCount: confirmedItems.length,
      userId: user.id,
    });

    try {
      // Determine source based on scan mode
      const source = scanMode === 'barcode' ? 'barcode_scanner' : 'food_scanner';
      
      // Add all food items to daily intake
      const result = await addMultipleFoodsToDaily(user.id, confirmedItems, source);

      if (!result.success) {
        const error = new Error(result.error || 'Failed to add items to daily intake');
        captureException(error, {
          foodScannerUI: {
            operation: 'handleConfirm',
            scanMode,
            itemCount: confirmedItems.length,
            userId: user.id,
            source,
            apiError: result.error,
          },
        });
        throw error;
      }

      const totalCalories = confirmedItems.reduce(
        (total, item) => total + item.nutrition.calories,
        0
      );

      const itemCount = confirmedItems.length;
      const itemText = itemCount === 1 ? 'item' : 'items';

      Alert.alert(
        'Added to Daily Intake! 🎉',
        `Successfully added ${itemCount} food ${itemText} (${Math.round(totalCalories)} calories) to your daily intake.\n\nThese calories will be reflected in your daily progress.`,
        [
          {
            text: 'View Progress',
            onPress: () => {
              // Clean navigation back to home
              handleClose();
            },
          },
          {
            text: 'Scan More',
            onPress: handleRetake,
            style: 'cancel',
          },
        ]
      );
      
    } catch (error) {
      console.error('Error adding to daily intake:', error);
      
      // Capture error in Sentry
      if (error instanceof Error) {
        captureException(error, {
          foodScannerUI: {
            operation: 'handleConfirm',
            scanMode,
            itemCount: confirmedItems.length,
            userId: user?.id,
            errorMessage: error.message,
          },
        });
      } else {
        captureException(new Error(String(error)), {
          foodScannerUI: {
            operation: 'handleConfirm',
            scanMode,
            itemCount: confirmedItems.length,
            errorType: 'unknown',
          },
        });
      }
      
      Alert.alert(
        'Error', 
        'Failed to add to daily intake. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleConfirm(confirmedItems),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsAddingToDaily(false);
    }
  };

  if (currentScreen === 'camera') {
    return (
      <SafeAreaView style={styles.container}>
        <FoodScannerCamera
          onClose={handleClose}
          onImageCaptured={handleImageCaptured}
          scanMode={scanMode}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'analyzing') {
    return (
      <FoodAnalysisLoadingScreen
        capturedImageUri={capturedImage}
        scanMode={scanMode}
        onComplete={() => {
          // This will be called when the loading animation completes
          // The actual analysis might still be running in the background
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FoodAnalysisResults
        imageUri={capturedImage}
        foodItems={foodItems}
        isAnalyzing={isAnalyzing || isAddingToDaily}
        onClose={handleClose}
        onConfirm={handleConfirm}
        onRetake={handleRetake}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default FoodScannerScreen;
