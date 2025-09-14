import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StreakTrackerProps {
  currentStreak: number;
  bestStreak: number;
  showBestStreak?: boolean;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({
  currentStreak,
  bestStreak,
  showBestStreak = true,
}) => {
  const renderStreakDots = () => {
    const dots = [];
    const maxDots = 7; // Show up to 7 days
    
    for (let i = 0; i < maxDots; i++) {
      const isActive = i < currentStreak;
      const isCurrentDay = i === currentStreak - 1;
      
      dots.push(
        <View
          key={i}
          style={[
            styles.streakDot,
            isActive ? styles.streakDotActive : styles.streakDotInactive,
            isCurrentDay && styles.streakDotCurrent,
          ]}
        >
          {isActive && (
            <View style={styles.streakDotInner}>
              <Text style={styles.streakDotNumber}>{i + 1}</Text>
            </View>
          )}
        </View>
      );
    }
    
    return dots;
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return 'Start your streak today!';
    } else if (currentStreak === 1) {
      return 'Great start! Keep it going!';
    } else if (currentStreak < 7) {
      return `${currentStreak}-day streak! You\'re on fire!`;
    } else if (currentStreak < 14) {
      return `${currentStreak}-day streak! Amazing dedication!`;
    } else if (currentStreak < 30) {
      return `${currentStreak}-day streak! You\'re unstoppable!`;
    } else {
      return `${currentStreak}-day streak! Legendary!`;
    }
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return '#E0E0E0';
    if (currentStreak < 3) return '#FFB74D';
    if (currentStreak < 7) return '#FF8A65';
    if (currentStreak < 14) return '#FF6B6B';
    if (currentStreak < 30) return '#4ECDC4';
    return '#FFD700';
  };

  const streakColor = getStreakColor();

  return (
    <View style={styles.container}>
      {/* Streak Dots */}
      <View style={styles.streakDotsContainer}>
        {renderStreakDots()}
      </View>

      {/* Streak Message */}
      <View style={styles.streakMessageContainer}>
        <LinearGradient
          colors={[streakColor, `${streakColor}80`]}
          style={styles.streakMessageBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.streakMessage, { color: currentStreak > 0 ? '#FFFFFF' : '#666' }]}>
            {getStreakMessage()}
          </Text>
        </LinearGradient>
      </View>

      {/* Best Streak */}
      {showBestStreak && bestStreak > currentStreak && (
        <View style={styles.bestStreakContainer}>
          <View style={styles.bestStreakBadge}>
            <Text style={styles.bestStreakIcon}>🏆</Text>
            <Text style={styles.bestStreakText}>
              Best: {bestStreak} days
            </Text>
          </View>
        </View>
      )}

      {/* Streak Stats */}
      <View style={styles.streakStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{bestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {currentStreak >= 7 ? Math.floor(currentStreak / 7) : 0}
          </Text>
          <Text style={styles.statLabel}>Weeks</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  streakDotsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  streakDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  streakDotActive: {
    backgroundColor: '#FFB74D',
    borderColor: '#FF8A65',
  },
  streakDotInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  streakDotCurrent: {
    borderWidth: 3,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  streakDotInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakDotNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakMessageContainer: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  streakMessageBackground: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bestStreakContainer: {
    marginBottom: 16,
  },
  bestStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  bestStreakIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  bestStreakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
});

export default StreakTracker;
