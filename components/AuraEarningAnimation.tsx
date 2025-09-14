import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AuraEarningAnimationProps {
  visible: boolean;
  auraEarned: number;
  eventDescription: string;
  onComplete: () => void;
}

const AuraEarningAnimation: React.FC<AuraEarningAnimationProps> = ({
  visible,
  auraEarned,
  eventDescription,
  onComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mainAnimation: Animated.CompositeAnimation | null = null;
    let sparkleAnimation: Animated.CompositeAnimation | null = null;
    let timer: NodeJS.Timeout | null = null;

    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideAnim.setValue(50);
      sparkleAnim.setValue(0);

      // Main animation sequence
      mainAnimation = Animated.parallel([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale up
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Slide up
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);

      // Sparkle animation
      sparkleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      );

      // Start animations
      mainAnimation.start();
      sparkleAnimation.start();

      // Auto hide after 3 seconds
      timer = setTimeout(() => {
        // Stop sparkle animation first
        if (sparkleAnimation) {
          sparkleAnimation.stop();
        }
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete();
        });
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      // Stop all animations on cleanup
      if (mainAnimation) mainAnimation.stop();
      if (sparkleAnimation) sparkleAnimation.stop();
    };
  }, [visible, onComplete]);

  if (!visible) return null;

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FFD700']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Sparkle Effects */}
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle1,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}
          >
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle2,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}
          >
            <Text style={styles.sparkleText}>⭐</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle3,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}
          >
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            <Text style={styles.auraEarnedText}>+{auraEarned}</Text>
            <Text style={styles.auraLabel}>Aura Earned!</Text>
            <Text style={styles.eventDescription}>{eventDescription}</Text>
          </View>

          {/* Glow Effect */}
          <View style={styles.glowEffect} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  auraEarnedText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  auraLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 1,
  },
  sparkle1: {
    top: 10,
    left: 20,
  },
  sparkle2: {
    top: 15,
    right: 25,
  },
  sparkle3: {
    bottom: 15,
    left: 30,
  },
  sparkleText: {
    fontSize: 20,
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: 0,
  },
});

export default AuraEarningAnimation;
