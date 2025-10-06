/**
 * Service for generating and managing personalized workout and diet plans
 */

import { supabase } from './supabase'

export interface WorkoutRoutine {
  exercise: string
  sets?: number
  reps?: string
  duration?: string
  rest?: string
  notes?: string
}

export interface WorkoutPlan {
  day: string
  type?: string // push/pull/legs/cardio
  routine: WorkoutRoutine[]
}

export interface MealPlan {
  meal: string
  description: string
  kcal: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  ingredients?: string[]
  instructions?: string[]
  cooking_time?: string
  serving_size?: string
}

export interface DietPlan {
  day: string
  meals: MealPlan[]
  totalCalories?: number
}

export interface UserPlan {
  workout: WorkoutPlan[]
  diet: DietPlan[]
}

export interface PlanGenerationInputs {
  userId: string
  regenerate?: boolean
  planType?: 'workout' | 'diet' | 'both'
}

export interface PlanGenerationResponse {
  success: boolean
  message?: string
  planId?: string
  workout?: WorkoutPlan[]
  diet?: DietPlan[]
  error?: string
}

export interface StoredPlan {
  id: string
  user_id: string
  plan_version: number
  generated_at: string
  is_active: boolean
  user_snapshot: any
  workout_plan: WorkoutPlan[]
  diet_plan: DietPlan[]
  generation_status: 'generating' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

/**
 * Gets the current day's diet plan for a user
 */
export async function getDailyPlan(userId: string): Promise<DietPlan | null> {
  try {
    const activePlan = await getUserActivePlan(userId);
    if (!activePlan || !activePlan.diet_plan) {
      return null;
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return activePlan.diet_plan[dayOfWeek] || null;
  } catch (error) {
    console.error('Error getting daily plan:', error);
    return null;
  }
}

/**
 * Calls the Supabase edge function to generate personalized workout and diet plans
 * @param inputs - Plan generation inputs
 * @returns Promise resolving to plan generation response
 */
export async function generatePlanViaEdgeFunction(inputs: PlanGenerationInputs): Promise<PlanGenerationResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-plans', {
      body: inputs
    });


    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from plan generation');
    }

    return data as PlanGenerationResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Concurrent version of plan generation - processes multiple requests simultaneously
 * @param inputs - Plan generation inputs
 * @returns Promise resolving to plan generation response
 */
export async function generatePlanConcurrently(inputs: PlanGenerationInputs): Promise<PlanGenerationResponse> {
  const { concurrentLLMProcessor } = await import('./concurrentLLMProcessor');
  
  console.log(`[PlanService] Adding plan generation request to concurrent processor for user ${inputs.userId}`);
  
  return await concurrentLLMProcessor.addRequest(
    inputs.userId,
    'plan_generation',
    inputs
  );
}

/**
 * Fetches the user's active plan from the database
 * @param userId - User's ID
 * @returns Promise resolving to the user's active plan or null if none exists
 */
export async function getUserActivePlan(userId: string): Promise<StoredPlan | null> {
  try {
    // First, let's fix the database by ensuring only one plan is active
    await fixMultipleActivePlans(userId);
    
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('generation_status', 'completed') // Only get completed plans
      .order('created_at', { ascending: false }) // Get the most recent one
      .limit(1)
      .single()


    if (error) {
      if (error.code === 'PGRST116') {
        // No active plan found
        return null
      }
      throw new Error(`Database error: ${error.message}`)
    }

    return data as StoredPlan
  } catch (error) {
    throw error
  }
}

/**
 * Fixes the issue where multiple plans are marked as active
 */
async function fixMultipleActivePlans(userId: string): Promise<void> {
  try {
    
    // Get all active plans
    const { data: activePlans, error: fetchError } = await supabase
      .from('user_plans')
      .select('id, created_at, generation_status')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return;
    }

    if (!activePlans || activePlans.length <= 1) {
      return;
    }


    // Find the most recent completed plan
    const completedPlan = activePlans.find(plan => plan.generation_status === 'completed');
    
    if (completedPlan) {
      // Deactivate all plans except the most recent completed one
      const plansToDeactivate = activePlans.filter(plan => plan.id !== completedPlan.id);
      
      if (plansToDeactivate.length > 0) {
        const { error: updateError } = await supabase
          .from('user_plans')
          .update({ is_active: false })
          .in('id', plansToDeactivate.map(p => p.id));

        if (updateError) {
        } else {
        }
      }
    } else {
      // If no completed plan, deactivate all except the most recent
      const plansToDeactivate = activePlans.slice(1); // Keep the first (most recent)
      
      if (plansToDeactivate.length > 0) {
        const { error: updateError } = await supabase
          .from('user_plans')
          .update({ is_active: false })
          .in('id', plansToDeactivate.map(p => p.id));

        if (updateError) {
        } else {
        }
      }
    }
  } catch (error) {
  }
}

/**
 * Fetches all plans for a user (including inactive ones)
 * @param userId - User's ID
 * @returns Promise resolving to array of user's plans
 */
export async function getUserPlans(userId: string): Promise<StoredPlan[]> {
  try {
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data as StoredPlan[]
  } catch (error) {
    throw error
  }
}

/**
 * Activates a specific plan and deactivates others for the user
 * @param planId - Plan ID to activate
 * @param userId - User's ID (for security)
 * @returns Promise resolving when operation completes
 */
export async function activatePlan(planId: string, userId: string): Promise<void> {
  try {
    // First, deactivate all plans for this user
    const { error: deactivateError } = await supabase
      .from('user_plans')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) {
      throw new Error(`Failed to deactivate existing plans: ${deactivateError.message}`)
    }

    // Then activate the specified plan
    const { error: activateError } = await supabase
      .from('user_plans')
      .update({ is_active: true })
      .eq('id', planId)
      .eq('user_id', userId)

    if (activateError) {
      throw new Error(`Failed to activate plan: ${activateError.message}`)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Checks if a user has completed onboarding and has the required data for plan generation
 * @param userId - User's ID
 * @returns Promise resolving to boolean indicating if user can generate plans
 */
export async function canGeneratePlan(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        onboarding_complete,
        age, gender, height_cm, weight_kg, target_weight_kg, target_timeline_weeks,
        fitness_goal, fitness_experience, activity_level, dietary_preferences, meal_frequency,
        target_calories
      `)
      .eq('id', userId)
      .single();


    if (error || !data) {
      return false;
    }

    // Check if onboarding is complete (allow plan generation even if onboarding is not complete)
    if (!data.onboarding_complete) {
    } else {
    }

    // Check if all required fields are present
    const requiredFields = [
      'age', 'gender', 'height_cm', 'weight_kg',
      'target_timeline_weeks', 'fitness_experience', 'activity_level',
      'dietary_preferences', 'meal_frequency', 'target_calories'
    ];

    // For maintain weight goal, target_weight_kg can be null
    const isMaintainWeight = data.fitness_goal === 'maintain-weight';
    if (!isMaintainWeight) {
      requiredFields.push('target_weight_kg');
    }

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!(data as any)[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test function to check if the edge function is accessible
 */
export async function testEdgeFunctionConnection(): Promise<boolean> {
  try {
    // Try to invoke the edge function with a minimal payload to test connectivity
    // Use a valid UUID format to avoid database errors
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
    const { data, error } = await supabase.functions.invoke('generate-plans', {
      body: { userId: testUserId, regenerate: false }
    });


    // If we get any response (even an error), the function is deployed and accessible
    if (data !== null || error !== null) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
}

/**
 * Checks the plan generation status for a user
 * @param userId - User's ID
 * @returns Promise resolving to the plan generation status
 */
export async function getPlanGenerationStatus(userId: string): Promise<'generating' | 'completed' | 'failed' | 'not_started'> {
  try {
    // First, check if there's an active generating plan
    const { data: generatingData, error: generatingError } = await supabase
      .from('user_plans')
      .select('generation_status, is_active, created_at')
      .eq('user_id', userId)
      .eq('generation_status', 'generating')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // If there's a generating plan, return that status
    if (!generatingError && generatingData) {
      console.log('Found generating plan:', generatingData);
      return 'generating';
    }
    
    // Otherwise, check for the most recent plan
    const { data, error } = await supabase
      .from('user_plans')
      .select('generation_status, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();


    if (error) {
      if (error.code === 'PGRST116') {
        // No plan found
        return 'not_started';
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return 'not_started';
    }

    return data.generation_status || 'not_started';
  } catch (error) {
    return 'failed';
  }
}

/**
 * Debug function to check all plans for a user
 */
export async function debugUserPlans(userId: string): Promise<void> {
  try {
    
    // Check all plans (active and inactive)
    const { data: allPlans, error: allError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });


    // Check only active plans
    const { data: activePlans, error: activeError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);


  } catch (error) {
  }
}

/**
 * Example usage in the app:
 *
 * // Generate a new plan
 * const planResponse = await generatePlanViaEdgeFunction({
 *   userId: user.id,
 *   regenerate: false
 * });
 *
 * if (planResponse.success) {
 *   // Navigate to plan display screen
 * } else {
 * }
 *
 * // Get user's active plan
 * const activePlan = await getUserActivePlan(user.id);
 * if (activePlan) {
 * }
 */