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
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface MealFrequency {
  id: string;
  label: string;
  color: string;
  iconName: string;
}

const OnboardingScreen15: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [otherMealPreference, setOtherMealPreference] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);

  // Helper function to convert allergies string to array
  const convertAllergiesToArray = (allergiesString: string): string[] | null => {
    if (!allergiesString.trim()) return null;
    return allergiesString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  const handleFrequencySelect = (frequencyId: string) => {
    setSelectedFrequency(frequencyId);
  };

  const handleContinue = async () => {
    if (!selectedFrequency) {
      setShowValidationError(true);
      return;
    }

    // If "Other" is selected, require the custom input
    if (selectedFrequency === 'other' && !otherMealPreference.trim()) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);

    // Convert allergies string to array format for database
    // Database expects TEXT[] format, so we convert comma-separated string to array
    const allergiesArray = convertAllergiesToArray(allergies);

    const success = await navigateToNextStep(15, {
      meal_frequency: selectedFrequency === 'other' ? otherMealPreference.trim() : selectedFrequency,
      allergies: allergiesArray || undefined,
    });

    if (!success) {
      
    }
  };

  const mealFrequencies: MealFrequency[] = [
    {
      id: '3meals',
      label: '3 meals/day',
      color: '#C6F6CF',
      iconName: 'restaurant',
    },
    {
      id: '4-6meals',
      label: '4–6 smaller meals',
      color: '#E2D9FB',
      iconName: 'layers',
    },
    {
      id: 'intermittent',
      label: 'Intermittent fasting',
      color: '#FFF6CC',
      iconName: 'time',
    },
    {
      id: 'other',
      label: 'Other',
      color: '#D9F2FA',
      iconName: 'ellipsis-horizontal',
    },
  ];

  const renderFrequencyIcon = (frequency: MealFrequency) => {
    let iconName = frequency.iconName;
    
    // Map icon names to Ionicons
    switch (frequency.iconName) {
      case 'restaurant':
        iconName = 'restaurant';
        break;
      case 'layers':
        iconName = 'layers';
        break;
      case 'time':
        iconName = 'time';
        break;
      case 'ellipsis-horizontal':
        iconName = 'ellipsis-horizontal';
        break;
      default:
        iconName = 'ellipsis-horizontal';
    }

    return (
      <View style={[
        styles.iconContainer, 
        { backgroundColor: frequency.color }
      ]}>
        <Ionicons 
          name={iconName as any} 
          size={24} 
          color="#2D2D2D" 
        />
      </View>
    );
  };

  const renderCheckmark = (frequencyId: string) => {
    const frequency = mealFrequencies.find(f => f.id === frequencyId);
    if (!frequency) return null;

    return (
      <View style={[
        styles.checkmarkContainer,
        { backgroundColor: frequency.color }
      ]}>
        <Ionicons 
          name="checkmark" 
          size={16} 
          color="#2D2D2D" 
        />
      </View>
    );
  };

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
          colors={['#E8FDF5', '#F7EDFF']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Heading */}
          <Text style={styles.heading}>
            Your meal routine
          </Text>

          {/* Subheading */}
          <Text style={styles.subheading}>
            How often do you prefer to eat?
          </Text>

          {/* Meal Frequency Options */}
          <View style={styles.optionsContainer}>
            {mealFrequencies.map((frequency) => (
              <View key={frequency.id}>
                {frequency.id === 'other' && selectedFrequency === 'other' ? (
                  /* Replace "Other" button with input field */
                  <View style={[
                    styles.frequencyOption,
                    { backgroundColor: frequency.color },
                    styles.selectedOption,
                    { 
                      shadowColor: frequency.color,
                    }
                  ]}>
                    {/* Icon */}
                    {renderFrequencyIcon(frequency)}
                    
                    {/* Input field in place of label */}
                    <TextInput
                      style={styles.otherMealInputReplacement}
                      placeholder="E.g., 2 meals a day, grazing, etc."
                      placeholderTextColor="#999999"
                      value={otherMealPreference}
                      onChangeText={setOtherMealPreference}
                      multiline={false}
                      autoFocus={true}
                    />
                    
                    {/* Checkmark */}
                    {renderCheckmark(frequency.id)}
                  </View>
                ) : (
                  /* Regular button for non-"Other" options */
                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      { backgroundColor: frequency.color },
                      selectedFrequency === frequency.id && [
                        styles.selectedOption,
                        { 
                          shadowColor: frequency.color,
                        }
                      ],
                    ]}
                    onPress={() => handleFrequencySelect(frequency.id)}
                    activeOpacity={0.8}
                  >
                    {/* Icon */}
                    {renderFrequencyIcon(frequency)}

                    {/* Label */}
                    <Text style={styles.optionLabel}>{frequency.label}</Text>

                    {/* Checkmark for selected item */}
                    {selectedFrequency === frequency.id && renderCheckmark(frequency.id)}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>


          {/* Allergy Section */}
          <View style={styles.allergySection}>
            <Text style={styles.allergyTitle}>Any allergies?</Text>
            <TextInput
              style={styles.allergyInput}
              placeholder="E.g., peanuts, gluten, dairy (separate with commas)"
              placeholderTextColor="#999999"
              value={allergies}
              onChangeText={setAllergies}
              multiline={false}
            />
            <Text style={styles.helperText}>(Optional)</Text>
          </View>

          {/* Validation Error Message */}
          {showValidationError && (
            <Text style={styles.validationError}>
              {selectedFrequency === 'other' && !otherMealPreference.trim() 
                ? 'Please specify your meal preference' 
                : 'Please select your meal frequency before continuing'}
            </Text>
          )}

          {/* Continue Button */}
          <LinearGradient
            colors={selectedFrequency ? ['#E8FDF5', '#C7F9F1'] : ['#E0E0E0', '#C0C0C0']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              disabled={!selectedFrequency || isSaving || (selectedFrequency === 'other' && !otherMealPreference.trim())}
            >
              <Text style={[
                styles.continueButtonText,
                (!selectedFrequency || isSaving || (selectedFrequency === 'other' && !otherMealPreference.trim())) && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Footer Text */}
          <Text style={styles.footerText}>Please check your choices</Text>
        </View>
        </View>

      {/* Waiter Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/waiter no bg.png')}
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
    bottom: height * 0.05,
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
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 70,
  },
  selectedOption: {
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  otherMealInputReplacement: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginLeft: 16,
  },
  allergySection: {
    width: '100%',
    marginBottom: 32,
  },
  allergyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
    textAlign: 'left',
  },
  allergyInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#2D2D2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'left',
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#C7F9F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 16,
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
  disabledButtonText: {
    color: '#CCCCCC',
  },
  validationError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    right: width * 0.02,
    zIndex: 10,
  },
  mascotImage: {
    width: 90,
    height: 90,
    zIndex: 2,
  },
});

export default OnboardingScreen15;
