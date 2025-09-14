import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAuraSummary, getAuraLevel } from '../utils/auraService';

const { width: screenWidth } = Dimensions.get('window');

interface GlowCardProps {
  auraSummary: UserAuraSummary | null;
  userName?: string;
  showAppBranding?: boolean;
}

const GlowCard: React.FC<GlowCardProps> = ({
  auraSummary,
  userName = 'Champion',
  showAppBranding = true,
}) => {
  const totalAura = auraSummary?.total_aura || 0;
  const currentStreak = auraSummary?.current_streak || 0;
  const bestStreak = auraSummary?.best_streak || 0;
  const auraLevel = getAuraLevel(totalAura);

  const getMotivationalMessage = () => {
    if (currentStreak === 0) {
      return 'Ready to start your journey?';
    } else if (currentStreak < 7) {
      return 'Building momentum!';
    } else if (currentStreak < 14) {
      return 'You\'re on fire!';
    } else if (currentStreak < 30) {
      return 'Unstoppable dedication!';
    } else {
      return 'Legendary commitment!';
    }
  };

  const getMascotImage = () => {
    if (currentStreak === 0) {
      return require('../assets/mascot/mascot normal no bg.png');
    } else if (currentStreak < 3) {
      return require('../assets/mascot/excited no bg.png');
    } else if (currentStreak < 7) {
      return require('../assets/mascot/working out no bg.png');
    } else if (currentStreak < 14) {
      return require('../assets/mascot/crown no bg.png');
    } else if (currentStreak < 30) {
      return require('../assets/mascot/medal no bg.png');
    } else {
      return require('../assets/mascot/crown no bg.png');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[auraLevel.color, `${auraLevel.color}80`, '#FFFFFF']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.mascotContainer}>
            <Image
              source={getMascotImage()}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>Flex Aura</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Aura Display */}
          <View style={styles.auraSection}>
            <Text style={styles.auraLabel}>Aura Level</Text>
            <Text style={[styles.auraNumber, { color: auraLevel.color }]}>
              {totalAura}
            </Text>
            <Text style={[styles.auraLevel, { color: auraLevel.color }]}>
              {auraLevel.level}
            </Text>
          </View>

          {/* Streak Display */}
          <View style={styles.streakSection}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakUnit}>days</Text>
            {bestStreak > currentStreak && (
              <Text style={styles.bestStreak}>
                Best: {bestStreak} days
              </Text>
            )}
          </View>

          {/* Motivational Message */}
          <View style={styles.messageSection}>
            <Text style={styles.motivationalMessage}>
              {getMotivationalMessage()}
            </Text>
          </View>
        </View>

        {/* Footer */}
        {showAppBranding && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Get your Aura on Flex Aura! ✨
            </Text>
            <Text style={styles.hashtag}>#FlexAura #GlowUp</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mascot: {
    width: 40,
    height: 40,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  auraSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  auraLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  auraNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  auraLevel: {
    fontSize: 16,
    fontWeight: '600',
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  streakUnit: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  bestStreak: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 4,
  },
  messageSection: {
    alignItems: 'center',
  },
  motivationalMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hashtag: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default GlowCard;
