/**
 * Universal cache invalidation system that covers ALL user actions
 */

import { dataCache } from './dataCache';

/**
 * Universal cache invalidation for ANY user action that changes data
 * This ensures ALL screens update immediately regardless of the action
 */
export const invalidateCacheForAnyUserAction = (userId: string, actionType?: string) => {
  console.log(`🗑️ Universal cache invalidation for user action: ${actionType || 'unknown'}`, userId);
  
  // For ANY user action, invalidate all relevant caches
  // This ensures immediate updates across all screens
  dataCache.delete(dataCache.getUserProfileKey(userId));
  dataCache.delete(dataCache.getUserPlanKey(userId));
  dataCache.delete(`stored_plan_${userId}`);
  dataCache.delete(dataCache.getCompletionStatsKey(userId));
  dataCache.delete(dataCache.getCompletedDaysKey(userId));
};

/**
 * Hook to wrap any user action with automatic cache invalidation
 */
export const withCacheInvalidation = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  userId: string,
  actionType?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args);
      
      // Invalidate cache after successful action
      invalidateCacheForAnyUserAction(userId, actionType);
      
      return result;
    } catch (error) {
      // Don't invalidate cache on error
      throw error;
    }
  };
};

/**
 * Specific invalidation for onboarding actions
 */
export const invalidateCacheForOnboarding = (userId: string, step: number) => {
  console.log(`🗑️ Cache invalidation for onboarding step ${step}`, userId);
  
  // Onboarding updates user profile, so invalidate profile cache
  dataCache.delete(dataCache.getUserProfileKey(userId));
  
  // If it's the final step (22), also invalidate plan cache since plan might be generated
  if (step === 22) {
    dataCache.delete(dataCache.getUserPlanKey(userId));
    dataCache.delete(`stored_plan_${userId}`);
  }
};

/**
 * Specific invalidation for authentication actions
 */
export const invalidateCacheForAuth = (userId: string, action: 'login' | 'signup' | 'logout') => {
  console.log(`🗑️ Cache invalidation for auth action: ${action}`, userId);
  
  if (action === 'logout') {
    // On logout, clear all cache
    dataCache.delete(dataCache.getUserProfileKey(userId));
    dataCache.delete(dataCache.getUserPlanKey(userId));
    dataCache.delete(`stored_plan_${userId}`);
    dataCache.delete(dataCache.getCompletionStatsKey(userId));
    dataCache.delete(dataCache.getCompletedDaysKey(userId));
  } else {
    // On login/signup, invalidate profile cache
    dataCache.delete(dataCache.getUserProfileKey(userId));
  }
};

/**
 * Specific invalidation for profile actions
 */
export const invalidateCacheForProfile = (userId: string, action: 'edit' | 'photo_upload' | 'plan_edit') => {
  console.log(`🗑️ Cache invalidation for profile action: ${action}`, userId);
  
  switch (action) {
    case 'edit':
    case 'photo_upload':
      dataCache.delete(dataCache.getUserProfileKey(userId));
      break;
    case 'plan_edit':
      dataCache.delete(dataCache.getUserPlanKey(userId));
      dataCache.delete(`stored_plan_${userId}`);
      break;
  }
};
