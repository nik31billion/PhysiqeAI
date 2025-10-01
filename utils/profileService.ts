import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  onboarding_complete: boolean;
  onboarding_step: number;
  
  // Basic Information
  primary_goal: string;
  fitness_goal: string;
  other_goal_description: string;
  
  // Personal Stats
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  
  // Fitness Preferences
  workout_frequency: number;
  workout_duration: number;
  preferred_workout_time: string;
  fitness_experience: string;
  
  // Goals and Preferences
  target_weight_kg: number;
  target_date: string;
  motivation_level: number;
  preferred_exercises: string[];
  
  // Lifestyle and Preferences
  dietary_preferences: string;
  allergies: string[];
  medical_conditions: string[];
  equipment_available: string[];
  
  // Final Preferences
  notification_preferences: any;
  privacy_settings: any;
  additional_notes: string;
  selected_plan: string;
  coupon_code: string;
  
  // Profile Picture
  profile_picture: string;
  
  // Physique Inspiration
  physique_inspiration: string;
  physique_character_id: string;
  physique_uploaded_image: string;
  physique_category: string;
  
  // Additional Onboarding Fields
  target_timeline_weeks: number;
  fitness_obstacles: string[];
  meal_frequency: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UserPlan {
  id: string;
  user_id: string;
  plan_version: number;
  generated_at: string;
  is_active: boolean;
  user_snapshot: any;
  workout_plan: any;
  diet_plan: any;
  generation_status: string;
  error_message: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch user profile data from Supabase
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      
      return null;
    }

    return data;
  } catch (error) {
    
    return null;
  }
};

/**
 * Fetch user's active plan from Supabase
 */
export const fetchUserActivePlan = async (userId: string): Promise<UserPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      
      return null;
    }

    return data;
  } catch (error) {
    
    return null;
  }
};

/**
 * Get user's display name from profile or email
 */
export const getUserDisplayName = (profile: UserProfile | null): string => {
  if (!profile) return 'User';
  
  // Prioritize custom display name if set
  if (profile.display_name && profile.display_name.trim()) {
    return profile.display_name.trim();
  }
  
  // Fallback to email username if no custom name is set
  if (profile.email) {
    const emailName = profile.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return 'User';
};

/**
 * Format height for display
 */
export const formatHeight = (heightCm: number | null): string => {
  if (!heightCm) return 'N/A';
  return `${heightCm} cm`;
};

/**
 * Format weight for display
 */
export const formatWeight = (weightKg: number | null): string => {
  if (!weightKg) return 'N/A';
  return `${weightKg} kg`;
};

/**
 * Get diet plan display name from user plan
 */
export const getDietPlanName = (plan: UserPlan | null): string => {
  if (!plan || !plan.diet_plan) return 'Custom Plan';
  
  try {
    const dietPlan = plan.diet_plan;
    if (dietPlan.plan_name) {
      return dietPlan.plan_name;
    }
    
    // Generate a name based on dietary preferences and goals
    const userSnapshot = plan.user_snapshot;
    if (userSnapshot) {
      const dietaryPref = userSnapshot.dietary_preferences || 'Balanced';
      const goal = userSnapshot.primary_goal || 'Fitness';
      return `${dietaryPref} ${goal} Plan`;
    }
    
    return 'Custom Plan';
  } catch (error) {
    
    return 'Custom Plan';
  }
};

/**
 * Get diet plan pills/tags from user plan
 */
export const getDietPlanPills = (plan: UserPlan | null): string[] => {
  if (!plan || !plan.diet_plan) return ['🍽️ 3 meals/day'];
  
  try {
    const dietPlan = plan.diet_plan;
    const pills: string[] = [];
    
    // Add dietary preference
    const userSnapshot = plan.user_snapshot;
    if (userSnapshot?.dietary_preferences) {
      const pref = userSnapshot.dietary_preferences.toLowerCase();
      if (pref.includes('vegetarian')) {
        pills.push('🌱 Vegetarian');
      } else if (pref.includes('vegan')) {
        pills.push('🌱 Vegan');
      } else if (pref.includes('keto')) {
        pills.push('🥑 Keto');
      } else if (pref.includes('paleo')) {
        pills.push('🥩 Paleo');
      }
    }
    
    // Add activity level
    if (userSnapshot?.activity_level) {
      const activity = userSnapshot.activity_level.toLowerCase();
      if (activity.includes('sedentary')) {
        pills.push('💤 Light');
      } else if (activity.includes('lightly') || activity.includes('moderately')) {
        pills.push('💪 Moderate');
      } else if (activity.includes('very') || activity.includes('extremely')) {
        pills.push('🔥 Intense');
      }
    }
    
    // Add meal frequency
    if (userSnapshot?.meal_frequency) {
      const frequency = userSnapshot.meal_frequency;
      if (frequency.includes('3')) {
        pills.push('🍽️ 3 meals/day');
      } else if (frequency.includes('4')) {
        pills.push('🍽️ 4 meals/day');
      } else if (frequency.includes('5')) {
        pills.push('🍽️ 5 meals/day');
      }
    }
    
    // Default if no pills found
    if (pills.length === 0) {
      pills.push('🍽️ 3 meals/day');
    }
    
    return pills;
  } catch (error) {
    
    return ['🍽️ 3 meals/day'];
  }
};

/**
 * Update user profile data in Supabase
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    
    throw error;
  }
};