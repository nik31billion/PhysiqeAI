/**
 * Service for calling the calorie calculation edge function
 */

import { supabase } from './supabase';

export interface CalorieCalculationInputs {
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  activity_level: 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active' | 'Super active';
  goal_type: 'lose' | 'gain' | 'maintain';
  goal_timeframe_weeks: number;
}

export interface CalorieCalculationOutputs {
  bmr: number;
  tdee: number;
  targetCalories: number;
  activityCapped?: boolean;
  activityCappedMessage?: string;
}

/**
 * Calls the Supabase edge function to calculate BMR, TDEE, and daily calorie target
 * @param inputs - User inputs from onboarding
 * @returns Promise resolving to calorie calculation results
 */
export async function calculateCaloriesViaEdgeFunction(inputs: CalorieCalculationInputs): Promise<CalorieCalculationOutputs> {
  try {
    const { data, error } = await supabase.functions.invoke('calculate-calories', {
      body: inputs
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from calorie calculation');
    }

    return data as CalorieCalculationOutputs;
  } catch (error) {
    console.error('Error calling calorie calculation edge function:', error);
    throw error;
  }
}

/**
 * Alternative: Use the local calculation function (for testing or fallback)
 * Import this from './calorieCalculations' if you want to use local calculations instead
 */
export { calculateCalories as calculateCaloriesLocally } from './calorieCalculations';

/**
 * Example usage in onboarding flow:
 *
 * // After collecting all required data from onboarding screens
 * const userData = {
 *   age: 28,
 *   gender: 'male',
 *   height_cm: 175,
 *   weight_kg: 80,
 *   goal_weight_kg: 75,
 *   activity_level: 'Moderately active',
 *   goal_type: 'lose',
 *   goal_timeframe_weeks: 12
 * };
 *
 * try {
 *   const calories = await calculateCaloriesViaEdgeFunction(userData);
 *   console.log('Calculated calories:', calories);
 *   // Store these values in your database or use them for plan generation
 * } catch (error) {
 *   console.error('Failed to calculate calories:', error);
 *   // Handle error (show user message, retry, etc.)
 * }
 */
