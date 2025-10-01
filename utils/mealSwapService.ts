import { supabase } from './supabase';

export interface MealData {
  meal: string;
  description: string;
  kcal: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  instructions?: string[];
  cooking_time?: string;
  serving_size?: string;
}

export interface MealSwapRequest {
  userId: string;
  currentMeal: MealData;
  dayName: string;
  mealType: string;
  mealIndex?: number;
  targetCalories?: number;
}

export interface MealSwapResponse {
  success: boolean;
  newMeal?: MealData;
  error?: string;
  message?: string;
}

/**
 * Swap a meal using the edge function
 */
export const swapMeal = async (
  request: MealSwapRequest
): Promise<MealSwapResponse> => {
  try {

    const { data, error } = await supabase.functions.invoke('swap-meal', {
      body: request
    });

    if (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to swap meal' 
      };
    }

    if (!data.success) {
      return { 
        success: false, 
        error: data.error || 'Failed to generate new meal' 
      };
    }

    return {
      success: true,
      newMeal: data.newMeal,
      message: data.message
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Update a meal in the user's current plan
 */
export const updateMealInPlan = async (
  userId: string,
  dayName: string,
  mealType: string,
  newMeal: MealData,
  mealIndex?: number
): Promise<{ success: boolean; error?: string }> => {
  try {

    // Get the current active plan
    const { data: plan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return { success: false, error: 'Plan not found' };
    }

    // Find and update the specific meal in the diet plan
    const dietPlan = plan.diet_plan || [];
    let mealUpdated = false;


    const updatedDietPlan = dietPlan.map((day: any) => {
      if (day.day.toLowerCase().includes(dayName.toLowerCase())) {
        
        const updatedMeals = day.meals.map((meal: any, index: number) => {
          // Use meal index if available, otherwise fall back to name matching
          const shouldUpdate = mealIndex !== undefined 
            ? index === mealIndex
            : (meal.meal.toLowerCase().includes(mealType.toLowerCase()) || 
               mealType.toLowerCase().includes(meal.meal.toLowerCase()));
          
          
          if (shouldUpdate) {
            mealUpdated = true;
            return {
              ...meal,
              ...newMeal
            };
          }
          return meal;
        });
        return { ...day, meals: updatedMeals };
      }
      return day;
    });

    if (!mealUpdated) {
      return { success: false, error: 'Meal not found in current plan' };
    }

    // Update the plan in the database
    
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({ 
        diet_plan: updatedDietPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan.id);

    if (updateError) {
      return { success: false, error: 'Failed to update plan' };
    }

    
    // Verify the update by fetching the plan again
    const { data: verifyPlan, error: verifyError } = await supabase
      .from('user_plans')
      .select('diet_plan')
      .eq('id', plan.id)
      .single();
    
    if (verifyError) {
    } else {
    }
    
    // Invalidate cache to force UI refresh
    try {
      const { invalidateCacheForProfile } = await import('./universalCacheInvalidation');
      await invalidateCacheForProfile(userId, 'plan_edit');
    } catch (cacheError) {
    }
    
    // Also update the instant data directly
    try {
      const { updateStoredPlan } = await import('./instantDataManager');
      // Update the plan with the new diet plan
      const updatedPlan = {
        ...plan,
        diet_plan: updatedDietPlan,
        updated_at: new Date().toISOString()
      };
      updateStoredPlan(userId, updatedPlan);
    } catch (instantError) {
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Complete meal swap process: generate new meal and update plan
 */
export const completeMealSwap = async (
  request: MealSwapRequest
): Promise<MealSwapResponse> => {
  try {
    // First, generate the new meal
    const swapResult = await swapMeal(request);
    
    if (!swapResult.success || !swapResult.newMeal) {
      return swapResult;
    }

    // Then, update the meal in the user's plan
    const updateResult = await updateMealInPlan(
      request.userId,
      request.dayName,
      request.mealType,
      swapResult.newMeal,
      request.mealIndex
    );

    if (!updateResult.success) {
      return {
        success: false,
        error: `Meal generated but failed to update plan: ${updateResult.error}`
      };
    }

    return {
      success: true,
      newMeal: swapResult.newMeal,
      message: `Successfully swapped meal to: ${swapResult.newMeal.meal}`
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
