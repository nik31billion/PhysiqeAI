// Export all utility functions and services from this file
// This will help with clean imports throughout the app

// Auth utilities
export { useAuth, AuthProvider } from './AuthContext';

// Onboarding utilities
export { useOnboarding, OnboardingProvider } from './OnboardingContext';
export { OnboardingService } from './onboardingService';
export { useOnboardingNavigation } from './useOnboardingNavigation';

// Supabase client
export { supabase } from './supabase';

// Configuration
export { SUPABASE_CONFIG } from './config';

// Plan services
export * from './planService';

// Profile services (excluding UserPlan to avoid conflict)
export { 
  fetchUserProfile, 
  fetchUserActivePlan, 
  getUserDisplayName, 
  formatHeight, 
  formatWeight, 
  getDietPlanName, 
  getDietPlanPills,
  UserProfile
} from './profileService';

// Optimized services and caching
export * from './dataCache';
export * from './optimizedServices';
// Removed unused files: dataPreloader, useOptimizedLoading, smartCacheInvalidation, useAutoRefresh
export * from './universalCacheInvalidation';
export * from './instantDataManager';
export * from './useInstantData';

// Coach Glow AI assistant service
export * from './coachGlowService';
export * from './useCoachGlow';

// Aura System services
export {
  // Types
  UserAuraSummary,
  UserAchievement,
  AuraEvent,
  Achievement,
  WeightEntry,
  // Functions
  getUserAuraSummary,
  addAuraPoints,
  getAuraEvents,
  getUserAchievements,
  checkAchievements,
  handleDailyWorkoutCompletion,
  handleMealCompletion,
  updateStreak,
  handleProgressPhotoUpload,
  handleMeasurementUpdate,
  handleCoachGloInteraction,
  handleGlowCardShare,
  handleMissedWorkout,
  getWeightTracking,
  addWeightEntry,
  getAuraLevel,
  resetDailyCounters,
  // Constants
  AURA_EVENT_TYPES,
  AURA_POINTS,
  DAILY_LIMITS
} from './auraService';

export { useAura } from './useAura';

export {
  handleDailyCheckin,
  handlePlanTweakRequest,
  handleFriendReferral,
  handleMilestoneAchievement,
  performDailyMaintenance,
  checkMissedActivities,
  getDailyAuraSummary
} from './dailyAuraService';

export { useDailyAura } from './useDailyAura';

export {
  shareGlowCard,
  shareMilestone,
  shareAchievement,
  shareStreakMilestone,
  shareWorkoutCompletion,
  shareMealCompletion,
  shareReferralLink,
  isSharingAvailable,
  showShareOptions
} from './sharingService';