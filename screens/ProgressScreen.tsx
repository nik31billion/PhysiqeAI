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
import { useInstantCompletionStats, useInstantAuraSummary, useInstantUserProfile } from '../utils/useInstantData';
import { useAura } from '../utils/useAura';
import { getUserDisplayName } from '../utils/profileService';
import AuraMeter from '../components/AuraMeter';
import StreakTracker from '../components/StreakTracker';
import AchievementCard from '../components/AchievementCard';
import GlowCard from '../components/GlowCard';
import AuraEarningAnimation from '../components/AuraEarningAnimation';
import DynamicMascot from '../components/DynamicMascot';
import SocialShareModal from '../components/SocialShareModal';
import ProgressComparisonModal from '../components/ProgressComparisonModal';

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
  
  // Use instant user profile for progress comparison
  const { profile: userProfile, loading: profileLoading } = useInstantUserProfile(user?.id || null);
  
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
  
  // Progress comparison modal state
  const [showProgressComparisonModal, setShowProgressComparisonModal] = useState(false);

  // Handler for share button taps
  const handleShare = async (type: string) => {
    if (type === 'Glow Card' || type === 'Glow Streak') {
      // Show the social share modal instead of direct sharing
      setShowSocialShareModal(true);
    } else if (type === 'Progress Comparison') {
      // Show the progress comparison modal
      setShowProgressComparisonModal(true);
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
      
    }
  };

  // Handle aura animation completion
  const handleAuraAnimationComplete = () => {
    setShowAuraAnimation(false);
    setAuraAnimationData(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image 
                source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')} 
                style={styles.headerLogo}
              />
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Glow Up History </Text>
              <Text style={styles.headerSubtitle}>Keep shining, {getUserDisplayName(userProfile)}!</Text>
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

          {/* Progress Comparison Card */}
          <View style={styles.progressComparisonCard}>
            <Text style={styles.progressComparisonTitle}>Progress Comparison</Text>
            <Text style={styles.progressComparisonSubtitle}>
              Track your transformation journey with before/dream/now photos
            </Text>
            
            <TouchableOpacity 
              style={[styles.progressComparisonButton, { backgroundColor: auraLevel.color }]}
              onPress={() => handleShare('Progress Comparison')}
            >
              <Image 
                source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')} 
                style={styles.progressComparisonIcon}
                resizeMode="contain"
              />
              <Text style={styles.progressComparisonButtonText}>View Progress Comparison</Text>
            </TouchableOpacity>
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
                source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')} 
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
        userName={getUserDisplayName(userProfile)}
        userId={user?.id}
        onShareSuccess={handleSocialShareSuccess}
      />

      {/* Progress Comparison Modal */}
      <ProgressComparisonModal
        visible={showProgressComparisonModal}
        onClose={() => setShowProgressComparisonModal(false)}
        userProfile={userProfile}
        userId={user?.id || ''}
        onShareSuccess={handleSocialShareSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EE',
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 28,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 100, // Space for navigation
  },

  // Header Section
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    width: 80,
  },
  headerLogo: {
    width: 80,
    height: 80,
  },
  mascotContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#BFA3F9',
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
    color: '#A9A9A9',
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
    marginBottom: 24,
  },
  milestonesTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
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
    height: 260, // Increased height to match AchievementCard and prevent overlapping
    padding: 16,
    borderRadius: 24,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  milestoneCardGreen: {
    backgroundColor: '#C9F3C5',
  },
  milestoneCardPurple: {
    backgroundColor: '#D8C5FF',
  },
  milestoneCardYellow: {
    backgroundColor: '#FFE0D6',
  },
  milestoneIcon: {
    width: 20,
    height: 20,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
    marginBottom: 8,
    lineHeight: 20,
  },
  milestoneAction: {
    marginTop: 4,
  },
  milestoneActionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
  },
  milestoneSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    lineHeight: 16,
  },

  // Weight & Stats Card
  weightStatsCard: {
    backgroundColor: '#D7F2FB',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  weightStatsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
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
    fontFamily: 'Poppins-Regular',
    color: '#1B1B1F',
    marginBottom: 2,
  },
  weightChangeValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
    marginBottom: 2,
  },
  weightChangeSince: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
  },
  bestStreak: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
  },
  weeklyProgress: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 4,
  },
  shareStreakButton: {
    backgroundColor: '#C9F3C5',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shareStreakIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  shareStreakText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#1B1B1F',
  },
  
  // New styles for Aura system
  noAchievementsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    marginHorizontal: 8,
  },
  noAchievementsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Progress Comparison Card
  progressComparisonCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  progressComparisonTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#1B1B1F',
    marginBottom: 8,
  },
  progressComparisonSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressComparisonButton: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressComparisonIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  progressComparisonButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#1B1B1F',
  },
});

export default ProgressScreen;
