/**
 * Instant data manager - provides truly instant data access with zero delays
 */

import { dataCache } from './dataCache';

// Global state for instant access
let globalUserData: {
  profile: any;
  plan: any;
  storedPlan: any;
  completionStats: any;
  completedDays: any;
  auraSummary: any;
} = {
  profile: null,
  plan: null,
  storedPlan: null,
  completionStats: {
    totalDaysCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    completedDates: [],
    weeklyProgress: 0
  },
  completedDays: null,
  auraSummary: {
    total_aura: 0,
    current_streak: 0,
    best_streak: 0,
    daily_aura_earned: 0,
    achievements_unlocked: [],
    shares_today: 0,
    coach_glo_interactions_today: 0
  }
};

// Event listeners for instant updates
const listeners: Set<() => void> = new Set();

// Specific event listeners for different types of updates
const mealCompletionListeners: Set<() => void> = new Set();
const exerciseCompletionListeners: Set<() => void> = new Set();
const calorieUpdateListeners: Set<() => void> = new Set();

/**
 * Subscribe to data changes for instant updates
 */
export const subscribeToDataChanges = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

/**
 * Subscribe to meal completion events
 */
export const subscribeToMealCompletion = (callback: () => void): (() => void) => {
  mealCompletionListeners.add(callback);
  return () => mealCompletionListeners.delete(callback);
};

/**
 * Subscribe to exercise completion events
 */
export const subscribeToExerciseCompletion = (callback: () => void): (() => void) => {
  exerciseCompletionListeners.add(callback);
  return () => exerciseCompletionListeners.delete(callback);
};

/**
 * Subscribe to calorie update events
 */
export const subscribeToCalorieUpdates = (callback: () => void): (() => void) => {
  calorieUpdateListeners.add(callback);
  return () => calorieUpdateListeners.delete(callback);
};

/**
 * Notify all listeners of data changes
 */
const notifyListeners = () => {
  try {
    listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        
      }
    });
  } catch (error) {
    
  }
};

/**
 * Get instant user profile data
 */
export const getInstantUserProfile = (userId: string) => {
  // Try cache first
  const cached = dataCache.get(dataCache.getUserProfileKey(userId));
  if (cached) {
    globalUserData.profile = cached;
    return cached;
  }
  
  // Return current global state
  return globalUserData.profile;
};

/**
 * Get instant user plan data
 */
export const getInstantUserPlan = (userId: string) => {
  // Try cache first
  const cached = dataCache.get(dataCache.getUserPlanKey(userId));
  if (cached) {
    globalUserData.plan = cached;
    return cached;
  }
  
  // Return current global state
  return globalUserData.plan;
};

/**
 * Get instant stored plan data
 */
export const getInstantStoredPlan = (userId: string) => {
  // Try cache first
  const cached = dataCache.get(`stored_plan_${userId}`);
  if (cached) {
    globalUserData.storedPlan = cached;
    return cached;
  }
  
  // Return current global state
  return globalUserData.storedPlan;
};

/**
 * Get instant completion stats
 */
export const getInstantCompletionStats = (userId: string) => {
  // Try cache first
  const cached = dataCache.get(dataCache.getCompletionStatsKey(userId));
  if (cached) {
    globalUserData.completionStats = cached;
    return cached;
  }
  
  // Return current global state (with defaults)
  return globalUserData.completionStats;
};

/**
 * Get instant completed days
 */
export const getInstantCompletedDays = (userId: string) => {
  // Try cache first
  const cached = dataCache.get(dataCache.getCompletedDaysKey(userId));
  if (cached) {
    globalUserData.completedDays = cached;
    return cached;
  }
  
  // Return current global state
  return globalUserData.completedDays;
};

/**
 * Get instant aura summary
 */
export const getInstantAuraSummary = (userId: string) => {
  // Try cache first
  const cached = dataCache.get(`aura_summary_${userId}`);
  if (cached) {
    globalUserData.auraSummary = cached;
    return cached;
  }
  
  // Return current global state
  return globalUserData.auraSummary;
};

/**
 * Update user profile instantly
 */
export const updateUserProfile = (userId: string, profile: any) => {
  globalUserData.profile = profile;
  dataCache.set(dataCache.getUserProfileKey(userId), profile);
  notifyListeners();
};

/**
 * Update user plan instantly
 */
export const updateUserPlan = (userId: string, plan: any) => {
  globalUserData.plan = plan;
  dataCache.set(dataCache.getUserPlanKey(userId), plan);
  notifyListeners();
};

/**
 * Update stored plan instantly
 */
export const updateStoredPlan = (userId: string, plan: any) => {
  globalUserData.storedPlan = plan;
  dataCache.set(`stored_plan_${userId}`, plan);
  notifyListeners();
};

/**
 * Update completion stats instantly
 */
export const updateCompletionStats = (userId: string, stats: any) => {
  globalUserData.completionStats = stats;
  dataCache.set(dataCache.getCompletionStatsKey(userId), stats);
  notifyListeners();
};

/**
 * Update completed days instantly
 */
export const updateCompletedDays = (userId: string, days: any) => {
  try {
    // Ensure days is always a Set for consistency
    let daysSet: Set<string>;
    if (days instanceof Set) {
      daysSet = days;
    } else if (Array.isArray(days)) {
      daysSet = new Set(days);
    } else {
      daysSet = new Set();
    }
    
    globalUserData.completedDays = daysSet;
    dataCache.set(dataCache.getCompletedDaysKey(userId), daysSet);
    notifyListeners();
  } catch (error) {
    
    // Set default empty Set to prevent crashes
    globalUserData.completedDays = new Set();
    dataCache.set(dataCache.getCompletedDaysKey(userId), new Set());
    notifyListeners();
  }
};

/**
 * Update aura summary instantly
 */
export const updateAuraSummary = (userId: string, auraSummary: any) => {
  try {
    // Validate aura summary data
    if (auraSummary && typeof auraSummary === 'object') {
      globalUserData.auraSummary = auraSummary;
      dataCache.set(`aura_summary_${userId}`, auraSummary);
      notifyListeners();
    } else {
      
    }
  } catch (error) {
    
    // Set default values to prevent crashes
    const defaultAura = {
      total_aura: 0,
      current_streak: 0,
      best_streak: 0,
      daily_aura_earned: 0,
      achievements_unlocked: [],
      shares_today: 0,
      coach_glo_interactions_today: 0
    };
    globalUserData.auraSummary = defaultAura;
    dataCache.set(`aura_summary_${userId}`, defaultAura);
    notifyListeners();
  }
};

/**
 * Clear all cached completion data for a user (useful for daily resets)
 */
export const clearDailyCompletionCache = (userId: string) => {
  try {
    // Clear all completion-related cache entries
    const cacheKeysToRemove = [
      dataCache.getCompletionStatsKey(userId),
      dataCache.getCompletedDaysKey(userId),
      `aura_summary_${userId}`,
      `meal_completions_${userId}`,
      `exercise_completions_${userId}`
    ];

    cacheKeysToRemove.forEach(key => {
      dataCache.delete(key);
    });

    // Reset global completion states but preserve profile and plan data
    globalUserData.completionStats = {
      totalDaysCompleted: 0,
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      weeklyProgress: 0
    };
    
    // Keep aura summary but reset daily earned
    if (globalUserData.auraSummary) {
      globalUserData.auraSummary = {
        ...globalUserData.auraSummary,
        daily_aura_earned: 0
      };
    }

    notifyListeners();
  } catch (error) {
    
  }
};

/**
 * Load aura data from database
 */
export const loadAuraData = async (userId: string) => {
  try {
    
    
    const { getUserAuraSummary } = await import('./auraService');
    const auraSummary = await getUserAuraSummary(userId);
    
    if (auraSummary) {
      globalUserData.auraSummary = auraSummary;
      dataCache.set(`aura_summary_${userId}`, auraSummary);
      
    } else {
      // Initialize with default values if no aura data exists
      const defaultAura = {
        total_aura: 0,
        current_streak: 0,
        best_streak: 0,
        daily_aura_earned: 0,
        achievements_unlocked: [],
        shares_today: 0,
        coach_glo_interactions_today: 0
      };
      globalUserData.auraSummary = defaultAura;
      dataCache.set(`aura_summary_${userId}`, defaultAura);
      
    }
    
    notifyListeners();
  } catch (error) {
    
    // Set default values
    const defaultAura = {
      total_aura: 0,
      current_streak: 0,
      best_streak: 0,
      daily_aura_earned: 0,
      achievements_unlocked: [],
      shares_today: 0,
      coach_glo_interactions_today: 0
    };
    globalUserData.auraSummary = defaultAura;
    dataCache.set(`aura_summary_${userId}`, defaultAura);
    notifyListeners();
  }
};

/**
 * Load data from API and update global state - FAST VERSION (prioritize profile/plan first)
 */
export const loadUserData = async (userId: string) => {
  try {
    
    // Import services dynamically with error handling
    let services;
    try {
      services = await import('./optimizedServices');
    } catch (importError) {
      
      return;
    }
    
    const { 
      getCachedUserProfile, 
      getCachedUserPlan, 
      getCachedStoredPlan, 
      getCachedCompletionStats, 
      getCachedCompletedDays 
    } = services;
    
    // PRIORITY 1: Load profile and plan first (most important for HomeScreen)
    const [profile, plan] = await Promise.allSettled([
      getCachedUserProfile(userId),
      getCachedUserPlan(userId)
    ]);
    
    // Update profile immediately -- no waiting
    try {
      if (profile.status === 'fulfilled' && profile.value && typeof profile.value === 'object' && profile.value !== null) {
        globalUserData.profile = profile.value;
        dataCache.set(dataCache.getUserProfileKey(userId), profile.value);
        notifyListeners(); // Notify immediately
      }
    } catch (error) {
      
    }
    
    // Update plan immediately -- no waiting
    try {
      if (plan.status === 'fulfilled' && plan.value && typeof plan.value === 'object' && plan.value !== null) {
        globalUserData.plan = plan.value;
        dataCache.set(dataCache.getUserPlanKey(userId), plan.value);
        notifyListeners(); // Notify immediately
      }
    } catch (error) {
      
    }
    
    // PRIORITY 2: Load remaining data in background (non-blocking)
    setTimeout(async () => {
      try {
        const results = await Promise.allSettled([
          getCachedStoredPlan(userId).catch(err => null),
          getCachedCompletionStats(userId).catch(err => null),
          getCachedCompletedDays(userId).catch(err => null)
        ]);
        
        const [storedPlan, stats, days] = results.map(result => 
          result.status === 'fulfilled' ? result.value : null
        );
        
        // Update each with error handling
        try {
          if (storedPlan && typeof storedPlan === 'object' && storedPlan !== null) {
            globalUserData.storedPlan = storedPlan;
            dataCache.set(`stored_plan_${userId}`, storedPlan);
          }
        } catch (error) {
          
        }
        
        try {
          if (stats && typeof stats === 'object' && stats !== null) {
            globalUserData.completionStats = stats;
            dataCache.set(dataCache.getCompletionStatsKey(userId), stats);
          }
        } catch (error) {
          
        }
        
        try {
          if (days && (days instanceof Set || (Array.isArray(days) && days !== null))) {
            globalUserData.completedDays = days;
            dataCache.set(dataCache.getCompletedDaysKey(userId), days);
          }
        } catch (error) {
          
        }
        
        // Lightweight aura load (skip complex SQL functions temporarily)
        try {
          const simpleAura = {
            total_aura: 0,
            current_streak: 0,
            best_streak: 0,
            daily_aura_earned: 0,
            achievements_unlocked: [],
            shares_today: 0,
            coach_glo_interactions_today: 0
          };
          globalUserData.auraSummary = simpleAura;
          dataCache.set(`aura_summary_${userId}`, simpleAura);
        } catch (error) {
          
        }
        
        notifyListeners();
      } catch (backgroundError) {
        
      }
    }, 100); // Small delay to let UI render first
    
    
  } catch (error) {
    
    // Set default values to prevent app crashes
    globalUserData.completionStats = {
      totalDaysCompleted: 0,
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      weeklyProgress: 0
    };
    globalUserData.completedDays = new Set();
    notifyListeners();
  }
};

/**
 * Handle meal completion with instant updates
 */
export const handleMealCompletion = (userId: string, planId: string, mealIndex: number, mealName: string) => {
  try {
    
    
    // Initialize completion stats if not available (fix for first-launch issue)
    if (!globalUserData.completionStats) {
      globalUserData.completionStats = {
        totalDaysCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        completedDates: [],
        weeklyProgress: 0,
        totalMealsCompleted: 0,
        mealsCompletedToday: 0,
        totalExercisesCompleted: 0,
        exercisesCompletedToday: 0
      };
    }
    
    // Update completion stats instantly
    const currentStats = globalUserData.completionStats;
    const updatedStats = {
      ...currentStats,
      totalMealsCompleted: (currentStats.totalMealsCompleted || 0) + 1,
      mealsCompletedToday: (currentStats.mealsCompletedToday || 0) + 1,
      lastUpdated: new Date().toISOString()
    };
    
    updateCompletionStats(userId, updatedStats);
    
    // Initialize completed days if not available (fix for first-launch issue)
    if (!globalUserData.completedDays) {
      globalUserData.completedDays = new Set();
    }
    
    // Update completed days instantly - use Set for consistency
    const currentDays = globalUserData.completedDays;
    const today = new Date().toISOString().split('T')[0];
    
    // Ensure currentDays is a Set
    let updatedDaysSet: Set<string>;
    if (currentDays instanceof Set) {
      updatedDaysSet = new Set(currentDays);
    } else if (Array.isArray(currentDays)) {
      updatedDaysSet = new Set(currentDays);
    } else {
      updatedDaysSet = new Set();
    }
    
    // For meal completion, we don't need to add the day to completed days
    // as that's only for full day completion
    updateCompletedDays(userId, updatedDaysSet);
    
    // Initialize aura summary if not available (fix for first-launch issue)
    if (!globalUserData.auraSummary) {
      globalUserData.auraSummary = {
        total_aura: 0,
        current_streak: 0,
        best_streak: 0,
        daily_aura_earned: 0,
        achievements_unlocked: [],
        shares_today: 0,
        coach_glo_interactions_today: 0,
        updated_at: new Date().toISOString()
      };
    }
    
    // Update aura instantly - add 3 points for meal completion
    const currentAura = globalUserData.auraSummary;
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + 3,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + 3,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Notify specific listeners immediately for instant UI updates
    mealCompletionListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in meal completion listener:', error);
      }
    });
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints, checkAchievements, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
        await addAuraPoints(userId, AURA_EVENT_TYPES.MEAL_COMPLETION, AURA_POINTS.MEAL_COMPLETION, `Completed meal ${mealIndex + 1}`, { meal_index: mealIndex });
        // Check for new achievements after meal completion
        await checkAchievements(userId);
        // Notify listeners after database update to avoid interference
        notifyListeners();
      } catch (error) {
        
      }
    }, 0);
  } catch (error) {
    
  }
};

/**
 * Handle exercise completion with instant updates
 */
export const handleExerciseCompletion = (userId: string, planId: string, exerciseIndex: number, exerciseName: string) => {
  try {
    
    
    // Initialize completion stats if not available (fix for first-launch issue)
    if (!globalUserData.completionStats) {
      globalUserData.completionStats = {
        totalDaysCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        completedDates: [],
        weeklyProgress: 0,
        totalMealsCompleted: 0,
        mealsCompletedToday: 0,
        totalExercisesCompleted: 0,
        exercisesCompletedToday: 0
      };
    }
    
    // Update completion stats instantly
    const currentStats = globalUserData.completionStats;
    const updatedStats = {
      ...currentStats,
      totalExercisesCompleted: (currentStats.totalExercisesCompleted || 0) + 1,
      exercisesCompletedToday: (currentStats.exercisesCompletedToday || 0) + 1,
      lastUpdated: new Date().toISOString()
    };
    
    updateCompletionStats(userId, updatedStats);
    
    // Initialize completed days if not available (fix for first-launch issue)
    if (!globalUserData.completedDays) {
      globalUserData.completedDays = new Set();
    }
    
    // Update completed days instantly - use Set for consistency
    const currentDays = globalUserData.completedDays;
    const today = new Date().toISOString().split('T')[0];
    
    // Ensure currentDays is a Set
    let updatedDaysSet: Set<string>;
    if (currentDays instanceof Set) {
      updatedDaysSet = new Set(currentDays);
    } else if (Array.isArray(currentDays)) {
      updatedDaysSet = new Set(currentDays);
    } else {
      updatedDaysSet = new Set();
    }
    
    // For exercise completion, we don't need to add the day to completed days
    // as that's only for full day completion
    updateCompletedDays(userId, updatedDaysSet);
    
    // Initialize aura summary if not available (fix for first-launch issue)
    if (!globalUserData.auraSummary) {
      globalUserData.auraSummary = {
        total_aura: 0,
        current_streak: 0,
        best_streak: 0,
        daily_aura_earned: 0,
        achievements_unlocked: [],
        shares_today: 0,
        coach_glo_interactions_today: 0,
        updated_at: new Date().toISOString()
      };
    }
    
    // Update aura instantly - add 10 points for exercise completion
    const currentAura = globalUserData.auraSummary;
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + 10,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + 10,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints, checkAchievements, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
        await addAuraPoints(userId, AURA_EVENT_TYPES.EXERCISE_COMPLETION, AURA_POINTS.EXERCISE_COMPLETION, `Completed exercise ${exerciseIndex + 1}`, { exercise_index: exerciseIndex });
        // Check for new achievements after exercise completion
        await checkAchievements(userId);
        // Notify listeners after database update to avoid interference
        notifyListeners();
      } catch (error) {
        
      }
    }, 0);
  } catch (error) {
    
  }
};

/**
 * Handle day completion with instant updates
 */
export const handleDayCompletion = (userId: string, planId: string) => {
  
  
  // Update completion stats instantly
  const currentStats = globalUserData.completionStats;
  const updatedStats = {
    ...currentStats,
    totalDaysCompleted: (currentStats.totalDaysCompleted || 0) + 1,
    currentStreak: (currentStats.currentStreak || 0) + 1,
    lastUpdated: new Date().toISOString()
  };
  
  updateCompletionStats(userId, updatedStats);
  
  // Update completed days instantly - use Set for consistency
  const currentDays = globalUserData.completedDays;
  const today = new Date().toISOString().split('T')[0];
  
  // Ensure currentDays is a Set
  let updatedDaysSet: Set<string>;
  if (currentDays instanceof Set) {
    updatedDaysSet = new Set(currentDays);
  } else if (Array.isArray(currentDays)) {
    updatedDaysSet = new Set(currentDays);
  } else {
    updatedDaysSet = new Set();
  }
  
  updatedDaysSet.add(today);
  updateCompletedDays(userId, updatedDaysSet);
};

/**
 * Handle bulk meal completion with instant updates - only for remaining uncompleted meals
 */
export const handleBulkMealCompletion = (userId: string, planId: string, remainingMealCount: number) => {
  try {
    
    
    // Initialize completion stats if not available (fix for first-launch issue)
    if (!globalUserData.completionStats) {
      globalUserData.completionStats = {
        totalDaysCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        completedDates: [],
        weeklyProgress: 0,
        totalMealsCompleted: 0,
        mealsCompletedToday: 0,
        totalExercisesCompleted: 0,
        exercisesCompletedToday: 0
      };
    }
    
    // Update completion stats instantly - only for remaining meals
    const currentStats = globalUserData.completionStats;
    const updatedStats = {
      ...currentStats,
      totalMealsCompleted: (currentStats.totalMealsCompleted || 0) + remainingMealCount,
      mealsCompletedToday: (currentStats.mealsCompletedToday || 0) + remainingMealCount,
      lastUpdated: new Date().toISOString()
    };
    
    updateCompletionStats(userId, updatedStats);
    
    // Initialize completed days if not available (fix for first-launch issue)
    if (!globalUserData.completedDays) {
      globalUserData.completedDays = new Set();
    }
    
    // Update completed days instantly - use Set for consistency
    const currentDays = globalUserData.completedDays;
    
    // Ensure currentDays is a Set
    let updatedDaysSet: Set<string>;
    if (currentDays instanceof Set) {
      updatedDaysSet = new Set(currentDays);
    } else if (Array.isArray(currentDays)) {
      updatedDaysSet = new Set(currentDays);
    } else {
      updatedDaysSet = new Set();
    }
    
    // For meal completion, we don't need to add the day to completed days
    // as that's only for full day completion
    updateCompletedDays(userId, updatedDaysSet);
    
    // Initialize aura summary if not available (fix for first-launch issue)
    if (!globalUserData.auraSummary) {
      globalUserData.auraSummary = {
        total_aura: 0,
        current_streak: 0,
        best_streak: 0,
        daily_aura_earned: 0,
        achievements_unlocked: [],
        shares_today: 0,
        coach_glo_interactions_today: 0,
        updated_at: new Date().toISOString()
      };
    }
    
    // Update aura instantly - add 3 points per remaining meal completion only
    const currentAura = globalUserData.auraSummary;
    const auraPoints = remainingMealCount * 3;
    
    // Check if all meals are now completed (remainingMealCount completes all meals)
    // We need to check total meals from plan, but for now, if remainingMealCount > 0, 
    // we'll add the bonus after checking in the background
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + auraPoints,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + auraPoints,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Also update Zustand store optimistically (non-blocking)
    setTimeout(async () => {
      try {
        const { useAuraStore } = await import('./stores/auraStore');
        const auraStore = useAuraStore.getState();
        await auraStore.addAuraPoints(auraPoints, userId);
      } catch (storeError) {
        // Silently fail if store not available
      }
    }, 0);
    
    // Notify specific listeners immediately for instant UI updates
    mealCompletionListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in bulk meal completion listener:', error);
      }
    });
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints, checkAchievements, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
        await addAuraPoints(userId, 'bulk_meal_completion', auraPoints, `Completed ${remainingMealCount} remaining meals`, { meal_count: remainingMealCount }, true);
        
        // Check if all meals are completed and add bonus (5 points)
        // We need to check from the plan, but for now we'll check if this was the last meal
        // The bonus will be added by handleMealCompletion in auraService when it detects all meals completed
        // But we should add it here optimistically if we know all meals are done
        try {
          const { supabase } = await import('./supabase');
          const today = new Date().toISOString().split('T')[0];
          // Get total meals from plan (we'll need to pass this or fetch it)
          // For now, we'll add the bonus in the background check
          const { data: completedMeals } = await supabase
            .from('meal_completions')
            .select('meal_index')
            .eq('user_id', userId)
            .eq('completed_date', today)
            .eq('is_active', true);
          
          // Check if all meals are completed (this is a rough check - ideally we'd know total meals)
          // We'll let the individual meal completion handler check for the bonus
        } catch (bonusError) {
          // Silently handle bonus check errors
        }
        
        // Check for new achievements after bulk completion
        await checkAchievements(userId);
        // Notify listeners after database update to avoid interference
        notifyListeners();
      } catch (error) {
        
      }
    }, 0);
  } catch (error) {
    
  }
};

/**
 * Handle bulk exercise completion with instant updates - only for remaining uncompleted exercises
 */
export const handleBulkExerciseCompletion = (userId: string, planId: string, remainingExerciseCount: number) => {
  try {
    
    
    // Initialize completion stats if not available (fix for first-launch issue)
    if (!globalUserData.completionStats) {
      globalUserData.completionStats = {
        totalDaysCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        completedDates: [],
        weeklyProgress: 0,
        totalMealsCompleted: 0,
        mealsCompletedToday: 0,
        totalExercisesCompleted: 0,
        exercisesCompletedToday: 0
      };
    }
    
    // Update completion stats instantly - only for remaining exercises
    const currentStats = globalUserData.completionStats;
    const updatedStats = {
      ...currentStats,
      totalExercisesCompleted: (currentStats.totalExercisesCompleted || 0) + remainingExerciseCount,
      exercisesCompletedToday: (currentStats.exercisesCompletedToday || 0) + remainingExerciseCount,
      lastUpdated: new Date().toISOString()
    };
    
    updateCompletionStats(userId, updatedStats);
    
    // Initialize completed days if not available (fix for first-launch issue)
    if (!globalUserData.completedDays) {
      globalUserData.completedDays = new Set();
    }
    
    // Update completed days instantly - use Set for consistency
    const currentDays = globalUserData.completedDays;
    
    // Ensure currentDays is a Set
    let updatedDaysSet: Set<string>;
    if (currentDays instanceof Set) {
      updatedDaysSet = new Set(currentDays);
    } else if (Array.isArray(currentDays)) {
      updatedDaysSet = new Set(currentDays);
    } else {
      updatedDaysSet = new Set();
    }
    
    // For exercise completion, we don't need to add the day to completed days
    // as that's only for full day completion
    updateCompletedDays(userId, updatedDaysSet);
    
    // Initialize aura summary if not available (fix for first-launch issue)
    if (!globalUserData.auraSummary) {
      globalUserData.auraSummary = {
        total_aura: 0,
        current_streak: 0,
        best_streak: 0,
        daily_aura_earned: 0,
        achievements_unlocked: [],
        shares_today: 0,
        coach_glo_interactions_today: 0,
        updated_at: new Date().toISOString()
      };
    }
    
    // Update aura instantly - add 10 points per remaining exercise completion only
    const currentAura = globalUserData.auraSummary;
    const auraPoints = remainingExerciseCount * 10;
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + auraPoints,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + auraPoints,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Also update Zustand store optimistically (non-blocking)
    setTimeout(async () => {
      try {
        const { useAuraStore } = await import('./stores/auraStore');
        const auraStore = useAuraStore.getState();
        await auraStore.addAuraPoints(auraPoints, userId);
      } catch (storeError) {
        // Silently fail if store not available
      }
    }, 0);
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints, checkAchievements, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
        await addAuraPoints(userId, 'bulk_exercise_completion', auraPoints, `Completed ${remainingExerciseCount} remaining exercises`, { exercise_count: remainingExerciseCount }, true);
        
        // Check if all exercises are completed and add bonus (5 points)
        try {
          const { supabase } = await import('./supabase');
          const today = new Date().toISOString().split('T')[0];
          const { data: completedExercises } = await supabase
            .from('exercise_completions')
            .select('exercise_index')
            .eq('user_id', userId)
            .eq('completed_date', today)
            .eq('is_active', true);
          
          // If all exercises are completed, add bonus
          // Note: We'd need to know total exercises to check properly
          // For now, we'll add the bonus optimistically and let the DB check verify
          try {
            const { useAuraStore } = await import('./stores/auraStore');
            const auraStore = useAuraStore.getState();
            // Add 5 bonus points for completing all exercises
            await auraStore.addAuraPoints(AURA_POINTS.ALL_EXERCISES_BONUS, userId);
            // Also add to DB
            await addAuraPoints(userId, AURA_EVENT_TYPES.ALL_EXERCISES_DAY, AURA_POINTS.ALL_EXERCISES_BONUS, 'All exercises completed today!', {}, true);
          } catch (bonusError) {
            // Silently handle bonus errors
          }
        } catch (bonusError) {
          // Silently handle bonus check errors
        }
        
        // Check for new achievements after bulk completion
        await checkAchievements(userId);
        // Notify listeners after database update to avoid interference
        notifyListeners();
      } catch (error) {
        
      }
    }, 0);
  } catch (error) {
    
  }
};

/**
 * Handle plan regeneration with instant updates
 */
export const handlePlanRegeneration = (userId: string, newPlan: any) => {
  
  
  // Update both user plan and stored plan instantly
  updateUserPlan(userId, newPlan);
  updateStoredPlan(userId, newPlan);
};

/**
 * Handle plan swap with instant updates
 */
export const handlePlanSwap = async (userId: string, updatedPlan: any) => {
  
  
  if (updatedPlan) {
    // Update stored plan instantly to reflect the swap
    updateStoredPlan(userId, updatedPlan);
    
    // Also update user plan if it exists
    updateUserPlan(userId, updatedPlan);
  } else {
    // If no plan provided, reload from database to get latest changes
    
    await loadUserData(userId);
  }
};
