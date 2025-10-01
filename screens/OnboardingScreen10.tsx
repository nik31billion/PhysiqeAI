import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface ActivityLevel {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const activityLevels: ActivityLevel[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little or no exercise',
    icon: '🪑',
    color: '#DFF7ED',
  },
  {
    id: 'lightly-active',
    title: 'Lightly active',
    description: 'Light exercise 1–3 days/week',
    icon: '🚶‍♀️',
    color: '#F3E8FF',
  },
  {
    id: 'moderately-active',
    title: 'Moderately active',
    description: 'Moderate exercise 3–5 days/week',
    icon: '🤸‍♂️',
    color: '#E0F7FA',
  },
  {
    id: 'super-active',
    title: 'Super active',
    description: 'Very hard exercise or physical job',
    icon: '🏋️‍♂️',
    color: '#FCE4EC',
  },
];

const OnboardingScreen10: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivity(activityId);
  };

  const handleContinue = async () => {
    if (!selectedActivity) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    const success = await navigateToNextStep(10, {
      activity_level: selectedActivity,
    });
    
    if (!success) {
      
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
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#E9F6F3', '#FCF4ED']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Heading */}
          <Text style={styles.heading}>What is your current{'\n'}activity level?</Text>

          {/* Activity Level Options */}
          <View style={styles.optionsContainer}>
            {activityLevels.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityCard,
                  selectedActivity === activity.id && styles.selectedCard,
                ]}
                onPress={() => handleActivitySelect(activity.id)}
                activeOpacity={0.8}
              >
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: activity.color }]}>
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>

                {/* Selection Indicator */}
                <View style={styles.selectionContainer}>
                  {selectedActivity === activity.id ? (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    </View>
                  ) : (
                    <View style={styles.unselectedIndicator} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Validation Error Message */}
          {showValidationError && (
            <Text style={styles.validationError}>
              Please select your activity level before continuing
            </Text>
          )}

          {/* Continue Button */}
          <LinearGradient
            colors={selectedActivity ? ['#E6FFF9', '#B9E5FF'] : ['#E0E0E0', '#C0C0C0']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              disabled={!selectedActivity || isSaving}
            >
              <Text style={[
                styles.continueButtonText,
                (!selectedActivity || isSaving) && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        </View>

      {/* Dumbbell Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/dumbbell no bg.png')}
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
    paddingVertical: 20,
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
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#FAFFFE',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  activityIcon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  selectionContainer: {
    marginLeft: 16,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  unselectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#B9E5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
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
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    right: width * 0.01,
    zIndex: 10,
  },
  mascotImage: {
    width: 110,
    height: 110,
    zIndex: 2,
  },
});

export default OnboardingScreen10;
