import { useEffect, useCallback } from 'react';
import { 
  handleDailyCheckin,
  performDailyMaintenance,
  checkMissedActivities,
  getDailyAuraSummary
} from './dailyAuraService';

interface UseDailyAuraReturn {
  handleAppOpen: () => Promise<void>;
  handlePlanTweak: () => Promise<{ success: boolean; auraEarned?: number; error?: string }>;
  handleReferral: (referredUserId: string) => Promise<{ success: boolean; auraEarned?: number; error?: string }>;
  performMaintenance: () => Promise<void>;
}

export function useDailyAura(userId: string | null): UseDailyAuraReturn {
  
  const handleAppOpen = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Handle daily check-in
      await handleDailyCheckin(userId);
      
      // Perform daily maintenance
      await performDailyMaintenance(userId);
      
      // Check for missed activities (run in background)
      checkMissedActivities(userId).catch(error => {
        
      });
    } catch (error) {
      
    }
  }, [userId]);

  const handlePlanTweak = useCallback(async () => {
    if (!userId) {
      return { success: false, error: 'No user ID' };
    }
    
    try {
      const { handlePlanTweakRequest } = await import('./dailyAuraService');
      return await handlePlanTweakRequest(userId);
    } catch (error) {
      
      return { success: false, error: 'Failed to handle plan tweak' };
    }
  }, [userId]);

  const handleReferral = useCallback(async (referredUserId: string) => {
    if (!userId) {
      return { success: false, error: 'No user ID' };
    }
    
    try {
      const { handleFriendReferral } = await import('./dailyAuraService');
      return await handleFriendReferral(userId, referredUserId);
    } catch (error) {
      
      return { success: false, error: 'Failed to handle referral' };
    }
  }, [userId]);

  const performMaintenance = useCallback(async () => {
    if (!userId) return;
    
    try {
      await performDailyMaintenance(userId);
    } catch (error) {
      
    }
  }, [userId]);

  // Auto-handle app open when component mounts
  useEffect(() => {
    if (userId) {
      handleAppOpen();
    }
  }, [userId, handleAppOpen]);

  return {
    handleAppOpen,
    handlePlanTweak,
    handleReferral,
    performMaintenance,
  };
}
