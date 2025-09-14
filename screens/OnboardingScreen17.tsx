import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface WorkoutTime {
  id: string;
  title: string;
  backgroundColor: string;
  icon: string;
}

const OnboardingScreen17: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);

  const workoutTimes: WorkoutTime[] = [
    {
      id: 'morning',
      title: 'Morning',
      backgroundColor: '#D6FAD8',
      icon: 'sunny',
    },
    {
      id: 'afternoon',
      title: 'Afternoon',
      backgroundColor: '#E2D9FB',
      icon: 'time',
    },
    {
      id: 'evening',
      title: 'Evening',
      backgroundColor: '#FFF8D1',
      icon: 'moon',
    },
    {
      id: 'flexible',
      title: 'Flexible',
      backgroundColor: '#D9F2FA',
      icon: 'swap-horizontal',
    },
  ];

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
  };

  const handleContinue = async () => {
    if (!selectedTime) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    const success = await navigateToNextStep(17, {
      preferred_workout_time: selectedTime,
    });
    
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
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#F7EDFF', '#E8FDF5']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.heading}>
          When do you prefer{'\n'}to work out?
        </Text>

        {/* Workout Time Selection Grid */}
        <View style={styles.timeGrid}>
          {workoutTimes.map((time) => (
            <TouchableOpacity
              key={time.id}
              style={[
                styles.timeCard,
                { backgroundColor: time.backgroundColor },
                selectedTime === time.id && styles.timeCardSelected,
              ]}
              onPress={() => handleTimeSelect(time.id)}
            >
              {selectedTime === time.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
              )}
              <Ionicons
                name={time.icon as any}
                size={24}
                color="#222222"
                style={styles.timeIcon}
              />
              <Text style={styles.timeText}>{time.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Validation Error Message */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please select your preferred workout time before continuing
          </Text>
        )}

        {/* Continue Button */}
        <LinearGradient
          colors={selectedTime ? ['#E8FDF5', '#C7F9F1'] : ['#E0E0E0', '#C0C0C0']}
          style={styles.continueButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.continueButtonInner}
            onPress={handleContinue}
            disabled={!selectedTime || isSaving}
          >
            <Text style={[styles.continueButtonText, (!selectedTime || isSaving) && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Helper Text */}
        <Text style={styles.helperText}>Please select one option</Text>
        </View>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../assets/mascot/working out no bg.png')}
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
    position: 'relative',
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
    top: height * 0.12,
    left: width * 0.05,
    right: width * 0.05,
    bottom: height * 0.12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 35,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
    paddingHorizontal: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
  },
  timeCard: {
    width: (width - width * 0.1 - 70 - 20) / 2,
    height: 110,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  timeCardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeIcon: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    lineHeight: 18,
  },
  continueButton: {
    width: '100%',
    borderRadius: 30,
    shadowColor: '#C7F9F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  continueButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  continueButtonInner: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  buttonTextDisabled: {
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
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    zIndex: 10,
  },
  mascotImage: {
    width: 110,
    height: 110,
  },
});

export default OnboardingScreen17;
