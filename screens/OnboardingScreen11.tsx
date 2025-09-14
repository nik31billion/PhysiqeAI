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

interface ExperienceLevel {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
}

const experienceLevels: ExperienceLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to fitness or starting again',
    iconName: 'barbell',
    color: '#DFF7ED',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Exercise regularly, some experience',
    iconName: 'trending-up',
    color: '#E5E2F9',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Consistent training, experienced',
    iconName: 'body',
    color: '#FFF6D4',
  },
];

const OnboardingScreen11: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);

  const handleExperienceSelect = (experienceId: string) => {
    setSelectedExperience(experienceId);
  };

  const handleContinue = async () => {
    if (!selectedExperience) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    const success = await navigateToNextStep(11, {
      fitness_experience: selectedExperience,
    });
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  const renderExperienceIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'barbell':
        return (
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Ionicons name="barbell-outline" size={28} color="#4CAF50" />
          </View>
        );
      case 'trending-up':
        return (
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <View style={styles.trendingIconContainer}>
              <Ionicons name="trending-up" size={24} color="#937AFD" />
              <View style={styles.progressDots}>
                <View style={[styles.progressDot, styles.progressDot1]} />
                <View style={[styles.progressDot, styles.progressDot2]} />
                <View style={[styles.progressDot, styles.progressDot3]} />
              </View>
            </View>
          </View>
        );
      case 'body':
        return (
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <View style={styles.muscleIconContainer}>
              <Text style={styles.muscleEmoji}>💪</Text>
            </View>
          </View>
        );
      default:
        return null;
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
          <Text style={styles.heading}>What is your fitness{'\n'}experience level?</Text>

          {/* Experience Level Options */}
          <View style={styles.optionsContainer}>
            {experienceLevels.map((experience) => (
              <TouchableOpacity
                key={experience.id}
                style={[
                  styles.experienceCard,
                  selectedExperience === experience.id && styles.selectedCard,
                ]}
                onPress={() => handleExperienceSelect(experience.id)}
                activeOpacity={0.8}
              >
                {/* Icon */}
                {renderExperienceIcon(experience.iconName, experience.color)}

                {/* Text Content */}
                <View style={styles.textContainer}>
                  <Text style={styles.experienceTitle}>{experience.title}</Text>
                  <Text style={styles.experienceDescription}>{experience.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Validation Error Message */}
          {showValidationError && (
            <Text style={styles.validationError}>
              Please select your fitness experience level before continuing
            </Text>
          )}

          {/* Continue Button */}
          <LinearGradient
            colors={selectedExperience ? ['#E6FFF9', '#B9E5FF'] : ['#E0E0E0', '#C0C0C0']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              disabled={!selectedExperience || isSaving}
            >
              <Text style={[
                styles.continueButtonText,
                (!selectedExperience || isSaving) && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Helper Text */}
          <Text style={styles.helperText}>Only one selection possible</Text>
        </View>
        </View>

      {/* Thumbs Up Mascot with Confetti */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/mascot thumbs up no bg.png')}
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
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
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
    borderColor: '#2196F3',
    backgroundColor: '#FAFFFE',
    shadowColor: '#2196F3',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  trendingIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressDots: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'row',
    gap: 2,
  },
  progressDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#937AFD',
  },
  progressDot1: {
    opacity: 0.4,
  },
  progressDot2: {
    opacity: 0.7,
  },
  progressDot3: {
    opacity: 1,
  },
  muscleIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleEmoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  experienceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
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

export default OnboardingScreen11;
