import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export interface MilestoneCelebrationModalProps {
  visible: boolean;
  milestone: string;
  streakDays?: number;
  onClose: () => void;
  onContinue?: () => void;
}

const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  visible,
  milestone,
  streakDays,
  onClose,
  onContinue,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const confettiScale = useRef(new Animated.Value(0)).current;
  const confettiRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start celebration animation
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 150,
          friction: 15,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Confetti animation with delay
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(confettiScale, {
            toValue: 1,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(confettiRotation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(confettiRotation, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, 200);
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(confettiScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getMilestoneConfig = () => {
    switch (milestone) {
      case '7_day_streak':
        return {
          title: '7-Day Streak! 🔥',
          subtitle: 'You\'re on fire!',
          description: 'Amazing work! Your consistency is paying off and your aura is glowing brighter than ever!',
          emoji: '🔥',
          colors: ['#FF6B6B', '#FF8E8E', '#FFB3B3'] as const,
        };
      case 'aura_milestone':
        return {
          title: 'Aura Milestone! ✨',
          subtitle: 'Your aura is off the charts!',
          description: 'Incredible! You\'ve reached a new aura level. Keep shining bright!',
          emoji: '✨',
          colors: ['#B7FCE7', '#C7F9F1', '#D2C2FF'] as const,
        };
      case 'goal_achieved':
        return {
          title: 'Goal Achieved! 🎉',
          subtitle: 'You did it!',
          description: 'Congratulations! You\'ve reached your goal. Time to set new ones and keep growing!',
          emoji: '🎉',
          colors: ['#10B981', '#34D399', '#6EE7B7'] as const,
        };
      default:
        return {
          title: 'Milestone Reached! 🎊',
          subtitle: 'Congratulations!',
          description: 'Amazing achievement! You\'re making incredible progress on your journey!',
          emoji: '🎊',
          colors: ['#B88CFF', '#C7B3FF', '#D2C2FF'] as const,
        };
    }
  };

  const config = getMilestoneConfig();

  const modalStyle = {
    opacity: opacity,
  };

  const containerStyle = {
    transform: [{ scale: scale }],
  };

  const confettiStyle = {
    transform: [
      { scale: confettiScale },
      { 
        rotate: confettiRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        })
      },
    ],
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, modalStyle]}>
        <Animated.View style={[styles.container, containerStyle]}>
          <LinearGradient
            colors={config.colors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Confetti Effects */}
            <Animated.View style={[styles.confettiContainer, confettiStyle]}>
              {[...Array(12)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.confetti,
                    {
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][index % 4],
                      transform: [{ rotate: `${Math.random() * 360}deg` }],
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="rgba(0, 0, 0, 0.6)" />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {/* Mascot */}
              <View style={styles.mascotContainer}>
                <Image
                  source={require('../assets/mascot/excited no bg.png')}
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>

              {/* Description */}
              <Text style={styles.description}>{config.description}</Text>

              {/* Streak Days Display */}
              {streakDays && (
                <View style={styles.streakContainer}>
                  <Text style={styles.streakNumber}>{streakDays}</Text>
                  <Text style={styles.streakLabel}>Days Strong!</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.continueButtonText}>Keep Going! 🚀</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    zIndex: 5,
  },
  mascotContainer: {
    marginBottom: 24,
  },
  mascotImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  streakContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonContainer: {
    width: '100%',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
});

export default MilestoneCelebrationModal;
