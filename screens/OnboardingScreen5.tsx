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

type GenderOption = 'male' | 'female' | 'other' | null;

const OnboardingScreen5: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedGender, setSelectedGender] = useState<GenderOption>(null);
  const [showValidationError, setShowValidationError] = useState(false);

  const handleContinue = async () => {
    if (!selectedGender) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    const success = await navigateToNextStep(5, {
      gender: selectedGender,
    });
    
    if (!success) {
      
    }
  };

  const handleGenderSelect = (gender: GenderOption) => {
    setSelectedGender(gender);
  };

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Full Screen Gradient Background */}
        <LinearGradient
          colors={['#D1F5E7', '#F6EADB']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.heading}>What is your gender?</Text>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {/* Male Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.maleCard,
              selectedGender === 'male' && styles.selectedCard
            ]}
            onPress={() => handleGenderSelect('male')}
          >
            <View style={styles.optionContent}>
              <Image
                source={require('../assets/mascot/mascot male no bg.png')}
                style={styles.mascotIcon}
                resizeMode="contain"
              />
              <Text style={styles.optionText}>Male</Text>
              {selectedGender === 'male' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={20} color="#34C759" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Female Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.femaleCard,
              selectedGender === 'female' && styles.selectedCard
            ]}
            onPress={() => handleGenderSelect('female')}
          >
            <View style={styles.optionContent}>
              <Image
                source={require('../assets/mascot/mascot female no bg.png')}
                style={styles.mascotIcon}
                resizeMode="contain"
              />
              <Text style={styles.optionText}>Female</Text>
              {selectedGender === 'female' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={20} color="#FF69B4" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Other Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.otherCard,
              selectedGender === 'other' && styles.selectedCard
            ]}
            onPress={() => handleGenderSelect('other')}
          >
            <View style={styles.optionContent}>
              <View style={styles.questionMarkContainer}>
                <Text style={styles.questionMark}>?</Text>
              </View>
              <Text style={styles.optionText}>Other</Text>
              {selectedGender === 'other' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Validation Error Message */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please select your gender before continuing
          </Text>
        )}

        {/* Continue Button */}
        <LinearGradient
          colors={selectedGender ? ['#E6FFF9', '#FFF9CA'] : ['#E0E0E0', '#C0C0C0']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleContinue}
            disabled={!selectedGender || isSaving}
          >
            <Text style={[
              styles.buttonText,
              (!selectedGender || isSaving) && styles.buttonTextDisabled
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        </View>

      {/* Mascot positioned at bottom right */}
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
    top: height * 0.1,
    left: width * 0.08,
    right: width * 0.08,
    bottom: height * 0.15,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  optionCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  maleCard: {
    backgroundColor: '#E0F8E9',
  },
  femaleCard: {
    backgroundColor: '#FFE4EC',
  },
  otherCard: {
    backgroundColor: '#D9F2FF',
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#2196F3',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  mascotIcon: {
    width: 50,
    height: 50,
  },
  questionMarkContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMark: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  optionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -30 }],
  },
  checkmarkContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    borderRadius: 35,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
  },
  button: {
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#8E8E93',
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
    bottom: height * 0.18,
    right: width * 0.05,
    zIndex: 10,
  },
  mascotImage: {
    width: 80,
    height: 80,
    zIndex: 2,
  },
});

export default OnboardingScreen5;
