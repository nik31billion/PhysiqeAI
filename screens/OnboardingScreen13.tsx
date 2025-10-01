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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

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

  const handleDietSelect = (dietId: string) => {
    setSelectedDiet(dietId);
    // Clear custom text when selecting a non-other option
    if (dietId !== 'other') {
      setCustomDietText('');
    }
  };

  const handleContinue = async () => {
    if (!selectedDiet) {
      setShowValidationError(true);
      return;
    }
    
    // If "other" is selected, require custom text
    if (selectedDiet === 'other' && !customDietText.trim()) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    
    // Prepare dietary preferences data
    const dietaryPreferences = selectedDiet === 'other' 
      ? `other: ${customDietText.trim()}` 
      : selectedDiet;
    
    const success = await navigateToNextStep(13, {
      dietary_preferences: dietaryPreferences,
    });
    
    if (!success) {
      
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

          {/* Diet Options */}
          <View style={styles.optionsContainer}>
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
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dietOption,
                    { backgroundColor: option.color },
                    selectedDiet === option.id && [
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
              );
            })}
          </View>

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
    paddingVertical: 25,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  dietOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 70,
  },
  selectedOption: {
    backgroundColor: '#FAFFFE',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    shadowColor: '#B9E5FF',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    flex: 1,
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#C1F5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  continueButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
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
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E91E63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 70,
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
});

export default OnboardingScreen13;
