import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';
import { captureException, addBreadcrumb } from '../utils/sentryConfig';

const { width, height } = Dimensions.get('window');

interface DietOption {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  iconComponent: React.ReactNode;
}

const OnboardingScreen13: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedDiet, setSelectedDiet] = useState<string>('');
  const [customDietText, setCustomDietText] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);
  const [cuisinePreference, setCuisinePreference] = useState<'Indian' | 'Global'>('Indian');

  const handleDietSelect = (dietId: string) => {
    setSelectedDiet(dietId);
    // Clear custom text when selecting a non-other option
    if (dietId !== 'other') {
      setCustomDietText('');
    }
  };

  // Get examples based on cuisine and diet type
  const getDietExamples = (dietId: string, cuisine: 'Indian' | 'Global'): string[] => {
    if (dietId === 'other') return [];
    
    const examples: Record<string, { Indian: string[]; Global: string[] }> = {
      'vegetarian': {
        Indian: ['Dal, Roti, Sabzi', 'Pulao, Raita', 'Khichdi, Papad'],
        Global: ['Oats, Muesli', 'Salad, Pasta', 'Quinoa Bowl']
      },
      'vegan': {
        Indian: ['Dal, Rice, Sabzi', 'Vegetable Biryani', 'Sambar, Idli'],
        Global: ['Oats, Smoothie', 'Quinoa Salad', 'Avocado Toast']
      },
      'eggetarian': {
        Indian: ['Dal, Roti, Egg Curry', 'Pulao, Boiled Eggs', 'Paratha, Omelette'],
        Global: ['Oats, Scrambled Eggs', 'Toast, Poached Eggs', 'Egg Salad']
      },
      'non-veg': {
        Indian: ['Chicken Curry, Roti', 'Biryani, Raita', 'Fish Curry, Rice'],
        Global: ['Grilled Chicken, Salad', 'Salmon, Vegetables', 'Steak, Potatoes']
      }
    };

    return examples[dietId]?.[cuisine] || [];
  };

  const handleContinue = async () => {
    if (!selectedDiet) {
      setShowValidationError(true);
      addBreadcrumb('Validation error: No diet selected', 'onboarding', { screen: 'OnboardingScreen13' });
      return;
    }
    
    // If "other" is selected, require custom text
    if (selectedDiet === 'other' && !customDietText.trim()) {
      setShowValidationError(true);
      addBreadcrumb('Validation error: Custom diet text required', 'onboarding', { screen: 'OnboardingScreen13' });
      return;
    }
    
    setShowValidationError(false);
    addBreadcrumb('Continuing onboarding step 13', 'onboarding', { 
      screen: 'OnboardingScreen13',
      selectedDiet,
      cuisinePreference,
    });
    
    // Prepare dietary preferences data
    // Format: "Indian vegetarian" or "vegetarian" (for Global)
    let dietaryPreferences: string;
    if (selectedDiet === 'other') {
      dietaryPreferences = `other: ${customDietText.trim()}`;
    } else {
      dietaryPreferences = cuisinePreference === 'Indian' 
        ? `Indian ${selectedDiet}` 
        : selectedDiet;
    }
    
    try {
      const success = await navigateToNextStep(13, {
        dietary_preferences: dietaryPreferences,
      });
      
      if (!success) {
        const error = new Error('Failed to navigate to next onboarding step');
        captureException(error, {
          onboarding: {
            operation: 'handleContinue',
            screen: 'OnboardingScreen13',
            selectedDiet,
            errorType: 'navigation_failure',
          },
        });
      }
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        onboarding: {
          operation: 'handleContinue',
          screen: 'OnboardingScreen13',
          errorType: 'exception',
        },
      });
    }
  };

  const renderBroccoliIcon = () => (
    <View style={[styles.iconContainer, { backgroundColor: '#A8E6CF' }]}>
      <Text style={styles.foodEmoji}>🥦</Text>
    </View>
  );

  const renderVeganIcon = () => (
    <View style={[styles.iconContainer, { backgroundColor: '#C4F0E7' }]}>
      <Text style={styles.foodEmoji}>🥗</Text>
    </View>
  );

  const renderEggIcon = () => (
    <View style={[styles.iconContainer, { backgroundColor: '#FFF9D6' }]}>
      <Text style={styles.foodEmoji}>🥚</Text>
    </View>
  );

  const renderChickenIcon = () => (
    <View style={[styles.iconContainer, { backgroundColor: '#FFD9B3' }]}>
      <Text style={styles.foodEmoji}>🍗</Text>
    </View>
  );

  const renderAvocadoIcon = () => (
    <View style={[styles.iconContainer, { backgroundColor: '#F9D6DE' }]}>
      <Text style={styles.foodEmoji}>🥑</Text>
    </View>
  );

  const dietOptions: DietOption[] = [
    {
      id: 'vegetarian',
      label: 'Vegetarian',
      color: '#FFFFFF',
      borderColor: '#4CAF50',
      iconComponent: renderBroccoliIcon(),
    },
    {
      id: 'vegan',
      label: 'Vegan',
      color: '#FFFFFF',
      borderColor: '#8BC34A',
      iconComponent: renderVeganIcon(),
    },
    {
      id: 'eggetarian',
      label: 'Eggetarian',
      color: '#FFFFFF',
      borderColor: '#FFC107',
      iconComponent: renderEggIcon(),
    },
    {
      id: 'non-veg',
      label: 'Non-veg',
      color: '#FFFFFF',
      borderColor: '#FF9800',
      iconComponent: renderChickenIcon(),
    },
    {
      id: 'other',
      label: 'Other',
      color: '#FFFFFF',
      borderColor: '#E91E63',
      iconComponent: renderAvocadoIcon(),
    },
  ];

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#E9F6F3', '#FFF3E6', '#F2F2FA']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            {/* Heading */}
            <Text style={styles.heading}>What are your diet preferences?</Text>

            {/* Cuisine Preference Toggle */}
            <View style={styles.cuisineToggleContainer}>
              <Text style={styles.cuisineLabel}>Cuisine:</Text>
              <View style={styles.cuisineToggle}>
                <TouchableOpacity
                  style={[
                    styles.cuisineOption,
                    cuisinePreference === 'Indian' && styles.cuisineOptionActive
                  ]}
                  onPress={() => setCuisinePreference('Indian')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.cuisineOptionText,
                    cuisinePreference === 'Indian' && styles.cuisineOptionTextActive
                  ]}>
                    🇮🇳 Indian
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cuisineOption,
                    cuisinePreference === 'Global' && styles.cuisineOptionActive
                  ]}
                  onPress={() => setCuisinePreference('Global')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.cuisineOptionText,
                    cuisinePreference === 'Global' && styles.cuisineOptionTextActive
                  ]}>
                    🌍 Global
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Diet Options */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {dietOptions.map((option) => {
                // If "other" is selected, show text input instead of the other card
                if (option.id === 'other' && selectedDiet === 'other') {
                  return (
                    <View key={option.id} style={styles.customDietCardContainer}>
                      <View style={styles.customDietCard}>
                        {/* Icon */}
                        {option.iconComponent}
                        
                        {/* Text Input */}
                        <TextInput
                          style={styles.customDietCardInput}
                          placeholder="e.g., Keto, Mediterranean, Paleo..."
                          placeholderTextColor="#999999"
                          value={customDietText}
                          onChangeText={setCustomDietText}
                          multiline={false}
                          autoCapitalize="words"
                          returnKeyType="done"
                          autoFocus={true}
                        />
                        
                        {/* Cancel button */}
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => {
                            setSelectedDiet('');
                            setCustomDietText('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.cancelButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }
                
                // Regular diet option cards
                const isSelected = selectedDiet === option.id;
                const examples = getDietExamples(option.id, cuisinePreference);
                
                return (
                  <View key={option.id} style={styles.dietOptionWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.dietOption,
                        { backgroundColor: option.color },
                        isSelected && [
                          styles.selectedOption,
                          { borderColor: option.borderColor }
                        ],
                      ]}
                      onPress={() => handleDietSelect(option.id)}
                      activeOpacity={0.8}
                    >
                      {/* Icon */}
                      {option.iconComponent}

                      {/* Label */}
                      <Text style={styles.optionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                    
                    {/* Examples - only show when selected */}
                    {isSelected && examples.length > 0 && (
                      <View style={styles.examplesContainer}>
                        <Text style={styles.examplesLabel}>You'll get meals like:</Text>
                        <View style={styles.examplesList}>
                          {examples.map((example, index) => (
                            <View key={index} style={styles.exampleChip}>
                              <Text style={styles.exampleText}>{example}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Section - Fixed */}
            <View style={styles.bottomSection}>
              {/* Validation Error Message */}
              {showValidationError && (
                <Text style={styles.validationError}>
                  {selectedDiet === 'other' 
                    ? 'Please specify your diet preference before continuing'
                    : 'Please select your diet preference before continuing'
                  }
                </Text>
              )}

              {/* Continue Button */}
              <LinearGradient
                colors={selectedDiet ? ['#E6FFF9', '#C1F5FF'] : ['#E0E0E0', '#C0C0C0']}
                style={styles.continueButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TouchableOpacity 
                  style={styles.continueButton} 
                  onPress={handleContinue}
                  disabled={!selectedDiet || isSaving || (selectedDiet === 'other' && !customDietText.trim())}
                >
                  <Text style={[
                    styles.continueButtonText,
                    (!selectedDiet || isSaving || (selectedDiet === 'other' && !customDietText.trim())) && styles.disabledButtonText
                  ]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Helper Text */}
              <Text style={styles.helperText}>Only one selection possible</Text>
            </View>
          </View>
        </View>

      {/* Tasty Food Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/tasty food no bg.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>
      </View>
    </OnboardingErrorHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    position: 'absolute',
    top: height * 0.06,
    left: width * 0.06,
    right: width * 0.06,
    bottom: height * 0.08,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
    elevation: 20,
  },
  cardContent: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  cuisineToggleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  cuisineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
  },
  cuisineToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 3,
    gap: 3,
  },
  cuisineOption: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 15,
    minWidth: 95,
    alignItems: 'center',
  },
  cuisineOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cuisineOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  cuisineOptionTextActive: {
    color: '#2D2D2D',
    fontWeight: '700',
  },
  scrollContainer: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    gap: 12,
  },
  bottomSection: {
    width: '100%',
    paddingTop: 8,
  },
  dietOptionWrapper: {
    width: '100%',
  },
  dietOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 64,
  },
  selectedOption: {
    backgroundColor: '#FAFFFE',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    shadowColor: '#B9E5FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2D2D',
    flex: 1,
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 20,
    shadowColor: '#C1F5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#999999',
  },
  validationError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  customDietCardContainer: {
    width: '100%',
  },
  customDietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFFFE',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E91E63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 64,
  },
  customDietCardInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginLeft: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  cancelButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    right: width * 0.01,
    zIndex: 10,
  },
  foodEmoji: {
    fontSize: 28,
    textAlign: 'center',
  },
  mascotImage: {
    width: 110,
    height: 110,
    zIndex: 2,
  },
  examplesContainer: {
    marginTop: 10,
    paddingLeft: 62, // Align with content (icon width 48 + margin 14)
    paddingRight: 10,
  },
  examplesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exampleChip: {
    backgroundColor: '#F0F8F5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F0E8',
  },
  exampleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4CAF50',
  },
});

export default OnboardingScreen13;
