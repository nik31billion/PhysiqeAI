/**
 * React hook for real-time data updates without fetching delays
 */

import { useState, useEffect, useCallback } from 'react';
import { realTimeStateManager } from './realTimeStateManager';
import { dataCache } from './dataCache';

/**
 * Hook for real-time user profile data
 */
export const useRealTimeUserProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Try to get from cache first - this should be instant
      const cachedProfile = dataCache.get(dataCache.getUserProfileKey(userId));
      if (cachedProfile) {
        setProfile(cachedProfile);
        setLoading(false);
        return;
      }

      // If not in cache, fetch from API in background
      setLoading(true);
      const { getCachedUserProfile } = await import('./optimizedServices');
      const freshProfile = await getCachedUserProfile(userId);
      setProfile(freshProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchInitialData();

    // Subscribe to real-time updates
    const key = dataCache.getUserProfileKey(userId);
    const unsubscribe = realTimeStateManager.subscribe(key, (newProfile) => {
      console.log('🔄 Real-time profile update received');
      setProfile(newProfile);
    });

    return unsubscribe;
  }, [userId, fetchInitialData]);

  return { profile, loading, refetch: fetchInitialData };
};

/**
 * Hook for real-time user plan data
 */
export const useRealTimeUserPlan = (userId: string | null) => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Try to get from cache first - this should be instant
      const cachedPlan = dataCache.get(dataCache.getUserPlanKey(userId));
      if (cachedPlan) {
        setPlan(cachedPlan);
        setLoading(false);
        return;
      }

      // If not in cache, fetch from API in background
      setLoading(true);
      const { getCachedUserPlan } = await import('./optimizedServices');
      const freshPlan = await getCachedUserPlan(userId);
      setPlan(freshPlan);
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchInitialData();

    // Subscribe to real-time updates
    const key = dataCache.getUserPlanKey(userId);
    const unsubscribe = realTimeStateManager.subscribe(key, (newPlan) => {
      console.log('🔄 Real-time plan update received');
      setPlan(newPlan);
    });

    return unsubscribe;
  }, [userId, fetchInitialData]);

  return { plan, loading, refetch: fetchInitialData };
};

/**
 * Hook for real-time stored plan data
 */
export const useRealTimeStoredPlan = (userId: string | null) => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Try to get from cache first - this should be instant
      const cachedPlan = dataCache.get(`stored_plan_${userId}`);
      if (cachedPlan) {
        setPlan(cachedPlan);
        setLoading(false);
        return;
      }

      // If not in cache, fetch from API in background
      setLoading(true);
      const { getCachedStoredPlan } = await import('./optimizedServices');
      const freshPlan = await getCachedStoredPlan(userId);
      setPlan(freshPlan);
    } catch (error) {
      console.error('Error fetching stored plan:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchInitialData();

    // Subscribe to real-time updates
    const key = `stored_plan_${userId}`;
    const unsubscribe = realTimeStateManager.subscribe(key, (newPlan) => {
      console.log('🔄 Real-time stored plan update received');
      setPlan(newPlan);
    });

    return unsubscribe;
  }, [userId, fetchInitialData]);

  return { plan, loading, refetch: fetchInitialData };
};

/**
 * Hook for real-time completion stats
 */
export const useRealTimeCompletionStats = (userId: string | null) => {
  const [stats, setStats] = useState<any>({
    totalDaysCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    completedDates: [],
    weeklyProgress: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Try to get from cache first - this should be instant
      const cachedStats = dataCache.get(dataCache.getCompletionStatsKey(userId));
      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }

      // If not in cache, fetch from API in background
      setLoading(true);
      const { getCachedCompletionStats } = await import('./optimizedServices');
      const freshStats = await getCachedCompletionStats(userId);
      setStats(freshStats);
    } catch (error) {
      console.error('Error fetching completion stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchInitialData();

    // Subscribe to real-time updates
    const key = dataCache.getCompletionStatsKey(userId);
    const unsubscribe = realTimeStateManager.subscribe(key, (newStats) => {
      console.log('🔄 Real-time completion stats update received');
      setStats(newStats);
    });

    return unsubscribe;
  }, [userId, fetchInitialData]);

  return { stats, loading, refetch: fetchInitialData };
};

/**
 * Hook for real-time completed days
 */
export const useRealTimeCompletedDays = (userId: string | null) => {
  const [days, setDays] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Try to get from cache first - this should be instant
      const cachedDays = dataCache.get(dataCache.getCompletedDaysKey(userId));
      if (cachedDays) {
        setDays(cachedDays);
        setLoading(false);
        return;
      }

      // If not in cache, fetch from API in background
      setLoading(true);
      const { getCachedCompletedDays } = await import('./optimizedServices');
      const freshDays = await getCachedCompletedDays(userId);
      setDays(freshDays);
    } catch (error) {
      console.error('Error fetching completed days:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchInitialData();

    // Subscribe to real-time updates
    const key = dataCache.getCompletedDaysKey(userId);
    const unsubscribe = realTimeStateManager.subscribe(key, (newDays) => {
      console.log('🔄 Real-time completed days update received');
      setDays(newDays);
    });

    return unsubscribe;
  }, [userId, fetchInitialData]);

  return { days, loading, refetch: fetchInitialData };
};
