import { supabase } from './supabase';
import { invalidateCacheForOnboarding } from './universalCacheInvalidation';
import { User } from '@supabase/supabase-js';

export interface OnboardingData {
  // Basic Information
  primary_goal?: string;
  fitness_goal?: string;
  other_goal_description?: string;
  
  // Personal Stats
  gender?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  
  // Fitness Preferences
  workout_frequency?: number;
  workout_duration?: number;
  preferred_workout_time?: string;
  fitness_experience?: string;
  
  // Goals and Preferences
  target_weight_kg?: number;
  target_date?: string;
  motivation_level?: number;
  preferred_exercises?: string[];
  
  // Lifestyle and Preferences
  dietary_preferences?: string;
  allergies?: string[];
  medical_conditions?: string[];
  equipment_available?: string[];
  
  // Final Preferences
  notification_preferences?: any;
  privacy_settings?: any;
  additional_notes?: string;
  selected_plan?: string;
  coupon_code?: string;
  
  // Profile Picture
  profile_picture?: string;
  
  // Physique Inspiration
  physique_inspiration?: string;
  physique_character_id?: string;
  physique_uploaded_image?: string;
  physique_category?: string;
  physique_custom_description?: string;
  
  // Additional Onboarding Fields
  target_timeline_weeks?: number;
  fitness_obstacles?: string[];
  meal_frequency?: string;
  
  // Calorie Calculation Results
  bmr?: number;
  tdee?: number;
  target_calories?: number;
  
  // Progress tracking
  onboarding_step?: number;
  onboarding_complete?: boolean;
}

export interface UserProfile extends OnboardingData {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export class OnboardingService {
  /**
   * Get user profile data
   */
  static async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update user profile with onboarding data
   */
  static async updateUserProfile(
    userId: string, 
    updates: Partial<OnboardingData>
  ): Promise<{ data: UserProfile | null; error: any }> {
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

      // Invalidate cache after successful profile update
      if (!error && data) {
        invalidateCacheForOnboarding(userId, 0); // 0 indicates general profile update
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Save onboarding step data
   */
  static async saveOnboardingStep(
    userId: string,
    step: number,
    stepData: Partial<OnboardingData>
  ): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...stepData,
          onboarding_step: step,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      // Invalidate cache after successful onboarding step save
      if (!error && data) {
        invalidateCacheForOnboarding(userId, step);
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Mark onboarding as complete
   */
  static async completeOnboarding(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    console.log('🏁 OnboardingService.completeOnboarding called for userId:', userId);
    try {
      console.log('📝 Updating user profile with onboarding_complete: true');
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_complete: true,
          onboarding_step: 22, // Final step
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      console.log('📊 completeOnboarding database response:', { data, error });
      
      // Invalidate cache after successful onboarding completion
      if (!error && data) {
        invalidateCacheForOnboarding(userId, 22); // Final step
      }
      
      return { data, error };
    } catch (error) {
      console.error('💥 OnboardingService.completeOnboarding error:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async isOnboardingComplete(userId: string): Promise<{ isComplete: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_complete, onboarding_step')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { isComplete: false, error };
      }

      return { isComplete: data?.onboarding_complete || false, error: null };
    } catch (error) {
      return { isComplete: false, error };
    }
  }

  /**
   * Get the next onboarding step for the user
   */
  static async getNextOnboardingStep(userId: string): Promise<{ step: number; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_step, onboarding_complete')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { step: 4, error }; // Start from step 4 (first onboarding screen)
      }

      if (data?.onboarding_complete) {
        return { step: -1, error: null }; // Onboarding complete, go to dashboard
      }

      // Return the current step (which is already the next incomplete step)
      const currentStep = data?.onboarding_step || 4;
      return { step: Math.max(4, currentStep), error: null };
    } catch (error) {
      return { step: 4, error };
    }
  }

  /**
   * Create initial profile for new user
   */
  static async createUserProfile(user: User): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          onboarding_complete: false,
          onboarding_step: 0,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Reset onboarding progress (for testing or user request)
   */
  static async resetOnboarding(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_complete: false,
          onboarding_step: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}
