import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAchievement } from '../utils/auraService';

interface AchievementCardProps {
  achievement: UserAchievement;
  onPress?: () => void;
  showShareButton?: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  showShareButton = true,
}) => {
  const getAchievementIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      star: require('../assets/mascot/excited no bg.png'),
      fire: require('../assets/mascot/working out no bg.png'),
      crown: require('../assets/mascot/crown no bg.png'),
      trophy: require('../assets/mascot/medal no bg.png'),
      medal: require('../assets/mascot/medal no bg.png'),
      calendar: require('../assets/mascot/mascot normal no bg.png'),
      moon: require('../assets/mascot/mascot relaxed no bg.png'),
      target: require('../assets/mascot/thinking no bg.png'),
      scale: require('../assets/mascot/measuring tape no bg.png'),
      share: require('../assets/mascot/phone no bg.png'),
      butterfly: require('../assets/mascot/dancing no bg.png'),
      users: require('../assets/mascot/mascot thumbs up no bg.png'),
      camera: require('../assets/mascot/mascot normal no bg.png'),
      ruler: require('../assets/mascot/measuring tape no bg.png'),
      chat: require('../assets/mascot/thinking no bg.png'),
      settings: require('../assets/mascot/working out no bg.png'),
    };
    
    return iconMap[iconName] || iconMap.star;
  };

  const getAchievementGradient = (category: string): [string, string] => {
    const gradients: { [key: string]: [string, string] } = {
      streak: ['#FF6B6B', '#FF8E53'],
      milestone: ['#4ECDC4', '#44A08D'],
      social: ['#667eea', '#764ba2'],
      progress: ['#f093fb', '#f5576c'],
    };
    
    return gradients[category] || gradients.milestone;
  };

  const formatUnlockDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const gradientColors = getAchievementGradient(achievement.achievement?.category || 'milestone');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Achievement Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={getAchievementIcon(achievement.achievement?.icon_name || 'star')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* Achievement Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{achievement.achievement?.name}</Text>
          <Text style={styles.description}>{achievement.achievement?.description}</Text>
          
          {/* Aura Reward */}
          <View style={styles.auraReward}>
            <Text style={styles.auraRewardText}>+{achievement.aura_earned} Aura</Text>
          </View>

          {/* Unlock Date */}
          <Text style={styles.unlockDate}>
            Unlocked {formatUnlockDate(achievement.unlocked_at)}
          </Text>
        </View>

        {/* Share Button */}
        {showShareButton && (
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📸 Share</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  card: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 32,
    height: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  description: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    opacity: 0.9,
  },
  auraReward: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  auraRewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unlockDate: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  shareButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AchievementCard;
