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
import { AuraEvent } from '../utils/auraService';

const { width } = Dimensions.get('window');

interface RecentAuraEventsProps {
  events: AuraEvent[];
  loading?: boolean;
  onPress?: () => void;
  maxDisplay?: number;
}

const RecentAuraEvents: React.FC<RecentAuraEventsProps> = ({
  events,
  loading = false,
  onPress,
  maxDisplay = 5
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!loading && events.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, events]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingShimmer} />
        </View>
      </View>
    );
  }

  if (!events || events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="sparkles-outline" size={32} color="#ccc" />
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>Complete activities to earn Aura points!</Text>
        </View>
      </View>
    );
  }

  const recentEvents = events.slice(0, maxDisplay);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'daily_workout':
        return 'fitness';
      case 'meal_completion':
        return 'restaurant';
      case 'all_meals_day':
        return 'checkmark-circle';
      case 'seven_day_streak':
        return 'flame';
      case 'new_best_streak':
        return 'trophy';
      case 'progress_photo':
        return 'camera';
      case 'measurement_update':
        return 'resize';
      case 'milestone_hit':
        return 'star';
      case 'progress_share':
        return 'share-social';
      case 'coach_glo_chat':
        return 'chatbubble';
      case 'plan_tweak_request':
        return 'settings';
      case 'glow_card_share':
        return 'card';
      case 'friend_referral':
        return 'people';
      case 'achievement_unlocked':
        return 'medal';
      case 'missed_workout':
      case 'missed_meal':
        return 'close-circle';
      default:
        return 'sparkles';
    }
  };

  const getEventColor = (eventType: string, auraDelta: number) => {
    if (auraDelta < 0) {
      return '#FF6B6B'; // Red for penalties
    }
    
    switch (eventType) {
      case 'daily_workout':
        return '#4ECDC4';
      case 'meal_completion':
        return '#45B7D1';
      case 'all_meals_day':
        return '#96CEB4';
      case 'seven_day_streak':
        return '#FF6B6B';
      case 'new_best_streak':
        return '#FFD700';
      case 'progress_photo':
        return '#937AFD';
      case 'measurement_update':
        return '#FFB74D';
      case 'milestone_hit':
        return '#FF8A65';
      case 'progress_share':
        return '#4ECDC4';
      case 'coach_glo_chat':
        return '#45B7D1';
      case 'plan_tweak_request':
        return '#96CEB4';
      case 'glow_card_share':
        return '#937AFD';
      case 'friend_referral':
        return '#FFD700';
      case 'achievement_unlocked':
        return '#FF6B6B';
      default:
        return '#a2b2b7';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return eventTime.toLocaleDateString();
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
          <Ionicons name="sparkles" size={20} color="#937AFD" />
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        {events.length > maxDisplay && (
          <TouchableOpacity onPress={onPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#937AFD" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.eventsContainer}>
        {recentEvents.map((event, index) => {
          const color = getEventColor(event.event_type, event.aura_delta);
          const icon = getEventIcon(event.event_type);
          const isPositive = event.aura_delta > 0;

          return (
            <Animated.View
              key={event.id}
              style={[
                styles.eventItem,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + index * 5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.eventContent}>
                <View style={[styles.eventIcon, { backgroundColor: `${color}20` }]}>
                  <Ionicons 
                    name={icon as any} 
                    size={16} 
                    color={color} 
                  />
                </View>
                
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDescription} numberOfLines={1}>
                    {event.event_description || event.event_type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.eventTime}>
                    {formatTimeAgo(event.event_timestamp)}
                  </Text>
                </View>

                <View style={styles.auraChange}>
                  <Text style={[
                    styles.auraChangeText,
                    { color: isPositive ? '#4ECDC4' : '#FF6B6B' }
                  ]}>
                    {isPositive ? '+' : ''}{event.aura_delta}
                  </Text>
                  <Ionicons 
                    name="sparkles" 
                    size={12} 
                    color={isPositive ? '#4ECDC4' : '#FF6B6B'} 
                  />
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
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
    width: '70%',
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
  eventsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventItem: {
    marginBottom: 8,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#232323',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#a2b2b7',
  },
  auraChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  auraChangeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
});

export default RecentAuraEvents;
