/**
 * Service for managing individual meal and exercise completions
 */

import { supabase } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  handleMealCompletion, 
  handleDailyWorkoutCompletion,
  updateStreak,
  checkAchievements 
} from './auraService';

export interface MealCompletion {
  id: string;
  user_id: string;
  plan_id: string;
  completed_date: string;
  meal_index: number;
  meal_name: string;
  completed_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCompletion {
  id: string;
  user_id: string;
  plan_id: string;
  completed_date: string;
  exercise_index: number;
  exercise_name: string;
  completed_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Mark a specific meal as completed - OPTIMIZED FOR INSTANT RESPONSE
 * Now includes optimistic calorie updates via Zustand store
 */
export async function markMealAsCompleted(
  userId: string,
  planId: string,
  mealIndex: number,
  mealName: string,
  date?: string,
  mealCalories?: number // Optional: calories for this meal for instant updates
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    // Optimistic update: Always add meal completion to store (even if calories are 0)
    // This ensures the meal is marked as completed regardless of calorie value
    try {
      const { useCaloriesStore } = await import('./stores/caloriesStore');
      const store = useCaloriesStore.getState();
      // Use mealCalories if provided, otherwise default to 0
      // This ensures meal is always marked as completed
      const caloriesToAdd = mealCalories !== undefined ? mealCalories : 0;
      // Pass userId and date to persist immediately
      await store.addMealCompletion(mealIndex, caloriesToAdd, userId, completedDate);
    } catch (storeError) {
      // Log error but don't fail - backward compatibility
      console.error('Calories store update failed:', storeError);
    }
    
    // Optimistic update: Add aura points to store immediately (3 points for meal)
    try {
      const { useAuraStore } = await import('./stores/auraStore');
      const auraStore = useAuraStore.getState();
      await auraStore.addAuraPoints(3, userId); // AURA_POINTS.MEAL_COMPLETION = 3
    } catch (storeError) {
      // Silently fail if store not available - backward compatibility
      console.log('Aura store update skipped:', storeError);
    }
    
    // Return success immediately - database operations happen in background
    // This ensures instant UI response
    
    // Queue database operations for background processing
    setTimeout(async () => {
      try {
        // Check if already completed
        const { data: existing, error: checkError } = await supabase
          .from('meal_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('completed_date', completedDate)
          .eq('meal_index', mealIndex)
          .eq('is_active', true)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          return;
        }

        if (existing) {
          // Already completed
          return;
        }
        
        const { error } = await supabase
          .from('meal_completions')
          .insert({
            user_id: userId,
            plan_id: planId,
            completed_date: completedDate,
            meal_index: mealIndex,
            meal_name: mealName,
            completed_at: new Date().toISOString(),
            is_active: true
          });

        if (error) {
          return;
        }

        // Add Aura points to database (but don't update store again - already done optimistically)
        // Only update DB to keep it in sync
        try {
          const { addAuraPoints, AURA_EVENT_TYPES, AURA_POINTS, handleMealCompletion } = await import('./auraService');
          // Use handleMealCompletion which checks for all meals bonus
          // We need to pass totalMeals - for now we'll let it check from DB
          // Get plan to find total meals
          const { data: planData } = await supabase
            .from('user_plans')
            .select('plan_data')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();
          
          let totalMeals = 3; // Default
          if (planData?.plan_data?.meals) {
            totalMeals = planData.plan_data.meals.length;
          }
          
          // This will add meal completion points and check for all meals bonus
          await handleMealCompletion(userId, mealIndex, totalMeals);
        } catch (auraError) {
          // Fallback to direct addAuraPoints if handleMealCompletion fails
          try {
            const { addAuraPoints, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
            await addAuraPoints(userId, AURA_EVENT_TYPES.MEAL_COMPLETION, AURA_POINTS.MEAL_COMPLETION, `Completed meal ${mealIndex + 1}`, { meal_index: mealIndex }, true);
          } catch (fallbackError) {
          }
        }
      } catch (error) {
      }
    }, 0);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark meal as completed' };
  }
}

/**
 * Mark a specific exercise as completed - OPTIMIZED FOR INSTANT RESPONSE
 */
export async function markExerciseAsCompleted(
  userId: string,
  planId: string,
  exerciseIndex: number,
  exerciseName: string,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    // Optimistic update: Add aura points to store immediately
    try {
      const { useAuraStore } = await import('./stores/auraStore');
      const auraStore = useAuraStore.getState();
      // Add 10 points for exercise completion (AURA_POINTS.EXERCISE_COMPLETION = 10)
      // Pass userId to persist immediately
      await auraStore.addAuraPoints(10, userId);
    } catch (storeError) {
      // Silently fail if store not available - backward compatibility
      console.log('Aura store update skipped:', storeError);
    }
    
    // Return success immediately - database operations happen in background
    // This ensures instant UI response
    
    // Queue database operations for background processing
    setTimeout(async () => {
      try {
        // Check if already completed
        const { data: existing, error: checkError } = await supabase
          .from('exercise_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('completed_date', completedDate)
          .eq('exercise_index', exerciseIndex)
          .eq('is_active', true)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          return;
        }

        if (existing) {
          // Already completed
          return;
        }
        
        const { error } = await supabase
          .from('exercise_completions')
          .insert({
            user_id: userId,
            plan_id: planId,
            completed_date: completedDate,
            exercise_index: exerciseIndex,
            exercise_name: exerciseName,
            completed_at: new Date().toISOString(),
            is_active: true
          });

        if (error) {
          return;
        }

        // Add Aura points to database (but don't update store again - already done optimistically)
        // Only update DB to keep it in sync
        try {
          const { addAuraPoints, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
          // Skip store update since we already did it optimistically
          await addAuraPoints(userId, AURA_EVENT_TYPES.EXERCISE_COMPLETION, AURA_POINTS.EXERCISE_COMPLETION, `Completed exercise ${exerciseIndex + 1}`, { exercise_index: exerciseIndex }, true);
          
          // Check if all exercises are completed and add bonus (5 points)
          // Get plan to find total exercises
          const { data: planData } = await supabase
            .from('user_plans')
            .select('plan_data')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();
          
          let totalExercises = 3; // Default
          if (planData?.plan_data?.workouts) {
            totalExercises = planData.plan_data.workouts.length;
          }
          
          // Check if all exercises are completed today
          const today = new Date().toISOString().split('T')[0];
          const { data: completedExercises } = await supabase
            .from('exercise_completions')
            .select('exercise_index')
            .eq('user_id', userId)
            .eq('completed_date', today)
            .eq('is_active', true);
          
          if (completedExercises && completedExercises.length >= totalExercises) {
            // Check if bonus already added today
            const { data: existingBonus } = await supabase
              .from('aura_events')
              .select('id')
              .eq('user_id', userId)
              .eq('event_type', AURA_EVENT_TYPES.ALL_EXERCISES_DAY)
              .eq('event_date', today)
              .maybeSingle();
            
            if (!existingBonus) {
              // Add bonus optimistically to store
              try {
                const { useAuraStore } = await import('./stores/auraStore');
                const auraStore = useAuraStore.getState();
                await auraStore.addAuraPoints(AURA_POINTS.ALL_EXERCISES_BONUS, userId);
              } catch (storeError) {
                // Silently fail if store not available
              }
              
              // Add to database
              await addAuraPoints(
                userId,
                AURA_EVENT_TYPES.ALL_EXERCISES_DAY,
                AURA_POINTS.ALL_EXERCISES_BONUS,
                'All exercises completed today!',
                {},
                true // Skip store update since we already did it
              );
            }
          }
        } catch (auraError) {
        }
      } catch (error) {
      }
    }, 0);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark exercise as completed' };
  }
}

/**
 * Mark all meals for a day as completed
 */
export async function markAllMealsAsCompleted(
  userId: string,
  planId: string,
  meals: any[],
  date?: string,
  skipAuraUpdates: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    // First, check which meals are already completed
    const { data: existingCompletions, error: fetchError } = await supabase
      .from('meal_completions')
      .select('meal_index')
      .eq('user_id', userId)
      .eq('completed_date', completedDate)
      .eq('is_active', true);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const completedIndices = new Set(existingCompletions?.map((c: { meal_index: number }) => c.meal_index) || []);
    
    // Only insert completions for meals that aren't already completed
    const newCompletions = meals
      .map((meal, index) => ({
        user_id: userId,
        plan_id: planId,
        completed_date: completedDate,
        meal_index: index,
        meal_name: meal.meal || `Meal ${index + 1}`,
        completed_at: new Date().toISOString(),
        is_active: true
      }))
      .filter((_, index) => !completedIndices.has(index));

    if (newCompletions.length === 0) {
      // All meals are already completed
      return { success: true };
    }

    const { error } = await supabase
      .from('meal_completions')
      .insert(newCompletions);

    if (error) {
      return { success: false, error: error.message };
    }

    // Add Aura points for all meals completion - only if not skipped (to avoid double counting)
    if (!skipAuraUpdates) {
      try {
        // Mark each meal as completed for aura points
        for (let i = 0; i < meals.length; i++) {
          await handleMealCompletion(userId, i, meals.length);
        }
      } catch (auraError) {
        // Don't fail the meal completion if aura fails
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark all meals as completed' };
  }
}

/**
 * Mark all exercises for a day as completed
 */
export async function markAllExercisesAsCompleted(
  userId: string,
  planId: string,
  exercises: any[],
  date?: string,
  skipAuraUpdates: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    // First, check which exercises are already completed
    const { data: existingCompletions, error: fetchError } = await supabase
      .from('exercise_completions')
      .select('exercise_index')
      .eq('user_id', userId)
      .eq('completed_date', completedDate)
      .eq('is_active', true);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const completedIndices = new Set(existingCompletions?.map((c: { exercise_index: number }) => c.exercise_index) || []);
    
    // Only insert completions for exercises that aren't already completed
    const newCompletions = exercises
      .map((exercise, index) => ({
        user_id: userId,
        plan_id: planId,
        completed_date: completedDate,
        exercise_index: index,
        exercise_name: exercise.exercise || `Exercise ${index + 1}`,
        completed_at: new Date().toISOString(),
        is_active: true
      }))
      .filter((_, index) => !completedIndices.has(index));

    if (newCompletions.length === 0) {
      // All exercises are already completed
      return { success: true };
    }

    const { error } = await supabase
      .from('exercise_completions')
      .insert(newCompletions);

    if (error) {
      return { success: false, error: error.message };
    }

    // Add Aura points for daily workout completion - only if not skipped (to avoid double counting)
    if (!skipAuraUpdates) {
      try {
        await handleDailyWorkoutCompletion(userId);
        await updateStreak(userId);
        await checkAchievements(userId);
      } catch (auraError) {
        // Don't fail the exercise completion if aura fails
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark all exercises as completed' };
  }
}

/**
 * Fetch completed meals for a specific date
 */
export async function getCompletedMeals(
  userId: string,
  date?: string
): Promise<{ success: boolean; data?: MealCompletion[]; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meal_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed_date', completedDate)
      .eq('is_active', true)
      .order('meal_index');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch completed meals' };
  }
}

/**
 * Fetch completed exercises for a specific date
 */
export async function getCompletedExercises(
  userId: string,
  date?: string
): Promise<{ success: boolean; data?: ExerciseCompletion[]; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('exercise_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed_date', completedDate)
      .eq('is_active', true)
      .order('exercise_index');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch completed exercises' };
  }
}

/**
 * Check if a specific meal is completed
 */
export async function isMealCompleted(
  userId: string,
  mealIndex: number,
  date?: string
): Promise<boolean> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meal_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('completed_date', completedDate)
      .eq('meal_index', mealIndex)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a specific exercise is completed
 */
export async function isExerciseCompleted(
  userId: string,
  exerciseIndex: number,
  date?: string
): Promise<boolean> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('exercise_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('completed_date', completedDate)
      .eq('exercise_index', exerciseIndex)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get the next uncompleted meal for a day
 */
export async function getNextUncompletedMeal(
  userId: string,
  meals: any[],
  date?: string
): Promise<any | null> {
  try {
    const completedMeals = await getCompletedMeals(userId, date);
    if (!completedMeals.success || !completedMeals.data) {
      return meals[0] || null; // Return first meal if no completion data
    }

    const completedIndices = new Set(completedMeals.data.map(completion => completion.meal_index));
    
    // Find the first uncompleted meal
    for (let i = 0; i < meals.length; i++) {
      if (!completedIndices.has(i)) {
        return meals[i];
      }
    }

    return null; // All meals completed
  } catch (error) {
    return meals[0] || null;
  }
}
