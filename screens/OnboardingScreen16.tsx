import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface Obstacle {
  id: string;
  title: string;
  backgroundColor: string;
  icon: string;
}

const OnboardingScreen16: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedObstacles, setSelectedObstacles] = useState<string[]>([]);
  const [showValidationError, setShowValidationError] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const obstacles: Obstacle[] = [
    {
      id: 'lack-motivation',
      title: 'Lack of motivation',
      backgroundColor: '#C6F6CF',
      icon: 'bed-outline',
    },
    {
      id: 'stress',
      title: 'Stress',
      backgroundColor: '#E2D9FB',
      icon: 'sad-outline',
    },
    {
      id: 'dont-know-start',
      title: "Don't know where to start",
      backgroundColor: '#FFF6CC',
      icon: 'help-circle-outline',
    },
    {
      id: 'diet-cravings',
      title: 'Diet cravings',
      backgroundColor: '#FFE6CC',
      icon: 'restaurant-outline',
    },
    {
      id: 'inconsistent-routine',
      title: 'Inconsistent routine',
      backgroundColor: '#E2D9FB',
      icon: 'time-outline',
    },
    {
      id: 'other',
      title: 'Other',
      backgroundColor: '#D9F2FA',
      icon: 'ellipsis-horizontal-outline',
    },
  ];

  const handleObstacleSelect = (obstacleId: string) => {
    setSelectedObstacles(prev => {
      if (prev.includes(obstacleId)) {
        // If deselecting "other", hide the input and clear the text
        if (obstacleId === 'other') {
          setShowOtherInput(false);
          setOtherText('');
        }
        return prev.filter(id => id !== obstacleId);
      } else {
        // If selecting "other", show the input
        if (obstacleId === 'other') {
          setShowOtherInput(true);
        }
        return [...prev, obstacleId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedObstacles.length === 0) {
      setShowValidationError(true);
      return;
    }
    
    // If "other" is selected but no text is provided, show validation error
    if (selectedObstacles.includes('other') && otherText.trim() === '') {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    
    // Prepare the obstacles data
    let obstaclesData = selectedObstacles;
    if (selectedObstacles.includes('other') && otherText.trim() !== '') {
      // Replace 'other' with the custom text
      obstaclesData = selectedObstacles.map(obstacle => 
        obstacle === 'other' ? otherText.trim() : obstacle
      );
    }
    
    const success = await navigateToNextStep(16, {
      fitness_obstacles: obstaclesData,
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
          colors={['#F7EDFF', '#E8FDF5']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.heading}>
          What stops you from achieving your fitness goals?
        </Text>

        {/* Obstacles Grid */}
        <View style={styles.obstaclesGrid}>
          {obstacles.map((obstacle) => {
            // If this is the "other" obstacle and we're showing the input, render the input instead
            if (obstacle.id === 'other' && showOtherInput) {
              return (
                <View key={obstacle.id} style={styles.otherInputCardContainer}>
                  <TouchableOpacity
                    style={[styles.obstacleCard, { backgroundColor: obstacle.backgroundColor }]}
                    onPress={() => handleObstacleSelect('other')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    </View>
                    <TextInput
                      style={styles.otherTextInputInCard}
                      value={otherText}
                      onChangeText={setOtherText}
                      placeholder="Describe your obstacle..."
                      placeholderTextColor="#999999"
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      onPressIn={(e) => e.stopPropagation()}
                    />
                  </TouchableOpacity>
                </View>
              );
            }
            
            // Regular obstacle card
            return (
              <TouchableOpacity
                key={obstacle.id}
                style={[
                  styles.obstacleCard,
                  { backgroundColor: obstacle.backgroundColor },
                  selectedObstacles.includes(obstacle.id) && styles.obstacleCardSelected,
                ]}
                onPress={() => handleObstacleSelect(obstacle.id)}
              >
                {selectedObstacles.includes(obstacle.id) && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  </View>
                )}
                <Ionicons
                  name={obstacle.icon as any}
                  size={24}
                  color="#222222"
                  style={styles.obstacleIcon}
                />
                <Text style={styles.obstacleText}>{obstacle.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Section with Error Message and Button */}
        <View style={styles.bottomSection}>
          {/* Validation Error Message */}
          {showValidationError && (
            <Text style={styles.validationError}>
              {selectedObstacles.includes('other') && otherText.trim() === '' 
                ? 'Please describe your specific obstacle before continuing'
                : 'Please select at least one obstacle before continuing'
              }
            </Text>
          )}

          {/* Continue Button */}
          <LinearGradient
            colors={selectedObstacles.length > 0 ? ['#E8FDF5', '#C7F9F1'] : ['#E0E0E0', '#C0C0C0']}
            style={styles.continueButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.continueButtonInner}
              onPress={handleContinue}
              disabled={selectedObstacles.length === 0 || isSaving}
            >
              <Text style={[styles.continueButtonText, (selectedObstacles.length === 0 || isSaving) && styles.buttonTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        </View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/thinking no bg.png')}
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
    top: height * 0.08,
    left: width * 0.04,
    right: width * 0.04,
    bottom: height * 0.02,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    paddingVertical: 40,
    paddingHorizontal: 35,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 30,
    paddingHorizontal: 10,
  },
  obstaclesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-start',
    paddingTop: 10,
    marginBottom: 20,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  obstacleCard: {
    width: (width - width * 0.08 - 70 - 20) / 2,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  obstacleCardSelected: {
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
  obstacleIcon: {
    marginBottom: 8,
  },
  obstacleText: {
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
    marginBottom: 16,
    fontWeight: '500',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    right: width * 0.05,
    zIndex: 10,
  },
  mascotImage: {
    width: 70,
    height: 70,
    zIndex: 2,
  },
  otherInputCardContainer: {
    width: (width - width * 0.08 - 70 - 20) / 2,
    height: 120,
    marginBottom: 16,
  },
  otherTextInputInCard: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 13,
    color: '#222222',
    textAlign: 'center',
    textAlignVertical: 'top',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default OnboardingScreen16;
