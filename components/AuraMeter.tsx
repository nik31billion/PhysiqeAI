import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAuraSummary, getAuraLevel } from '../utils/auraService';

const { width: screenWidth } = Dimensions.get('window');

interface AuraMeterProps {
  auraSummary: UserAuraSummary | null;
  loading?: boolean;
  showAnimation?: boolean;
  onAnimationComplete?: () => void;
}

const AuraMeter: React.FC<AuraMeterProps> = ({
  auraSummary,
  loading = false,
  showAnimation = false,
  onAnimationComplete
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showAnimation) {
      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
        { iterations: 3 }
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [showAnimation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingRing}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const totalAura = auraSummary?.total_aura || 0;
  const auraLevel = getAuraLevel(totalAura);
  
  // Calculate progress for the ring (0-100%)
  const progress = Math.min((totalAura / 1000) * 100, 100);
  
  // Create gradient colors based on aura level
  const gradientColors = [
    auraLevel.color,
    `${auraLevel.color}80`, // 50% opacity
    auraLevel.color,
  ];

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: glowOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.glowRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.ringContainer,
          {
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.auraRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.ringInner}>
            <Text style={styles.auraNumber}>{totalAura}</Text>
            <Text style={styles.auraLabel}>Aura</Text>
            <Text style={[styles.levelText, { color: auraLevel.color }]}>
              {auraLevel.level}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Progress indicator dots around the ring */}
      <View style={styles.progressDots}>
        {Array.from({ length: 8 }, (_, index) => {
          const dotProgress = (index / 8) * 100;
          const isActive = progress >= dotProgress;
          
          return (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: isActive ? auraLevel.color : '#E0E0E0',
                  transform: [
                    { rotate: `${(index * 45)}deg` },
                    { translateY: -80 },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  loadingRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
  },
  glowContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  glowRing: {
    flex: 1,
    borderRadius: 100,
    shadowColor: '#FF6F4C',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  ringContainer: {
    position: 'relative',
    zIndex: 2,
  },
  auraRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ringInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 83,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auraNumber: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
    marginBottom: 4,
  },
  auraLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
  },
  progressDots: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: '50%',
    left: '50%',
    marginLeft: -3,
    marginTop: -3,
  },
});

export default AuraMeter;
