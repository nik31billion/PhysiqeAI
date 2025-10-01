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
 */
export async function markMealAsCompleted(
  userId: string,
  planId: string,
  mealIndex: number,
  mealName: string,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    
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

        // Add Aura points for meal completion
        try {
          await handleMealCompletion(userId, mealIndex, 3); // Assuming 3 meals per day
        } catch (auraError) {
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

        // Add Aura points for exercise completion
        try {
          const { addAuraPoints, AURA_EVENT_TYPES, AURA_POINTS } = await import('./auraService');
          await addAuraPoints(userId, AURA_EVENT_TYPES.EXERCISE_COMPLETION, AURA_POINTS.EXERCISE_COMPLETION, `Completed exercise ${exerciseIndex + 1}`, { exercise_index: exerciseIndex });
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
