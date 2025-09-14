/**
 * Instant data hooks - provide truly instant data access with zero delays
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getInstantUserProfile, 
  getInstantUserPlan, 
  getInstantStoredPlan, 
  getInstantCompletionStats, 
  getInstantCompletedDays,
  getInstantAuraSummary,
  subscribeToDataChanges,
  loadUserData,
  loadAuraData
} from './instantDataManager';

/**
 * Hook for instant user profile data
 */
export const useInstantUserProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = useCallback(() => {
    if (userId) {
      const instantProfile = getInstantUserProfile(userId);
      setProfile(instantProfile);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get instant data immediately
    updateProfile();

    // Subscribe to changes for instant updates
    const unsubscribe = subscribeToDataChanges(updateProfile);

    // Load data from API if not available
    if (!profile) {
      loadUserData(userId);
    }

    return unsubscribe;
  }, [userId, updateProfile, profile]);

  return { profile, loading };
};

/**
 * Hook for instant user plan data
 */
export const useInstantUserPlan = (userId: string | null) => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const updatePlan = useCallback(() => {
    if (userId) {
      const instantPlan = getInstantUserPlan(userId);
      setPlan(instantPlan);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get instant data immediately
    updatePlan();

    // Subscribe to changes for instant updates
    const unsubscribe = subscribeToDataChanges(updatePlan);

    // Load data from API if not available
    if (!plan) {
      loadUserData(userId);
    }

    return unsubscribe;
  }, [userId, updatePlan, plan]);

  return { plan, loading };
};

/**
 * Hook for instant stored plan data
 */
export const useInstantStoredPlan = (userId: string | null) => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const updatePlan = useCallback(() => {
    if (userId) {
      const instantPlan = getInstantStoredPlan(userId);
      setPlan(instantPlan);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get instant data immediately
    updatePlan();

    // Subscribe to changes for instant updates
    const unsubscribe = subscribeToDataChanges(updatePlan);

    // Load data from API if not available
    if (!plan) {
      loadUserData(userId);
    }

    return unsubscribe;
  }, [userId, updatePlan, plan]);

  return { plan, loading };
};

/**
 * Hook for instant completion stats
 */
export const useInstantCompletionStats = (userId: string | null) => {
  const [stats, setStats] = useState<any>({
    totalDaysCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    completedDates: [],
    weeklyProgress: 0
  });
  const [loading, setLoading] = useState(true);

  const updateStats = useCallback(() => {
    if (userId) {
      const instantStats = getInstantCompletionStats(userId);
      setStats(instantStats);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get instant data immediately
    updateStats();

    // Subscribe to changes for instant updates
    const unsubscribe = subscribeToDataChanges(updateStats);

    // Load data from API if not available
    if (!stats || stats.totalDaysCompleted === 0) {
      loadUserData(userId);
    }

    return unsubscribe;
  }, [userId, updateStats, stats]);

  return { stats, loading };
};

/**
 * Hook for instant completed days
 */
export const useInstantCompletedDays = (userId: string | null) => {
  const [days, setDays] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const updateDays = useCallback(() => {
    if (userId) {
      const instantDays = getInstantCompletedDays(userId);
      setDays(instantDays);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get instant data immediately
    updateDays();

    // Subscribe to changes for instant updates
    const unsubscribe = subscribeToDataChanges(updateDays);

    // Load data from API if not available
    if (!days) {
      loadUserData(userId);
    }

    return unsubscribe;
  }, [userId, updateDays, days]);

  return { days, loading };
};

/**
 * Hook for instant aura summary data
 */
export const useInstantAuraSummary = (userId: string | null) => {
  const [auraSummary, setAuraSummary] = useState<any>({
    total_aura: 0,
    current_streak: 0,
    best_streak: 0,
    daily_aura_earned: 0,
    achievements_unlocked: [],
    shares_today: 0,
    coach_glo_interactions_today: 0
  });
  const [loading, setLoading] = useState(true);

  const updateAuraSummary = useCallback(() => {
    if (userId) {
      const instantAura = getInstantAuraSummary(userId);
      setAuraSummary(instantAura);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get instant data immediately
    updateAuraSummary();

    // Subscribe to changes for instant updates
    const unsubscribe = subscribeToDataChanges(updateAuraSummary);

    // Load data from API if not available
    if (!auraSummary || auraSummary.total_aura === 0) {
      loadAuraData(userId);
    }

    return unsubscribe;
  }, [userId, updateAuraSummary, auraSummary]);

  return { auraSummary, loading };
};
