// Export all reusable components from this file
// This will help with clean imports throughout the app

// Onboarding components
export { OnboardingErrorHandler } from './OnboardingErrorHandler';

// Coach Glow AI components
export { default as CoachGlowChat } from './CoachGlowChat';
export { 
  default as CoachGlowButton,
  CoachGlowMotivationButton,
  CoachGlowPlanSwapButton,
  CoachGlowFloatingButton,
  CoachGlowInlineButton
} from './CoachGlowButton';

// Aura System components
export { default as AuraMeter } from './AuraMeter';
export { default as StreakTracker } from './StreakTracker';
export { default as AchievementCard } from './AchievementCard';
export { default as GlowCard } from './GlowCard';
export { default as AuraEarningAnimation } from './AuraEarningAnimation';
export { default as DynamicMascot } from './DynamicMascot';
export { default as AuraStatsBar } from './AuraStatsBar';
export { default as RecentAchievements } from './RecentAchievements';
export { default as RecentAuraEvents } from './RecentAuraEvents';

// Profile components
export { default as EditProfileModal } from './EditProfileModal';
export { default as ProgressPhotoModal } from './ProgressPhotoModal';
export { default as ProgressComparisonModal } from './ProgressComparisonModal';

// Social sharing components
export { default as SocialShareModal } from './SocialShareModal';

// Notification components
export { default as NotificationSettingsModal } from './NotificationSettingsModal';
export { default as NotificationToast } from './NotificationToast';
export { default as MilestoneCelebrationModal } from './MilestoneCelebrationModal';

// Subscription components
export { default as SubscriptionManagementModal } from './SubscriptionManagementModal';

// Food Scanner components
export { default as FloatingCameraButton } from './FloatingCameraButton';
export { default as FoodScannerCamera } from './FoodScannerCamera';
export { default as FoodAnalysisResults } from './FoodAnalysisResults';
export { default as FoodAnalysisLoadingScreen } from './FoodAnalysisLoadingScreen';

// Example components (to be created):
// export { default as Button } from './Button';
// export { default as Card } from './Card';
// export { default as Input } from './Input';
// export { default as Header } from './Header';
// export { default as WorkoutCard } from './WorkoutCard';
