import { useState, useEffect, useCallback } from 'react';
import { 
  UserAuraSummary, 
  UserAchievement, 
  AuraEvent,
  getUserAuraSummary,
  getAuraEvents,
  getUserAchievements,
  checkAchievements,
  handleGlowCardShare,
  addAuraPoints,
  AURA_EVENT_TYPES,
  AURA_POINTS
} from './auraService';

interface UseAuraReturn {
  // Data
  auraSummary: UserAuraSummary | null;
  achievements: UserAchievement[];
  recentEvents: AuraEvent[];
  
  // Loading states
  loading: boolean;
  loadingAchievements: boolean;
  loadingEvents: boolean;
  
  // Actions
  refreshAura: () => Promise<void>;
  shareGlowCard: () => Promise<{ success: boolean; auraEarned?: number; error?: string }>;
  addAuraPoints: (eventType: string, auraDelta: number, description?: string, metadata?: any) => Promise<{ success: boolean; newTotal?: number; error?: string }>;
  
  // Computed values
  auraLevel: { level: string; mood: string; color: string };
  totalAura: number;
  currentStreak: number;
  bestStreak: number;
}

export function useAura(userId: string | null): UseAuraReturn {
  const [auraSummary, setAuraSummary] = useState<UserAuraSummary | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [recentEvents, setRecentEvents] = useState<AuraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Computed values
  const totalAura = auraSummary?.total_aura || 0;
  const currentStreak = auraSummary?.current_streak || 0;
  const bestStreak = auraSummary?.best_streak || 0;
  
  const auraLevel = {
    level: totalAura >= 1000 ? 'Legendary' : 
           totalAura >= 500 ? 'Elite' : 
           totalAura >= 200 ? 'Advanced' : 
           totalAura >= 100 ? 'Intermediate' : 
           totalAura >= 50 ? 'Beginner+' : 
           totalAura >= 20 ? 'Beginner' : 'Starting',
    mood: totalAura >= 1000 ? 'glowing' : 
          totalAura >= 500 ? 'excited' : 
          totalAura >= 200 ? 'motivated' : 
          totalAura >= 100 ? 'confident' : 
          totalAura >= 50 ? 'positive' : 
          totalAura >= 20 ? 'normal' : 'cloudy',
    color: totalAura >= 1000 ? '#FFD700' : 
           totalAura >= 500 ? '#FF6B6B' : 
           totalAura >= 200 ? '#4ECDC4' : 
           totalAura >= 100 ? '#45B7D1' : 
           totalAura >= 50 ? '#96CEB4' : 
           totalAura >= 20 ? '#FFEAA7' : '#DDA0DD'
  };

  const fetchAuraSummary = useCallback(async () => {
    if (!userId) return;
    
    try {
      const summary = await getUserAuraSummary(userId);
      setAuraSummary(summary);
    } catch (error) {
      
    }
  }, [userId]);

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;
    
    setLoadingAchievements(true);
    try {
      const result = await getUserAchievements(userId);
      if (result.success && result.data) {
        setAchievements(result.data);
      }
    } catch (error) {
      
    } finally {
      setLoadingAchievements(false);
    }
  }, [userId]);

  const fetchRecentEvents = useCallback(async () => {
    if (!userId) return;
    
    setLoadingEvents(true);
    try {
      const result = await getAuraEvents(userId, 20);
      if (result.success && result.data) {
        setRecentEvents(result.data);
      }
    } catch (error) {
      
    } finally {
      setLoadingEvents(false);
    }
  }, [userId]);

  const refreshAura = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchAuraSummary(),
        fetchAchievements(),
        fetchRecentEvents(),
      ]);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, [userId, fetchAuraSummary, fetchAchievements, fetchRecentEvents]);

  // Auto-refresh achievements when user completes activities
  useEffect(() => {
    if (userId) {
      // Refresh achievements every 30 seconds to catch new unlocks
      const interval = setInterval(() => {
        fetchAchievements();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, fetchAchievements]);

  const shareGlowCard = useCallback(async () => {
    if (!userId) return { success: false, error: 'No user ID' };
    
    try {
      const result = await handleGlowCardShare(userId);
      if (result.success) {
        // Refresh aura summary to get updated totals
        await fetchAuraSummary();
      }
      return result;
    } catch (error) {
      
      return { success: false, error: 'Failed to share glow card' };
    }
  }, [userId, fetchAuraSummary]);

  const addAuraPointsWrapper = useCallback(async (
    eventType: string, 
    auraDelta: number, 
    description?: string, 
    metadata?: any
  ) => {
    if (!userId) return { success: false, error: 'No user ID' };
    
    try {
      const result = await addAuraPoints(userId, eventType, auraDelta, description, metadata);
      if (result.success) {
        // Refresh aura summary to get updated totals
        await fetchAuraSummary();
        // Check for new achievements
        await checkAchievements(userId);
        // Refresh achievements
        await fetchAchievements();
      }
      return result;
    } catch (error) {
      
      return { success: false, error: 'Failed to add aura points' };
    }
  }, [userId, fetchAuraSummary, fetchAchievements]);

  // Initial load
  useEffect(() => {
    if (userId) {
      refreshAura();
    }
  }, [userId, refreshAura]);

  // Auto-refresh every 30 seconds when component is active
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      fetchAuraSummary();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, fetchAuraSummary]);

  return {
    // Data
    auraSummary,
    achievements,
    recentEvents,
    
    // Loading states
    loading,
    loadingAchievements,
    loadingEvents,
    
    // Actions
    refreshAura,
    shareGlowCard,
    addAuraPoints: addAuraPointsWrapper,
    
    // Computed values
    auraLevel,
    totalAura,
    currentStreak,
    bestStreak,
  };
}
