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

  const getAchievementBackground = (category: string): string => {
    const backgrounds: { [key: string]: string } = {
      streak: '#FFE0D6', // Coral tint
      milestone: '#C9F3C5', // Mint
      social: '#D8C5FF', // Lavender
      progress: '#C9F3C5', // Mint
    };
    
    return backgrounds[category] || backgrounds.milestone;
  };

  const formatUnlockDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const backgroundColor = getAchievementBackground(achievement.achievement?.category || 'milestone');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.card, { backgroundColor }]}
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
          <Text style={styles.description} numberOfLines={2}>{achievement.achievement?.description}</Text>
          
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
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  card: {
    width: 140,
    height: 260, // Further increased height to prevent any overlapping
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
    textAlign: 'left',
    marginBottom: 10,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'left',
    marginBottom: 14,
    lineHeight: 16,
  },
  auraReward: {
    backgroundColor: 'rgba(255, 111, 76, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  auraRewardText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#FF6F4C',
  },
  unlockDate: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'left',
    marginBottom: 16,
  },
  shareButton: {
    marginTop: 16, // Fixed spacing instead of auto
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(27, 27, 31, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  shareButtonText: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#1B1B1F',
  },
});

export default AchievementCard;
