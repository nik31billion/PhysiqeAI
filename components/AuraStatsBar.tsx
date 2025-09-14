import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserAuraSummary, getAuraLevel } from '../utils/auraService';

const { width } = Dimensions.get('window');

interface AuraStatsBarProps {
  auraSummary: UserAuraSummary | null;
  loading?: boolean;
  onPress?: () => void;
}

const AuraStatsBar: React.FC<AuraStatsBarProps> = ({
  auraSummary,
  loading = false,
  onPress
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading && auraSummary) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle pulse animation for aura points
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading, auraSummary]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingShimmer} />
        </View>
      </View>
    );
  }

  if (!auraSummary) {
    return null;
  }

  const totalAura = auraSummary.total_aura || 0;
  const currentStreak = auraSummary.current_streak || 0;
  const bestStreak = auraSummary.best_streak || 0;
  const auraLevel = getAuraLevel(totalAura);

  const getStreakIcon = () => {
    if (currentStreak >= 30) return 'trophy';
    if (currentStreak >= 14) return 'medal';
    if (currentStreak >= 7) return 'flame';
    if (currentStreak >= 3) return 'star';
    return 'calendar';
  };

  const getStreakColor = () => {
    if (currentStreak >= 30) return '#FFD700';
    if (currentStreak >= 14) return '#FF6B6B';
    if (currentStreak >= 7) return '#4ECDC4';
    if (currentStreak >= 3) return '#45B7D1';
    return '#96CEB4';
  };

  const streakColor = getStreakColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.statsBar}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Aura Points Section */}
        <Animated.View
          style={[
            styles.auraSection,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[auraLevel.color, `${auraLevel.color}80`]}
            style={styles.auraGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.auraContent}>
              <Ionicons 
                name="sparkles" 
                size={16} 
                color="#FFFFFF" 
                style={styles.auraIcon}
              />
              <Text style={styles.auraText}>{totalAura} Aura</Text>
            </View>
            <Text style={styles.auraLevelText}>{auraLevel.level}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Current Streak Section */}
        <View style={styles.streakSection}>
          <View style={styles.streakContent}>
            <Ionicons 
              name={getStreakIcon() as any} 
              size={16} 
              color={streakColor} 
              style={styles.streakIcon}
            />
            <Text style={[styles.streakText, { color: streakColor }]}>
              {currentStreak}-day Streak
            </Text>
          </View>
          {currentStreak > 0 && (
            <View style={[styles.streakIndicator, { backgroundColor: streakColor }]} />
          )}
        </View>

        {/* Best Streak Section */}
        {bestStreak > currentStreak && (
          <View style={styles.bestStreakSection}>
            <View style={styles.bestStreakContent}>
              <Ionicons 
                name="trophy" 
                size={14} 
                color="#FFD700" 
                style={styles.bestStreakIcon}
              />
              <Text style={styles.bestStreakText}>
                Best: {bestStreak}
              </Text>
            </View>
          </View>
        )}

        {/* Action Icons */}
        <View style={styles.actionIcons}>
          <Ionicons name="star-outline" size={16} color="#a2b2b7" />
          <Ionicons name="calendar-outline" size={16} color="#a2b2b7" />
          <Ionicons name="checkmark-circle-outline" size={16} color="#a2b2b7" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  loadingContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
    justifyContent: 'center',
  },
  loadingShimmer: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    width: '80%',
  },
  statsBar: {
    backgroundColor: '#f8fafd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  
  // Aura Section
  auraSection: {
    flex: 1,
    marginRight: 12,
  },
  auraGradient: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  auraContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auraIcon: {
    marginRight: 6,
  },
  auraText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  auraLevelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // Streak Section
  streakSection: {
    flex: 1,
    marginRight: 12,
    position: 'relative',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  streakIcon: {
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  streakIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Best Streak Section
  bestStreakSection: {
    marginRight: 12,
  },
  bestStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  bestStreakIcon: {
    marginRight: 4,
  },
  bestStreakText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F57C00',
  },

  // Action Icons
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default AuraStatsBar;
