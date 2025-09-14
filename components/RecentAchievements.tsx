import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserAchievement } from '../utils/auraService';

const { width } = Dimensions.get('window');

interface RecentAchievementsProps {
  achievements: UserAchievement[];
  loading?: boolean;
  onPress?: () => void;
  maxDisplay?: number;
}

const RecentAchievements: React.FC<RecentAchievementsProps> = ({
  achievements,
  loading = false,
  onPress,
  maxDisplay = 3
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!loading && achievements.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, achievements]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingShimmer} />
        </View>
      </View>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={32} color="#ccc" />
          <Text style={styles.emptyText}>No achievements yet</Text>
          <Text style={styles.emptySubtext}>Complete activities to unlock achievements!</Text>
        </View>
      </View>
    );
  }

  const recentAchievements = achievements.slice(0, maxDisplay);

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'streak':
        return 'flame';
      case 'workout':
        return 'fitness';
      case 'meal':
        return 'restaurant';
      case 'progress':
        return 'trending-up';
      case 'social':
        return 'people';
      default:
        return 'trophy';
    }
  };

  const getAchievementColor = (category: string) => {
    switch (category) {
      case 'streak':
        return '#FF6B6B';
      case 'workout':
        return '#4ECDC4';
      case 'meal':
        return '#45B7D1';
      case 'progress':
        return '#96CEB4';
      case 'social':
        return '#FFB74D';
      default:
        return '#937AFD';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={20} color="#937AFD" />
          <Text style={styles.title}>Recent Achievements</Text>
        </View>
        {achievements.length > maxDisplay && (
          <TouchableOpacity onPress={onPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#937AFD" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.achievementsContainer}
      >
        {recentAchievements.map((achievement, index) => {
          const category = achievement.achievement?.category || 'general';
          const color = getAchievementColor(category);
          const icon = getAchievementIcon(category);

          return (
            <Animated.View
              key={achievement.id}
              style={[
                styles.achievementCard,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50 + index * 20],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[color, `${color}80`]}
                style={styles.achievementGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.achievementContent}>
                  <Ionicons name={icon as any} size={24} color="#FFFFFF" />
                  <Text style={styles.achievementName} numberOfLines={2}>
                    {achievement.achievement?.name || 'Achievement'}
                  </Text>
                  <Text style={styles.achievementDate}>
                    {formatDate(achievement.unlocked_at)}
                  </Text>
                </View>
                
                {achievement.aura_earned > 0 && (
                  <View style={styles.auraReward}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                    <Text style={styles.auraRewardText}>+{achievement.aura_earned}</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  loadingContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 20,
    padding: 16,
    height: 120,
    justifyContent: 'center',
  },
  loadingShimmer: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    width: '60%',
  },
  emptyContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#937AFD',
    fontWeight: '600',
    marginRight: 4,
  },
  achievementsContainer: {
    paddingHorizontal: 4,
  },
  achievementCard: {
    width: 140,
    marginRight: 12,
  },
  achievementGradient: {
    borderRadius: 16,
    padding: 16,
    height: 100,
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
  achievementContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 16,
  },
  achievementDate: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  auraReward: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  auraRewardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 2,
  },
});

export default RecentAchievements;
