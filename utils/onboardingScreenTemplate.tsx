// Template for updating onboarding screens to use the new data storage system
// Copy this pattern to update your existing onboarding screens

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  // ... other imports as needed
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

const OnboardingScreenX: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  
  // Your existing state variables
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  // ... other state variables

  // Your existing data arrays/objects
  const options = [
    // ... your existing options
  ];

  // Updated handleContinue function with validation
  const handleContinue = async () => {
    // Validate required fields
    if (!selectedOption) {
      setShowValidationError(true);
      return;
    }
    
    // Add additional validation for specific fields if needed
    // Example: if (selectedOption === 'other' && !otherText.trim()) {
    //   setShowValidationError(true);
    //   return;
    // }
    
    setShowValidationError(false);
    
    // Prepare data to save (map your screen's data to the OnboardingData interface)
    const stepData = {
      // Map your screen's data to the appropriate fields
      // Examples:
      // gender: selectedGender,
      // age: parseInt(ageInput),
      // height_cm: parseInt(heightInput),
      // weight_kg: parseFloat(weightInput),
      // activity_level: selectedActivityLevel,
      // workout_frequency: selectedFrequency,
      // workout_duration: selectedDuration,
      // preferred_workout_time: selectedTime,
      // fitness_experience: selectedExperience,
      // target_weight_kg: parseFloat(targetWeightInput),
      // target_date: targetDate,
      // motivation_level: selectedMotivation,
      // preferred_exercises: selectedExercises,
      // dietary_preferences: selectedDiet,
      // allergies: selectedAllergies,
      // medical_conditions: selectedConditions,
      // equipment_available: selectedEquipment,
      // notification_preferences: notificationSettings,
      // privacy_settings: privacySettings,
      // additional_notes: additionalNotes,
    };
    
    // Save data and navigate to next step
    const success = await navigateToNextStep(SCREEN_NUMBER, stepData);
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Your existing UI components */}
        {/* ... */}
        
        {/* Validation Error Message */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please make a selection before continuing
          </Text>
        )}

        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={!selectedOption || isSaving} // Disable if required fields not filled
        >
          <LinearGradient
            colors={selectedOption ? ['#E6FFF9', '#FFF9CA'] : ['#E0E0E0', '#C0C0C0']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.continueButtonText, !selectedOption && styles.disabledButtonText]}>
              {isSaving ? 'Saving...' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </OnboardingErrorHandler>
  );
};

// Your existing styles
const styles = StyleSheet.create({
  // ... your existing styles
  
  // Add these validation styles
  validationError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#999999',
  },
});

export default OnboardingScreenX;

/*
MAPPING GUIDE FOR EACH SCREEN:

OnboardingScreen3 (Goals): primary_goal
OnboardingScreen4 (Fitness Goals): fitness_goal, other_goal_description
OnboardingScreen5 (Gender): gender
OnboardingScreen6 (Age): age
OnboardingScreen7 (Height): height_cm
OnboardingScreen8 (Weight): weight_kg
OnboardingScreen9 (Activity Level): activity_level
OnboardingScreen10 (Workout Frequency): workout_frequency
OnboardingScreen11 (Workout Duration): workout_duration
OnboardingScreen12 (Workout Time): preferred_workout_time
OnboardingScreen13 (Fitness Experience): fitness_experience
OnboardingScreen14 (Target Weight): target_weight_kg
OnboardingScreen15 (Target Date): target_date
OnboardingScreen16 (Motivation): motivation_level
OnboardingScreen17 (Preferred Exercises): preferred_exercises
OnboardingScreen18 (Dietary Preferences): dietary_preferences
OnboardingScreen19 (Allergies): allergies
OnboardingScreen20 (Medical Conditions): medical_conditions
OnboardingScreen21 (Equipment): equipment_available
OnboardingScreen22 (Final Preferences): notification_preferences, privacy_settings, additional_notes

For the final screen (OnboardingScreen22), use completeOnboardingFlow instead of navigateToNextStep:
const { completeOnboardingFlow } = useOnboardingNavigation();
const success = await completeOnboardingFlow(finalData);
*/
