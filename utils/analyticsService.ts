import analytics from '@react-native-firebase/analytics';
import { isFirebaseReady } from './firebaseConfig';

/**
 * Analytics Service
 * Centralized analytics tracking for the entire app
 * Using @react-native-firebase for production native apps
 */

// ==================== SCREEN TRACKING ====================

/**
 * Log screen view
 * Automatically called by navigation tracking
 */
export const logScreenView = async (screenName: string, screenClass?: string) => {
  if (!isFirebaseReady()) {
    console.log('📊 [Analytics - Not Ready] Screen view:', screenName);
    return;
  }

  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
    console.log('📊 [Analytics] Screen view:', screenName);
  } catch (error) {
    console.error('❌ Error logging screen view:', error);
  }
};

// ==================== ONBOARDING TRACKING ====================

/**
 * Track onboarding progress
 */
export const logOnboardingStep = async (stepNumber: number, stepName: string) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('onboarding_step_completed', {
      step_number: stepNumber,
      step_name: stepName,
      timestamp: Date.now(),
    });
    console.log(`📊 [Analytics] Onboarding step ${stepNumber}: ${stepName}`);
  } catch (error) {
    console.error('❌ Error logging onboarding step:', error);
  }
};

/**
 * Track onboarding completion
 */
export const logOnboardingCompleted = async (totalTime: number, screensCompleted: number) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('onboarding_completed', {
      total_time_seconds: totalTime,
      screens_completed: screensCompleted,
      payment_skipped: true,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Onboarding completed!');
  } catch (error) {
    console.error('❌ Error logging onboarding completion:', error);
  }
};

/**
 * Track payment screen skip
 */
export const logPaymentScreenSkipped = async () => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('payment_screen_skipped', {
      from_screen: 'OnboardingScreen20',
      to_screen: 'OnboardingScreen22',
      reason: 'screen_disabled',
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Payment screen skipped');
  } catch (error) {
    console.error('❌ Error logging payment skip:', error);
  }
};

// ==================== FEATURE USAGE TRACKING ====================

/**
 * Track workout logging
 */
export const logWorkoutLogged = async (workoutType: string, exerciseCount: number, duration?: number) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('workout_logged', {
      workout_type: workoutType,
      exercise_count: exerciseCount,
      duration_minutes: duration || 0,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Workout logged:', workoutType);
  } catch (error) {
    console.error('❌ Error logging workout:', error);
  }
};

/**
 * Track meal logging
 */
export const logMealLogged = async (mealType: string, caloriesConsumed: number) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('meal_logged', {
      meal_type: mealType,
      calories_consumed: caloriesConsumed,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Meal logged:', mealType);
  } catch (error) {
    console.error('❌ Error logging meal:', error);
  }
};

/**
 * Track meal completion
 */
export const logMealCompleted = async (mealType: string) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('meal_completed', {
      meal_type: mealType,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Meal completed:', mealType);
  } catch (error) {
    console.error('❌ Error logging meal completion:', error);
  }
};

/**
 * Track food scanner usage
 */
export const logFoodScanned = async (scanType: 'food' | 'barcode' | 'label' | 'library', success: boolean) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('food_scanned', {
      scan_type: scanType,
      success: success,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Food scanned:', scanType, success ? 'success' : 'failed');
  } catch (error) {
    console.error('❌ Error logging food scan:', error);
  }
};

/**
 * Track progress photo upload
 */
export const logProgressPhotoUploaded = async () => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('progress_photo_uploaded', {
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Progress photo uploaded');
  } catch (error) {
    console.error('❌ Error logging progress photo:', error);
  }
};

/**
 * Track Coach Glow usage
 */
export const logCoachGlowInteraction = async (interactionType: 'message_sent' | 'motivation_clicked' | 'plan_swap_clicked') => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('coach_glow_interaction', {
      interaction_type: interactionType,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Coach Glow interaction:', interactionType);
  } catch (error) {
    console.error('❌ Error logging Coach Glow interaction:', error);
  }
};

// ==================== PLAN TRACKING ====================

/**
 * Track plan generation
 */
export const logPlanGeneration = async (success: boolean, duration: number) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('plan_generated', {
      success: success,
      duration_seconds: duration,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Plan generated:', success ? 'success' : 'failed');
  } catch (error) {
    console.error('❌ Error logging plan generation:', error);
  }
};

/**
 * Track plan regeneration
 */
export const logPlanRegeneration = async () => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('plan_regenerated', {
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Plan regenerated');
  } catch (error) {
    console.error('❌ Error logging plan regeneration:', error);
  }
};

// ==================== USER PROPERTIES ====================

/**
 * Set user properties
 */
export const setUserProperties = async (properties: {
  userId?: string;
  subscriptionStatus?: 'free' | 'paid' | 'trial';
  fitnessGoal?: string;
  experienceLevel?: string;
  signupDate?: string;
}) => {
  if (!isFirebaseReady()) return;

  try {
    if (properties.userId) {
      await analytics().setUserId(properties.userId);
    }

    if (properties.subscriptionStatus) {
      await analytics().setUserProperty('subscription_status', properties.subscriptionStatus);
    }

    if (properties.fitnessGoal) {
      await analytics().setUserProperty('fitness_goal', properties.fitnessGoal);
    }

    if (properties.experienceLevel) {
      await analytics().setUserProperty('experience_level', properties.experienceLevel);
    }

    if (properties.signupDate) {
      await analytics().setUserProperty('signup_date', properties.signupDate);
    }

    console.log('📊 [Analytics] User properties set:', Object.keys(properties));
  } catch (error) {
    console.error('❌ Error setting user properties:', error);
  }
};

// ==================== SESSION TRACKING ====================

/**
 * Track app open
 */
export const logAppOpen = async () => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logAppOpen();
    console.log('📊 [Analytics] App opened');
  } catch (error) {
    console.error('❌ Error logging app open:', error);
  }
};

// ==================== ERROR TRACKING ====================

/**
 * Track errors
 */
export const logError = async (errorName: string, errorMessage: string, stackTrace?: string) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent('app_error', {
      error_name: errorName,
      error_message: errorMessage,
      stack_trace: stackTrace || 'N/A',
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Error logged:', errorName);
  } catch (error) {
    console.error('❌ Error logging error (meta!):', error);
  }
};

// ==================== CUSTOM EVENTS ====================

/**
 * Log custom event
 */
export const logCustomEvent = async (eventName: string, params?: Record<string, any>) => {
  if (!isFirebaseReady()) return;

  try {
    await analytics().logEvent(eventName, {
      ...params,
      timestamp: Date.now(),
    });
    console.log('📊 [Analytics] Custom event:', eventName, params);
  } catch (error) {
    console.error('❌ Error logging custom event:', error);
  }
};

export default {
  logScreenView,
  logOnboardingStep,
  logOnboardingCompleted,
  logPaymentScreenSkipped,
  logWorkoutLogged,
  logMealLogged,
  logMealCompleted,
  logFoodScanned,
  logProgressPhotoUploaded,
  logCoachGlowInteraction,
  logPlanGeneration,
  logPlanRegeneration,
  setUserProperties,
  logAppOpen,
  logError,
  logCustomEvent,
};
