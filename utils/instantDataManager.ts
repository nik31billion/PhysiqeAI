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

/**
 * Subscribe to data changes for instant updates
 */
export const subscribeToDataChanges = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
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
        console.error('❌ Error in data change listener:', error);
      }
    });
  } catch (error) {
    console.error('❌ Critical error in notifyListeners:', error);
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
    console.error('❌ Error updating completed days:', error);
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
      console.warn('⚠️ Invalid aura summary data:', auraSummary);
    }
  } catch (error) {
    console.error('❌ Error updating aura summary:', error);
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
 * Load aura data from database
 */
export const loadAuraData = async (userId: string) => {
  try {
    console.log('🔄 Loading aura data from database...');
    
    const { getUserAuraSummary } = await import('./auraService');
    const auraSummary = await getUserAuraSummary(userId);
    
    if (auraSummary) {
      globalUserData.auraSummary = auraSummary;
      dataCache.set(`aura_summary_${userId}`, auraSummary);
      console.log('✅ Aura data loaded from database:', auraSummary.total_aura);
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
      console.log('✅ Aura data initialized with defaults');
    }
    
    notifyListeners();
  } catch (error) {
    console.error('❌ Error loading aura data:', error);
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
 * Load data from API and update global state - SAFE VERSION
 */
export const loadUserData = async (userId: string) => {
  try {
    console.log('🔄 Loading user data for instant access...');
    
    // Import services dynamically with error handling
    let services;
    try {
      services = await import('./optimizedServices');
    } catch (importError) {
      console.error('❌ Error importing services:', importError);
      return;
    }
    
    const { 
      getCachedUserProfile, 
      getCachedUserPlan, 
      getCachedStoredPlan, 
      getCachedCompletionStats, 
      getCachedCompletedDays 
    } = services;
    
    // Load each service individually to prevent one failure from breaking all
    const results = await Promise.allSettled([
      getCachedUserProfile(userId).catch(err => {
        console.error('❌ Profile service error:', err);
        return null;
      }),
      getCachedUserPlan(userId).catch(err => {
        console.error('❌ Plan service error:', err);
        return null;
      }),
      getCachedStoredPlan(userId).catch(err => {
        console.error('❌ Stored plan service error:', err);
        return null;
      }),
      getCachedCompletionStats(userId).catch(err => {
        console.error('❌ Completion stats service error:', err);
        return null;
      }),
      getCachedCompletedDays(userId).catch(err => {
        console.error('❌ Completed days service error:', err);
        return null;
      })
    ]);
    
    // Also load aura data
    await loadAuraData(userId);
    
    const [profile, plan, storedPlan, stats, days] = results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    );
    
    // Update global state with individual error handling
    try {
      if (profile && typeof profile === 'object' && profile !== null) {
        globalUserData.profile = profile;
        dataCache.set(dataCache.getUserProfileKey(userId), profile);
        console.log('✅ Profile data updated');
      }
    } catch (error) {
      console.error('❌ Error updating profile data:', error);
    }
    
    try {
      if (plan && typeof plan === 'object' && plan !== null) {
        globalUserData.plan = plan;
        dataCache.set(dataCache.getUserPlanKey(userId), plan);
        console.log('✅ Plan data updated');
      }
    } catch (error) {
      console.error('❌ Error updating plan data:', error);
    }
    
    try {
      if (storedPlan && typeof storedPlan === 'object' && storedPlan !== null) {
        globalUserData.storedPlan = storedPlan;
        dataCache.set(`stored_plan_${userId}`, storedPlan);
        console.log('✅ Stored plan data updated');
      }
    } catch (error) {
      console.error('❌ Error updating stored plan data:', error);
    }
    
    try {
      if (stats && typeof stats === 'object' && stats !== null) {
        globalUserData.completionStats = stats;
        dataCache.set(dataCache.getCompletionStatsKey(userId), stats);
        console.log('✅ Completion stats updated');
      }
    } catch (error) {
      console.error('❌ Error updating completion stats data:', error);
    }
    
    try {
      if (days && (days instanceof Set || (Array.isArray(days) && days !== null))) {
        globalUserData.completedDays = days;
        dataCache.set(dataCache.getCompletedDaysKey(userId), days);
        console.log('✅ Completed days updated');
      }
    } catch (error) {
      console.error('❌ Error updating completed days data:', error);
    }
    
    // Notify all listeners
    notifyListeners();
    
    console.log('✅ User data loaded and ready for instant access');
  } catch (error) {
    console.error('❌ Critical error loading user data:', error);
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
    console.log(`🍽️ Instant meal completion: ${mealName}`);
    
    // Update completion stats instantly
    const currentStats = globalUserData.completionStats || {};
    const updatedStats = {
      ...currentStats,
      totalMealsCompleted: (currentStats.totalMealsCompleted || 0) + 1,
      mealsCompletedToday: (currentStats.mealsCompletedToday || 0) + 1,
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
    
    // For meal completion, we don't need to add the day to completed days
    // as that's only for full day completion
    updateCompletedDays(userId, updatedDaysSet);
    
    // Update aura instantly - add 3 points for meal completion
    const currentAura = globalUserData.auraSummary || {};
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + 3,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + 3,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints, checkAchievements } = await import('./auraService');
        await addAuraPoints(userId, 'meal_completion', 3, `Completed meal ${mealIndex + 1}`, { meal_index: mealIndex });
        // Check for new achievements after meal completion
        await checkAchievements(userId);
      } catch (error) {
        console.error('Error updating aura in database:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error in handleMealCompletion:', error);
  }
};

/**
 * Handle exercise completion with instant updates
 */
export const handleExerciseCompletion = (userId: string, planId: string, exerciseIndex: number, exerciseName: string) => {
  try {
    console.log(`💪 Instant exercise completion: ${exerciseName}`);
    
    // Update completion stats instantly
    const currentStats = globalUserData.completionStats || {};
    const updatedStats = {
      ...currentStats,
      totalExercisesCompleted: (currentStats.totalExercisesCompleted || 0) + 1,
      exercisesCompletedToday: (currentStats.exercisesCompletedToday || 0) + 1,
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
    
    // For exercise completion, we don't need to add the day to completed days
    // as that's only for full day completion
    updateCompletedDays(userId, updatedDaysSet);
    
    // Update aura instantly - add 10 points for exercise completion
    const currentAura = globalUserData.auraSummary || {};
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
        const { addAuraPoints, checkAchievements } = await import('./auraService');
        await addAuraPoints(userId, 'exercise_completion', 10, `Completed exercise ${exerciseIndex + 1}`, { exercise_index: exerciseIndex });
        // Check for new achievements after exercise completion
        await checkAchievements(userId);
      } catch (error) {
        console.error('Error updating aura in database:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error in handleExerciseCompletion:', error);
  }
};

/**
 * Handle day completion with instant updates
 */
export const handleDayCompletion = (userId: string, planId: string) => {
  console.log(`📅 Instant day completion`);
  
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
 * Handle bulk meal completion with instant updates
 */
export const handleBulkMealCompletion = (userId: string, planId: string, mealCount: number) => {
  try {
    console.log(`🍽️ Instant bulk meal completion: ${mealCount} meals`);
    
    // Update completion stats instantly
    const currentStats = globalUserData.completionStats || {};
    const updatedStats = {
      ...currentStats,
      totalMealsCompleted: (currentStats.totalMealsCompleted || 0) + mealCount,
      mealsCompletedToday: (currentStats.mealsCompletedToday || 0) + mealCount,
      lastUpdated: new Date().toISOString()
    };
    
    updateCompletionStats(userId, updatedStats);
    
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
    
    // Update aura instantly - add 3 points per meal completion
    const currentAura = globalUserData.auraSummary || {};
    const auraPoints = mealCount * 3;
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + auraPoints,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + auraPoints,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints } = await import('./auraService');
        await addAuraPoints(userId, 'bulk_meal_completion', auraPoints, `Completed all ${mealCount} meals`, { meal_count: mealCount });
      } catch (error) {
        console.error('Error updating aura in database:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error in handleBulkMealCompletion:', error);
  }
};

/**
 * Handle bulk exercise completion with instant updates
 */
export const handleBulkExerciseCompletion = (userId: string, planId: string, exerciseCount: number) => {
  try {
    console.log(`💪 Instant bulk exercise completion: ${exerciseCount} exercises`);
    
    // Update completion stats instantly
    const currentStats = globalUserData.completionStats || {};
    const updatedStats = {
      ...currentStats,
      totalExercisesCompleted: (currentStats.totalExercisesCompleted || 0) + exerciseCount,
      exercisesCompletedToday: (currentStats.exercisesCompletedToday || 0) + exerciseCount,
      lastUpdated: new Date().toISOString()
    };
    
    updateCompletionStats(userId, updatedStats);
    
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
    
    // Update aura instantly - add 10 points per exercise completion
    const currentAura = globalUserData.auraSummary || {};
    const auraPoints = exerciseCount * 10;
    const updatedAura = {
      ...currentAura,
      total_aura: (currentAura.total_aura || 0) + auraPoints,
      daily_aura_earned: (currentAura.daily_aura_earned || 0) + auraPoints,
      updated_at: new Date().toISOString()
    };
    
    updateAuraSummary(userId, updatedAura);
    
    // Also update the database in the background to persist the data
    setTimeout(async () => {
      try {
        const { addAuraPoints } = await import('./auraService');
        await addAuraPoints(userId, 'bulk_exercise_completion', auraPoints, `Completed all ${exerciseCount} exercises`, { exercise_count: exerciseCount });
      } catch (error) {
        console.error('Error updating aura in database:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error in handleBulkExerciseCompletion:', error);
  }
};

/**
 * Handle plan regeneration with instant updates
 */
export const handlePlanRegeneration = (userId: string, newPlan: any) => {
  console.log(`🔄 Instant plan regeneration`);
  
  // Update both user plan and stored plan instantly
  updateUserPlan(userId, newPlan);
  updateStoredPlan(userId, newPlan);
};

/**
 * Handle plan swap with instant updates
 */
export const handlePlanSwap = async (userId: string, updatedPlan: any) => {
  console.log(`🔄 Instant plan swap update`);
  
  if (updatedPlan) {
    // Update stored plan instantly to reflect the swap
    updateStoredPlan(userId, updatedPlan);
    
    // Also update user plan if it exists
    updateUserPlan(userId, updatedPlan);
  } else {
    // If no plan provided, reload from database to get latest changes
    console.log('🔄 Reloading plan data from database after swap...');
    await loadUserData(userId);
  }
};
