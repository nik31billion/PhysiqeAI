/**
 * Onboarding Calorie Calculation Service
 * Handles calculation and storage of BMR, TDEE, and target calories during onboarding
 */

import { supabase } from './supabase';
import { calculateCaloriesViaEdgeFunction, CalorieCalculationInputs } from './calorieService';

export interface UserProfileCalorieData {
  id: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_goal: 'lose-fat' | 'gain-muscle' | 'maintain-weight' | 'other';
  activity_level: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'super-active';
  target_weight_kg: number;
  target_timeline_weeks: number;
  bmr?: number;
  tdee?: number;
  target_calories?: number;
}

/**
 * Maps fitness_goal from onboarding to goal_type for calorie calculation
 */
function mapFitnessGoalToGoalType(fitnessGoal: string): 'lose' | 'gain' | 'maintain' {
  switch (fitnessGoal) {
    case 'lose-fat':
      return 'lose';
    case 'gain-muscle':
      return 'gain';
    case 'maintain-weight':
      return 'maintain';
    case 'other':
      // For 'other' goals, default to maintain unless we have specific logic
      return 'maintain';
    default:
      return 'maintain';
  }
}

/**
 * Maps activity_level from onboarding to calorie calculation format
 */
function mapActivityLevel(activityLevel: string): 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active' | 'Super active' {
  switch (activityLevel) {
    case 'sedentary':
      return 'Sedentary';
    case 'lightly-active':
      return 'Lightly active';
    case 'moderately-active':
      return 'Moderately active';
    case 'very-active':
      return 'Very active';
    case 'super-active':
      return 'Super active';
    default:
      return 'Sedentary'; // Default fallback
  }
}

/**
 * Maps gender from onboarding to calorie calculation format
 */
function mapGender(gender: string): 'male' | 'female' {
  switch (gender) {
    case 'male':
      return 'male';
    case 'female':
      return 'female';
    case 'other':
      // For 'other', we need to default to one. This could be improved with user preference
      return 'male'; // Default fallback
    default:
      return 'male';
  }
}

/**
 * Checks if all required data is available for calorie calculation
 */
export function hasRequiredCalorieData(profile: Partial<UserProfileCalorieData>): boolean {
  const requiredFields = [
    'gender',
    'age',
    'height_cm',
    'weight_kg',
    'fitness_goal',
    'activity_level',
    'target_timeline_weeks'
  ];

  // For maintain weight goal, target_weight_kg can be null/undefined
  const isMaintainWeight = profile.fitness_goal === 'maintain-weight';
  if (!isMaintainWeight) {
    requiredFields.push('target_weight_kg');
  }

  return requiredFields.every(field => {
    const value = profile[field as keyof UserProfileCalorieData];
    return value !== undefined && value !== null &&
           (typeof value === 'number' ? value > 0 : value !== '');
  });
}

/**
 * Calculates and stores calorie data for a user profile
 */
export async function calculateAndStoreCalories(profile: UserProfileCalorieData): Promise<{
  success: boolean;
  data?: { bmr: number; tdee: number; target_calories: number; activityCapped?: boolean; activityCappedMessage?: string };
  error?: string;
}> {
  try {
    // Validate that we have all required data
    if (!hasRequiredCalorieData(profile)) {
      return {
        success: false,
        error: 'Missing required data for calorie calculation'
      };
    }

    // Map the onboarding data to calorie calculation format
    // For maintain weight goal, use current weight as target weight
    const goalWeight = profile.fitness_goal === 'maintain-weight' 
      ? profile.weight_kg 
      : profile.target_weight_kg;

    const calorieInputs: CalorieCalculationInputs = {
      age: profile.age,
      gender: mapGender(profile.gender),
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      goal_weight_kg: goalWeight,
      activity_level: mapActivityLevel(profile.activity_level),
      goal_type: mapFitnessGoalToGoalType(profile.fitness_goal),
      goal_timeframe_weeks: profile.target_timeline_weeks
    };

    // Calculate calories using the edge function
    const calorieResults = await calculateCaloriesViaEdgeFunction(calorieInputs);

    // Store the results in the database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        bmr: calorieResults.bmr,
        tdee: calorieResults.tdee,
        target_calories: calorieResults.targetCalories,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating calorie data:', updateError);
      return {
        success: false,
        error: `Failed to save calorie data: ${updateError.message}`
      };
    }

    console.log('Successfully calculated and stored calorie data:', calorieResults);

    return {
      success: true,
      data: {
        bmr: calorieResults.bmr,
        tdee: calorieResults.tdee,
        target_calories: calorieResults.targetCalories,
        activityCapped: calorieResults.activityCapped,
        activityCappedMessage: calorieResults.activityCappedMessage
      }
    };

  } catch (error) {
    console.error('Error calculating and storing calories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retrieves user's calorie data from the database
 */
export async function getUserCalorieData(userId: string): Promise<{
  success: boolean;
  data?: { bmr: number; tdee: number; target_calories: number; activityCapped?: boolean; activityCappedMessage?: string };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('bmr, tdee, target_calories')
      .eq('id', userId)
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to retrieve calorie data: ${error.message}`
      };
    }

    if (!data || !data.bmr || !data.tdee || !data.target_calories) {
      return {
        success: false,
        error: 'Calorie data not found or incomplete'
      };
    }

    return {
      success: true,
      data: {
        bmr: data.bmr,
        tdee: data.tdee,
        target_calories: data.target_calories
      }
    };

  } catch (error) {
    console.error('Error retrieving calorie data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Checks if user has complete calorie data and calculates if missing
 */
export async function ensureUserHasCalorieData(userId: string): Promise<{
  success: boolean;
  data?: { bmr: number; tdee: number; target_calories: number; activityCapped?: boolean; activityCappedMessage?: string };
  error?: string;
}> {
  try {
    // First, get the user's current profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id, gender, age, height_cm, weight_kg, fitness_goal, activity_level,
        target_weight_kg, target_timeline_weeks, bmr, tdee, target_calories
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      return {
        success: false,
        error: `Failed to retrieve user profile: ${profileError.message}`
      };
    }

    // Check if calorie data already exists and is complete
    if (profile.bmr && profile.tdee && profile.target_calories) {
      console.log('Calorie data already exists, skipping calculation');
      return {
        success: true,
        data: {
          bmr: profile.bmr,
          tdee: profile.tdee,
          target_calories: profile.target_calories
        }
      };
    }

    // Check if we have all required data for calculation
    if (!hasRequiredCalorieData(profile)) {
      console.log('Required data not yet available for calorie calculation');
      return {
        success: false,
        error: 'Required data not yet available for calorie calculation'
      };
    }

    // Calculate and store calorie data if missing
    console.log('Calculating calorie data for user:', userId);
    const result = await calculateAndStoreCalories(profile as UserProfileCalorieData);

    if (!result.success || !result.data) {
      return result;
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('Error ensuring calorie data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
