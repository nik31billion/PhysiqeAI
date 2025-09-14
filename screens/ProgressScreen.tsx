import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import { useInstantCompletionStats, useInstantAuraSummary } from '../utils/useInstantData';
import { useAura } from '../utils/useAura';
import AuraMeter from '../components/AuraMeter';
import StreakTracker from '../components/StreakTracker';
import AchievementCard from '../components/AchievementCard';
import GlowCard from '../components/GlowCard';
import AuraEarningAnimation from '../components/AuraEarningAnimation';
import DynamicMascot from '../components/DynamicMascot';
import SocialShareModal from '../components/SocialShareModal';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to get aura level
const getAuraLevel = (totalAura: number): { level: string; mood: string; color: string } => {
  if (totalAura >= 1000) {
    return { level: 'Legendary', mood: 'glowing', color: '#FFD700' };
  } else if (totalAura >= 500) {
    return { level: 'Elite', mood: 'excited', color: '#FF6B6B' };
  } else if (totalAura >= 200) {
    return { level: 'Advanced', mood: 'motivated', color: '#4ECDC4' };
  } else if (totalAura >= 100) {
    return { level: 'Intermediate', mood: 'confident', color: '#45B7D1' };
  } else if (totalAura >= 50) {
    return { level: 'Beginner+', mood: 'positive', color: '#96CEB4' };
  } else if (totalAura >= 20) {
    return { level: 'Beginner', mood: 'normal', color: '#FFEAA7' };
  } else {
    return { level: 'Starting', mood: 'cloudy', color: '#DDA0DD' };
  }
};

interface CompletionStats {
  totalDaysCompleted: number;
  currentStreak: number;
  bestStreak: number;
  completedDates: string[];
  weeklyProgress: number;
}

const ProgressScreen: React.FC = () => {
  const { user } = useAuth();
  // Use instant completion stats - zero delays, instant updates!
  const { stats, loading } = useInstantCompletionStats(user?.id || null);
  
  // Use instant aura data for truly instant updates
  const { auraSummary: instantAuraSummary, loading: instantAuraLoading } = useInstantAuraSummary(user?.id || null);
  
  // Use Aura system for achievements and other features
  const { 
    achievements, 
    loading: auraLoading, 
    shareGlowCard, 
    refreshAura,
    auraLevel: fallbackAuraLevel,
    totalAura: fallbackTotalAura,
    currentStreak: fallbackCurrentStreak,
    bestStreak: fallbackBestStreak
  } = useAura(user?.id || null);

  // Refresh achievements when screen loads
  useEffect(() => {
    if (user?.id && refreshAura) {
      refreshAura();
    }
  }, [user?.id, refreshAura]);
  
  // Use instant data when available, fallback to regular aura system
  const totalAura = instantAuraSummary?.total_aura || fallbackTotalAura || 0;
  const currentStreak = instantAuraSummary?.current_streak || fallbackCurrentStreak || 0;
  const bestStreak = instantAuraSummary?.best_streak || fallbackBestStreak || 0;
  const auraLevel = instantAuraSummary?.total_aura ? 
    getAuraLevel(instantAuraSummary.total_aura) : 
    fallbackAuraLevel;

  // Animation states
  const [showAuraAnimation, setShowAuraAnimation] = useState(false);
  const [auraAnimationData, setAuraAnimationData] = useState<{
    auraEarned: number;
    eventDescription: string;
  } | null>(null);

  // Social sharing modal state
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);

  // Handler for share button taps
  const handleShare = async (type: string) => {
    if (type === 'Glow Card' || type === 'Glow Streak') {
      // Show the social share modal instead of direct sharing
      setShowSocialShareModal(true);
    } else {
      Alert.alert('Share Feature', `${type} sharing coming soon!`);
    }
  };

  // Handler for successful social sharing
  const handleSocialShareSuccess = async (platform: string, auraEarned: number) => {
    try {
      if (auraEarned > 0) {
        // Show aura earning animation with the earned amount
        setAuraAnimationData({
          auraEarned: auraEarned,
          eventDescription: `Shared to ${platform}!`
        });
        setShowAuraAnimation(true);
      }
      // If auraEarned is 0, just close the modal silently (no animation)
    } catch (error) {
      console.error('Error showing aura animation:', error);
    }
  };

  // Handle aura animation completion
  const handleAuraAnimationComplete = () => {
    setShowAuraAnimation(false);
    setAuraAnimationData(null);
  };

  return (
    <LinearGradient
      colors={['#e9f7fa', '#f7e8fa']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <DynamicMascot
                totalAura={totalAura}
                currentStreak={currentStreak}
                size="small"
                showGlow={true}
                animated={true}
              />
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Glow Up History ✨</Text>
              <Text style={styles.headerSubtitle}>Keep shining, {user?.email?.split('@')[0] || 'Champion'}!</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.menuButton}>
                <Text style={styles.menuDots}>⋯</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Aura Meter Section */}
          <AuraMeter 
            auraSummary={instantAuraSummary}
            loading={instantAuraLoading}
            showAnimation={showAuraAnimation}
            onAnimationComplete={handleAuraAnimationComplete}
          />

          {/* Streak Tracker Section */}
          <StreakTracker 
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            showBestStreak={true}
          />

          {/* Achievements Section */}
          <View style={styles.milestonesSection}>
            <Text style={styles.milestonesTitle}>Achievements</Text>
            {achievements.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.milestonesScroll}
              >
                <View style={styles.milestonesContainer}>
                  {achievements.slice(0, 5).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onPress={() => handleShare('Glow Card')}
                      showShareButton={true}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.noAchievementsContainer}>
                <Text style={styles.noAchievementsText}>
                  Complete your first workout to unlock achievements!
                </Text>
              </View>
            )}
          </View>

          {/* Weight & Stats Card */}
          <View style={styles.weightStatsCard}>
            <Text style={styles.weightStatsTitle}>Progress & Stats</Text>
            <View style={styles.weightStatsContent}>
              <View style={styles.weightStatsLeft}>
                <View style={styles.weightChangeSection}>
                  <Text style={styles.weightChangeLabel}>Total Aura:</Text>
                  <Text style={[styles.weightChangeValue, { color: auraLevel.color }]}>
                    {totalAura}
                  </Text>
                  <Text style={styles.weightChangeSince}>{auraLevel.level} Level</Text>
                </View>
                <Text style={styles.bestStreak}>Best streak: {bestStreak} days</Text>
                <Text style={styles.weeklyProgress}>
                  This week: {Math.round(stats.weeklyProgress)}% complete
                </Text>
              </View>
            </View>
            
            {/* Floating Share Button */}
            <TouchableOpacity 
              style={[styles.shareStreakButton, { backgroundColor: auraLevel.color }]}
              onPress={() => handleShare('Glow Streak')}
            >
              <Image 
                source={require('../assets/mascot/mascot normal no bg.png')} 
                style={styles.shareStreakIcon}
                resizeMode="contain"
              />
              <Text style={styles.shareStreakText}>Share your Glow Streak</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Aura Earning Animation */}
      {showAuraAnimation && auraAnimationData && (
        <AuraEarningAnimation
          visible={showAuraAnimation}
          auraEarned={auraAnimationData.auraEarned}
          eventDescription={auraAnimationData.eventDescription}
          onComplete={handleAuraAnimationComplete}
        />
      )}

      {/* Social Share Modal */}
      <SocialShareModal
        visible={showSocialShareModal}
        onClose={() => setShowSocialShareModal(false)}
        auraSummary={instantAuraSummary}
        userName={user?.email?.split('@')[0] || 'Champion'}
        userId={user?.id}
        onShareSuccess={handleSocialShareSuccess}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 26,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 100, // Space for navigation
  },

  // Header Section
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: {
    width: 50,
  },
  mascotContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: 24,
    height: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b99bce',
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    fontSize: 20,
    color: '#888',
    transform: [{ rotate: '90deg' }],
  },

  // Glow Ring Section
  glowRingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  glowRingContainer: {
    position: 'relative',
  },
  glowRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 8,
    shadowColor: '#ffbb5b',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  glowRingInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#232323',
    marginBottom: 2,
  },
  scoreSubLabel: {
    fontSize: 12,
    color: '#888',
  },

  // Streaks Section
  streaksSection: {
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingLeft: 8,
  },
  streakDots: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  streakDotActive: {
    backgroundColor: '#ffbb5b',
  },
  streakDotInactive: {
    backgroundColor: '#e0e0e0',
  },
  streakText: {
    fontSize: 14,
    color: '#ffbb5b',
    fontWeight: '500',
  },
  bestStreakText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
    marginTop: 2,
  },

  // Milestones Section
  milestonesSection: {
    marginBottom: 32,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 18,
    paddingLeft: 8,
  },
  milestonesScroll: {
    marginLeft: -10,
  },
  milestonesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  milestoneCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneCardGreen: {
    backgroundColor: '#d6fce6',
  },
  milestoneCardPurple: {
    backgroundColor: '#ece5fb',
  },
  milestoneCardYellow: {
    backgroundColor: '#fff5c8',
  },
  milestoneIcon: {
    width: 20,
    height: 20,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 8,
    lineHeight: 18,
  },
  milestoneAction: {
    marginTop: 4,
  },
  milestoneActionText: {
    fontSize: 12,
    color: '#666',
  },
  milestoneSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },

  // Weight & Stats Card
  weightStatsCard: {
    backgroundColor: '#e3f5fc',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  weightStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 16,
  },
  weightStatsContent: {
    marginBottom: 20,
  },
  weightStatsLeft: {
    flex: 1,
  },
  weightChangeSection: {
    marginBottom: 12,
  },
  weightChangeLabel: {
    fontSize: 14,
    color: '#232323',
    marginBottom: 2,
  },
  weightChangeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 2,
  },
  weightChangeSince: {
    fontSize: 14,
    color: '#888',
  },
  bestStreak: {
    fontSize: 14,
    color: '#888',
  },
  weeklyProgress: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 4,
  },
  shareStreakButton: {
    backgroundColor: '#ffbb5b',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  shareStreakIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  shareStreakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // New styles for Aura system
  noAchievementsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  noAchievementsText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProgressScreen;
