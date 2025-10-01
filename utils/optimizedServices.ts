/**
 * Optimized service functions with caching to eliminate loading delays
 */

import { supabase } from './supabase';
import { dataCache } from './dataCache';
import { fetchUserProfile, fetchUserActivePlan, UserProfile, UserPlan } from './profileService';
import { getUserActivePlan, StoredPlan } from './planService';

// Optimized user profile fetching with cache
export const getCachedUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const cacheKey = dataCache.getUserProfileKey(userId);
  
  // Try to get from cache first
  const cachedProfile = dataCache.get<UserProfile>(cacheKey);
  if (cachedProfile) {
    
    return cachedProfile;
  }

  // Fetch from API if not in cache
  
  const profile = await fetchUserProfile(userId);
  
  if (profile) {
    // Cache for 10 minutes (profile data doesn't change often)
    dataCache.set(cacheKey, profile, 10 * 60 * 1000);
  }
  
  return profile;
};

// Optimized user plan fetching with cache (for profile service)
export const getCachedUserPlan = async (userId: string): Promise<UserPlan | null> => {
  const cacheKey = dataCache.getUserPlanKey(userId);
  
  // Try to get from cache first
  const cachedPlan = dataCache.get<UserPlan>(cacheKey);
  if (cachedPlan) {
    
    return cachedPlan;
  }

  // Fetch from API if not in cache
  
  const plan = await fetchUserActivePlan(userId);
  
  if (plan) {
    // Cache for 5 minutes (plan data might change more frequently)
    dataCache.set(cacheKey, plan, 5 * 60 * 1000);
  }
  
  return plan;
};

// Optimized stored plan fetching with cache (for plan service)
export const getCachedStoredPlan = async (userId: string): Promise<StoredPlan | null> => {
  const cacheKey = `stored_plan_${userId}`;
  
  // Try to get from cache first
  const cachedPlan = dataCache.get<StoredPlan>(cacheKey);
  if (cachedPlan) {
    
    return cachedPlan;
  }

  // Fetch from API if not in cache
  
  const plan = await getUserActivePlan(userId);
  
  if (plan) {
    // Cache for 5 minutes (plan data might change more frequently)
    dataCache.set(cacheKey, plan, 5 * 60 * 1000);
  }
  
  return plan;
};

// Optimized completion stats fetching with cache
export const getCachedCompletionStats = async (userId: string) => {
  try {
    const cacheKey = dataCache.getCompletionStatsKey(userId);
    
    // Try to get from cache first
    const cachedStats = dataCache.get(cacheKey);
    if (cachedStats) {
      
      return cachedStats;
    }

    // Fetch from API if not in cache
    
    const { data: completions, error } = await supabase
      .from('day_completions')
      .select('completed_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('completed_date', { ascending: false });

    if (error) {
      console.log('Error fetching completion stats:', error);
      return {
        totalDaysCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        completedDates: [],
        weeklyProgress: 0
      };
    }

    console.log('Fetched completion stats from database');

    // Handle different data structures safely with extra validation
    let completedDates: string[] = [];
    try {
      if (completions) {
        if (Array.isArray(completions)) {
          // Validate each item has completed_date property
          completedDates = completions
            .filter(item => item && typeof item === 'object' && 'completed_date' in item)
            .map(item => item.completed_date);
        } else if (typeof completions === 'object' && completions !== null) {
          // Handle case where data might be an object with array property
          if ('completed_date' in completions) {
            completedDates = [(completions as any).completed_date];
          }
        }
      }
    } catch (mapError) {
      console.log('Error mapping completion dates:', mapError);
      completedDates = [];
    }
    const stats = calculateStats(completedDates);
    
    // Cache for 2 minutes (completion data changes frequently)
    dataCache.set(cacheKey, stats, 2 * 60 * 1000);
    
    return stats;
  } catch (error) {
    console.log('Error in getCachedCompletionStats:', error);
    return {
      totalDaysCompleted: 0,
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      weeklyProgress: 0
    };
  }
};

// Optimized completed days fetching with cache
export const getCachedCompletedDays = async (userId: string): Promise<Set<string>> => {
  try {
    const cacheKey = dataCache.getCompletedDaysKey(userId);
    
    // Try to get from cache first
    const cachedDays = dataCache.get<string[]>(cacheKey);
    if (cachedDays) {
      
      return new Set(cachedDays);
    }

    // Fetch from API if not in cache
    
    const { data, error } = await supabase
      .from('day_completions')
      .select('completed_date')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.log('Error fetching completed days:', error);
      return new Set();
    }

    console.log('Fetched completed days from database');

    // Handle different data structures safely with extra validation
    let completedDates: string[] = [];
    try {
      if (data) {
        if (Array.isArray(data)) {
          // Validate each item has completed_date property
          completedDates = data
            .filter(item => item && typeof item === 'object' && 'completed_date' in item)
            .map(item => item.completed_date);
        } else if (typeof data === 'object' && data !== null) {
          // Handle case where data might be an object with array property
          if ('completed_date' in data) {
            completedDates = [(data as any).completed_date];
          }
        }
      }
    } catch (mapError) {
      console.log('Error mapping completed dates:', mapError);
      completedDates = [];
    }
    
    // Cache for 2 minutes
    dataCache.set(cacheKey, completedDates, 2 * 60 * 1000);
    
    return new Set(completedDates);
  } catch (error) {
    console.log('Error in getCachedCompletedDays:', error);
    return new Set();
  }
};

// Helper function to calculate stats (moved from ProgressScreen)
const calculateStats = (completedDates: string[]) => {
  if (completedDates.length === 0) {
    return {
      totalDaysCompleted: 0,
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      weeklyProgress: 0
    };
  }

  // Sort dates in ascending order
  const sortedDates = [...completedDates].sort();
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  for (let i = 0; i < 30; i++) { // Check last 30 days max
    const dateStr = checkDate.toISOString().split('T')[0];
    if (sortedDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr);
    
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = currentDate;
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  // Calculate weekly progress (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  
  const weeklyCompletions = sortedDates.filter(date => date >= weekAgoStr);
  const weeklyProgress = Math.min(weeklyCompletions.length / 7 * 100, 100);

  return {
    totalDaysCompleted: completedDates.length,
    currentStreak,
    bestStreak,
    completedDates: sortedDates,
    weeklyProgress
  };
};

// Removed invalidateUserCache - now handled by real-time state manager

// Function to test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    // Test basic connection
    const { data, error } = await supabase
      .from('day_completions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('Database connection test failed:', error);
      return false;
    }
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.log('Database connection test error:', error);
    return false;
  }
};

// Function to preload data for instant access
export const preloadUserData = async (userId: string) => {
  console.log('Preloading user data for:', userId);
  try {
    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log('Database not connected, skipping preload');
    }
    
    // Preload all user data in parallel
    await Promise.all([
      getCachedUserProfile(userId),
      getCachedUserPlan(userId),
      getCachedStoredPlan(userId),
      getCachedCompletionStats(userId),
      getCachedCompletedDays(userId)
    ]);
    
    console.log('User data preloaded successfully');
  } catch (error) {
    console.log('Error preloading user data:', error);
  }
};
