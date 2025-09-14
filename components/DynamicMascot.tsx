import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuraLevel } from '../utils/auraService';

const { width: screenWidth } = Dimensions.get('window');

interface DynamicMascotProps {
  totalAura: number;
  currentStreak: number;
  size?: 'small' | 'medium' | 'large';
  showGlow?: boolean;
  animated?: boolean;
}

const DynamicMascot: React.FC<DynamicMascotProps> = ({
  totalAura,
  currentStreak,
  size = 'medium',
  showGlow = true,
  animated = true,
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const auraLevel = getAuraLevel(totalAura);

  // Get mascot image based on aura level and streak
  const getMascotImage = () => {
    // Base mascot based on aura level
    if (totalAura >= 1000) {
      return require('../assets/mascot/crown no bg.png');
    } else if (totalAura >= 500) {
      return require('../assets/mascot/medal no bg.png');
    } else if (totalAura >= 200) {
      return require('../assets/mascot/excited no bg.png');
    } else if (totalAura >= 100) {
      return require('../assets/mascot/motivating no bg.png');
    } else if (totalAura >= 50) {
      return require('../assets/mascot/mascot normal no bg.png');
    } else if (totalAura >= 20) {
      return require('../assets/mascot/mascot relaxed no bg.png');
    } else {
      return require('../assets/mascot/thinking no bg.png');
    }
  };

  // Get size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, borderRadius: 20 };
      case 'large':
        return { width: 80, height: 80, borderRadius: 40 };
      default:
        return { width: 60, height: 60, borderRadius: 30 };
    }
  };

  const sizeDimensions = getSizeDimensions();

  // Animation effects
  useEffect(() => {
    if (!animated) return;

    // Glow animation
    if (showGlow && totalAura > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }

    // Pulse animation for high aura levels
    if (totalAura >= 200) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Bounce animation for streaks
    if (currentStreak >= 7) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, showGlow, totalAura, currentStreak]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.container}>
      {/* Glow Effect */}
      {showGlow && totalAura > 0 && (
        <Animated.View
          style={[
            styles.glowContainer,
            {
              width: sizeDimensions.width * 1.5,
              height: sizeDimensions.height * 1.5,
              borderRadius: (sizeDimensions.width * 1.5) / 2,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[auraLevel.color, `${auraLevel.color}40`, 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Mascot Container */}
      <Animated.View
        style={[
          styles.mascotContainer,
          {
            width: sizeDimensions.width,
            height: sizeDimensions.height,
            borderRadius: sizeDimensions.borderRadius,
            backgroundColor: totalAura > 0 ? `${auraLevel.color}20` : '#F0F0F0',
            transform: [
              { scale: pulseAnim },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <Image
          source={getMascotImage()}
          style={[
            styles.mascotImage,
            {
              width: sizeDimensions.width * 0.7,
              height: sizeDimensions.height * 0.7,
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Streak Indicator */}
      {currentStreak >= 7 && (
        <View style={styles.streakIndicator}>
          <View style={[styles.streakBadge, { backgroundColor: auraLevel.color }]}>
            <Image
              source={require('../assets/mascot/crown no bg.png')}
              style={styles.streakIcon}
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    zIndex: 0,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 999,
  },
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mascotImage: {
    // Size will be set dynamically
  },
  streakIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 2,
  },
  streakBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  streakIcon: {
    width: 12,
    height: 12,
  },
});

export default DynamicMascot;
