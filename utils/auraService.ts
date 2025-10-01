/**
 * Aura Service - Core gamification system for Flex Aura
 * Handles all Aura points, events, achievements, and streak tracking
 */

import { supabase } from './supabase';

// Types and Interfaces
export interface AuraEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_description: string;
  aura_delta: number;
  current_aura_total: number;
  event_date: string;
  event_timestamp: string;
  metadata?: any;
}

export interface UserAuraSummary {
  id: string;
  user_id: string;
  total_aura: number;
  current_streak: number;
  best_streak: number;
  last_activity_date: string;
  daily_aura_earned: number;
  achievements_unlocked: string[];
  last_achievement_date: string;
  last_share_date: string;
  shares_today: number;
  last_coach_glo_date: string;
  coach_glo_interactions_today: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  aura_reward: number;
  icon_name: string;
  category: string;
  requirements: any;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  aura_earned: number;
  achievement?: Achievement;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  weight_date: string;
  notes?: string;
  weight_change_from_start?: number;
  is_goal_weight: boolean;
  created_at: string;
}

// Event Types for Aura System
export const AURA_EVENT_TYPES = {
  // Consistency & Streaks
  DAILY_WORKOUT: 'daily_workout',
  EXERCISE_COMPLETION: 'exercise_completion',
  MEAL_COMPLETION: 'meal_completion',
  ALL_MEALS_DAY: 'all_meals_day',
  SEVEN_DAY_STREAK: 'seven_day_streak',
  NEW_BEST_STREAK: 'new_best_streak',
  DAILY_CHECKIN: 'daily_checkin',
  
  // Progress & Accountability
  PROGRESS_PHOTO: 'progress_photo',
  MEASUREMENT_UPDATE: 'measurement_update',
  MILESTONE_HIT: 'milestone_hit',
  PROGRESS_SHARE: 'progress_share',
  
  // Coach Glo
  COACH_GLO_CHAT: 'coach_glo_chat',
  PLAN_TWEAK_REQUEST: 'plan_tweak_request',
  
  // Social / Viral
  GLOW_CARD_SHARE: 'glow_card_share',
  FRIEND_REFERRAL: 'friend_referral',
  
  // Penalties
  MISSED_WORKOUT: 'missed_workout',
  MISSED_MEAL: 'missed_meal',
  
  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
} as const;

// Aura Point Values
export const AURA_POINTS = {
  DAILY_WORKOUT: 10,
  EXERCISE_COMPLETION: 10,
  MEAL_COMPLETION: 3,
  ALL_MEALS_BONUS: 10,
  SEVEN_DAY_STREAK_BONUS: 30,
  NEW_BEST_STREAK: 20,
  DAILY_CHECKIN: 1,
  PROGRESS_PHOTO: 8,
  MEASUREMENT_UPDATE: 4,
  MILESTONE_HIT: 15, // Base value, can be 10-25
  PROGRESS_SHARE: 15,
  COACH_GLO_CHAT: 3,
  PLAN_TWEAK_REQUEST: 5,
  GLOW_CARD_SHARE: 20,
  FRIEND_REFERRAL: 50,
  MISSED_WORKOUT: -5,
  MISSED_MEAL: -5,
} as const;

// Daily limits to prevent abuse
export const DAILY_LIMITS = {
  COACH_GLO_CHAT: 1,
  PLAN_TWEAK_REQUEST: 1, // per week
  GLOW_CARD_SHARE: 1,
  PROGRESS_SHARE: 1,
  MAX_DAILY_PENALTY: -10,
} as const;

/**
 * Get user's current Aura summary
 */
export async function getUserAuraSummary(userId: string): Promise<UserAuraSummary | null> {
  try {
    const { data, error } = await supabase
      .from('user_aura_summary')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single()

    if (error) {
      return null;
    }

    // If no data exists, create a new Aura summary for the user
    if (!data) {
      const { data: newSummary, error: createError } = await supabase
        .from('user_aura_summary')
        .insert({
          user_id: userId,
          total_aura: 0,
          current_streak: 0,
          best_streak: 0,
          daily_aura_earned: 0,
          achievements_unlocked: [],
          shares_today: 0,
          coach_glo_interactions_today: 0
        })
        .select()
        .single();

      if (createError) {
        return null;
      }

      return newSummary;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Add Aura points for an event
 */
export async function addAuraPoints(
  userId: string,
  eventType: string,
  auraDelta: number,
  eventDescription?: string,
  metadata?: any
): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    // First, ensure user has an Aura summary
    const currentSummary = await getUserAuraSummary(userId);
    if (!currentSummary) {
      return { success: false, error: 'Failed to get or create user Aura summary' };
    }

    const currentAura = currentSummary.total_aura;
    const newAura = Math.max(0, currentAura + auraDelta);

    // Insert the Aura event
    const { error: eventError } = await supabase
      .from('aura_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_description: eventDescription || null,
        aura_delta: auraDelta,
        current_aura_total: newAura,
        metadata: metadata || null
      });

    if (eventError) {
      return { success: false, error: eventError.message };
    }

    // Update the user's Aura summary
    const { error: updateError } = await supabase
      .from('user_aura_summary')
      .update({
        total_aura: newAura,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, newTotal: newAura };
  } catch (error) {
    return { success: false, error: 'Failed to add aura points' };
  }
}

/**
 * Get user's Aura events history
 */
export async function getAuraEvents(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; data?: AuraEvent[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('aura_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch aura events' };
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string): Promise<{ success: boolean; data?: UserAchievement[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch user achievements' };
  }
}

/**
 * Check and unlock new achievements
 */
export async function checkAchievements(userId: string): Promise<{ success: boolean; newAchievements?: any[]; error?: string }> {
  try {
    
    // Get user's current stats
    const summary = await getUserAuraSummary(userId);
    if (!summary) {
      return { success: false, error: 'No aura summary found' };
    }

    // Get all available achievements
    const { data: allAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (achievementsError) {
      return { success: false, error: 'Failed to fetch achievements' };
    }

    // Get user's already unlocked achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (userAchievementsError) {
      return { success: false, error: 'Failed to fetch user achievements' };
    }

    const unlockedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
    const newAchievements: any[] = [];

    // Check each achievement
    for (const achievement of allAchievements || []) {
      if (unlockedAchievementIds.has(achievement.id)) {
        continue; // Already unlocked
      }

      let shouldUnlock = false;

      // Check achievement requirements
      switch (achievement.id) {
        case 'first_day':
          shouldUnlock = summary.total_days_completed >= 1;
          break;
        case 'three_day_streak':
          shouldUnlock = summary.current_streak >= 3;
          break;
        case 'seven_day_streak':
          shouldUnlock = summary.current_streak >= 7;
          break;
        case 'fourteen_day_streak':
          shouldUnlock = summary.current_streak >= 14;
          break;
        case 'first_workout':
          // Check if user has completed any workout
          const { data: workoutCompletions } = await supabase
            .from('individual_completions')
            .select('id')
            .eq('user_id', userId)
            .eq('completion_type', 'exercise')
            .limit(1);
          shouldUnlock = workoutCompletions && workoutCompletions.length > 0;
          break;
        case 'first_meal':
          // Check if user has completed any meal
          const { data: mealCompletions } = await supabase
            .from('individual_completions')
            .select('id')
            .eq('user_id', userId)
            .eq('completion_type', 'meal')
            .limit(1);
          shouldUnlock = mealCompletions && mealCompletions.length > 0;
          break;
        case 'aura_collector':
          shouldUnlock = summary.total_aura >= 100;
          break;
        case 'aura_master':
          shouldUnlock = summary.total_aura >= 500;
          break;
        case 'aura_legend':
          shouldUnlock = summary.total_aura >= 1000;
          break;
        case 'social_butterfly':
          shouldUnlock = summary.shares_today >= 1;
          break;
        case 'coach_glow_fan':
          shouldUnlock = summary.coach_glo_interactions_today >= 1;
          break;
        default:
          continue;
      }

      if (shouldUnlock) {
        
        // Unlock the achievement
        const { error: unlockError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            aura_earned: achievement.aura_reward
          });

        if (unlockError) {
          continue;
        }

        // Add aura points for the achievement
        await addAuraPoints(
          userId,
          AURA_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
          achievement.aura_reward,
          `Unlocked: ${achievement.name}`,
          { achievement_id: achievement.id }
        );

        newAchievements.push(achievement);
      }
    }

    return { success: true, newAchievements };
  } catch (error) {
    return { success: false, error: 'Failed to check achievements' };
  }
}

/**
 * Handle daily workout completion
 */
export async function handleDailyWorkoutCompletion(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    // Check if already completed today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingEvent } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.DAILY_WORKOUT)
      .eq('event_date', today)
      .maybeSingle();

    if (existingEvent) {
      return { success: true, auraEarned: 0 }; // Already completed
    }

    // Add aura points for daily workout
    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.DAILY_WORKOUT,
      AURA_POINTS.DAILY_WORKOUT,
      'Completed daily workout'
    );

    if (!result.success) {
      return result;
    }

    // Update streak and check for achievements
    await updateStreak(userId);
    await checkAchievements(userId);

    return { success: true, auraEarned: AURA_POINTS.DAILY_WORKOUT };
  } catch (error) {
    return { success: false, error: 'Failed to handle workout completion' };
  }
}

/**
 * Handle meal completion
 */
export async function handleMealCompletion(
  userId: string,
  mealIndex: number,
  totalMeals: number
): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if this specific meal is already completed today
    const { data: existingEvent } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.MEAL_COMPLETION)
      .eq('event_date', today)
      .eq('metadata->>meal_index', mealIndex.toString())
      .maybeSingle();

    if (existingEvent) {
      return { success: true, auraEarned: 0 }; // Already completed
    }

    // Add aura points for meal completion
    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.MEAL_COMPLETION,
      AURA_POINTS.MEAL_COMPLETION,
      `Completed meal ${mealIndex + 1}`,
      { meal_index: mealIndex }
    );

    if (!result.success) {
      return result;
    }

    // Check if all meals are completed for the day
    const { data: completedMeals } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.MEAL_COMPLETION)
      .eq('event_date', today);

    if (completedMeals && completedMeals.length >= totalMeals) {
      // All meals completed - add bonus
      await addAuraPoints(
        userId,
        AURA_EVENT_TYPES.ALL_MEALS_DAY,
        AURA_POINTS.ALL_MEALS_BONUS,
        'All meals completed today!'
      );
    }

    return { success: true, auraEarned: AURA_POINTS.MEAL_COMPLETION };
  } catch (error) {
    return { success: false, error: 'Failed to handle meal completion' };
  }
}

/**
 * Update user's streak based on recent activity
 */
export async function updateStreak(userId: string): Promise<{ success: boolean; newStreak?: number; error?: string }> {
  try {
    // Get recent workout completions
    const { data: recentWorkouts, error } = await supabase
      .from('aura_events')
      .select('event_date')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.DAILY_WORKOUT)
      .order('event_date', { ascending: false })
      .limit(30);

    if (error) {
      return { success: false, error: error.message };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const dates = recentWorkouts?.map(w => new Date(w.event_date)) || [];

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      const workoutDate = new Date(dates[i]);
      workoutDate.setHours(0, 0, 0, 0);

      if (workoutDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Update streak in user_aura_summary
    const { data: summary } = await supabase
      .from('user_aura_summary')
      .select('best_streak')
      .eq('user_id', userId)
      .maybeSingle();

    const bestStreak = summary?.best_streak || 0;
    const newBestStreak = Math.max(bestStreak, currentStreak);

    const { error: updateError } = await supabase
      .from('user_aura_summary')
      .update({
        current_streak: currentStreak,
        best_streak: newBestStreak,
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Check for streak bonuses
    if (currentStreak === 7) {
      await addAuraPoints(
        userId,
        AURA_EVENT_TYPES.SEVEN_DAY_STREAK,
        AURA_POINTS.SEVEN_DAY_STREAK_BONUS,
        '7-day streak bonus!'
      );
    }

    if (newBestStreak > bestStreak) {
      await addAuraPoints(
        userId,
        AURA_EVENT_TYPES.NEW_BEST_STREAK,
        AURA_POINTS.NEW_BEST_STREAK,
        `New best streak: ${newBestStreak} days!`
      );
    }

    return { success: true, newStreak: currentStreak };
  } catch (error) {
    return { success: false, error: 'Failed to update streak' };
  }
}

/**
 * Handle progress photo upload
 */
export async function handleProgressPhotoUpload(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.PROGRESS_PHOTO,
      AURA_POINTS.PROGRESS_PHOTO,
      'Uploaded progress photo'
    );

    if (!result.success) {
      return result;
    }

    await checkAchievements(userId);
    return { success: true, auraEarned: AURA_POINTS.PROGRESS_PHOTO };
  } catch (error) {
    return { success: false, error: 'Failed to handle progress photo upload' };
  }
}

/**
 * Handle measurement update
 */
export async function handleMeasurementUpdate(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.MEASUREMENT_UPDATE,
      AURA_POINTS.MEASUREMENT_UPDATE,
      'Updated body measurements'
    );

    if (!result.success) {
      return result;
    }

    await checkAchievements(userId);
    return { success: true, auraEarned: AURA_POINTS.MEASUREMENT_UPDATE };
  } catch (error) {
    return { success: false, error: 'Failed to handle measurement update' };
  }
}

/**
 * Handle Coach Glo interaction
 */
export async function handleCoachGloInteraction(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check daily limit
    const { data: summary } = await supabase
      .from('user_aura_summary')
      .select('last_coach_glo_date, coach_glo_interactions_today')
      .eq('user_id', userId)
      .maybeSingle();

    if (summary?.last_coach_glo_date === today && summary.coach_glo_interactions_today >= DAILY_LIMITS.COACH_GLO_CHAT) {
      return { success: true, auraEarned: 0 }; // Daily limit reached
    }

    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.COACH_GLO_CHAT,
      AURA_POINTS.COACH_GLO_CHAT,
      'Chatted with Coach Glo'
    );

    if (!result.success) {
      return result;
    }

    // Update daily interaction count
    const updateData: any = {
      last_coach_glo_date: today,
      coach_glo_interactions_today: 1
    };

    if (summary?.last_coach_glo_date === today) {
      updateData.coach_glo_interactions_today = summary.coach_glo_interactions_today + 1;
    }

    await supabase
      .from('user_aura_summary')
      .update(updateData)
      .eq('user_id', userId);

    return { success: true, auraEarned: AURA_POINTS.COACH_GLO_CHAT };
  } catch (error) {
    return { success: false, error: 'Failed to handle Coach Glo interaction' };
  }
}

/**
 * Handle Glow Card sharing
 */
export async function handleGlowCardShare(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check daily limit
    const { data: summary } = await supabase
      .from('user_aura_summary')
      .select('last_share_date, shares_today')
      .eq('user_id', userId)
      .maybeSingle();

    if (summary?.last_share_date === today && summary.shares_today >= DAILY_LIMITS.GLOW_CARD_SHARE) {
      return { success: true, auraEarned: 0 }; // Daily limit reached
    }

    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.GLOW_CARD_SHARE,
      AURA_POINTS.GLOW_CARD_SHARE,
      'Shared Glow Card on social media'
    );

    if (!result.success) {
      return result;
    }

    // Update daily share count
    const updateData: any = {
      last_share_date: today,
      shares_today: 1
    };

    if (summary?.last_share_date === today) {
      updateData.shares_today = summary.shares_today + 1;
    }

    await supabase
      .from('user_aura_summary')
      .update(updateData)
      .eq('user_id', userId);

    await checkAchievements(userId);
    return { success: true, auraEarned: AURA_POINTS.GLOW_CARD_SHARE };
  } catch (error) {
    return { success: false, error: 'Failed to handle Glow Card share' };
  }
}

/**
 * Handle progress photo upload with sharing
 */
export async function handleProgressPhotoUploadWithShare(
  userId: string,
  shareToSocial: boolean = false
): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const result = await handleProgressPhotoUpload(userId);
    
    if (result.success && shareToSocial) {
      // Add bonus aura for sharing progress photo
      const shareResult = await addAuraPoints(
        userId,
        AURA_EVENT_TYPES.PROGRESS_SHARE,
        AURA_POINTS.PROGRESS_SHARE,
        'Shared progress photo on social media'
      );
      
      if (shareResult.success) {
        result.auraEarned = (result.auraEarned || 0) + AURA_POINTS.PROGRESS_SHARE;
      }
    }
    
    return result;
  } catch (error) {
    return { success: false, error: 'Failed to handle progress photo upload' };
  }
}

/**
 * Handle missed workout penalty
 */
export async function handleMissedWorkout(userId: string): Promise<{ success: boolean; auraLost?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already penalized today
    const { data: existingPenalty } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.MISSED_WORKOUT)
      .eq('event_date', today)
      .maybeSingle();

    if (existingPenalty) {
      return { success: true, auraLost: 0 }; // Already penalized today
    }

    // Check daily penalty limit
    const { data: dailyPenalties } = await supabase
      .from('aura_events')
      .select('aura_delta')
      .eq('user_id', userId)
      .in('event_type', [AURA_EVENT_TYPES.MISSED_WORKOUT, AURA_EVENT_TYPES.MISSED_MEAL])
      .eq('event_date', today);

    const totalDailyPenalty = dailyPenalties?.reduce((sum, p) => sum + Math.abs(p.aura_delta), 0) || 0;
    
    if (totalDailyPenalty >= Math.abs(DAILY_LIMITS.MAX_DAILY_PENALTY)) {
      return { success: true, auraLost: 0 }; // Daily penalty limit reached
    }

    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.MISSED_WORKOUT,
      AURA_POINTS.MISSED_WORKOUT,
      'Missed planned workout'
    );

    if (!result.success) {
      return result;
    }

    return { success: true, auraLost: Math.abs(AURA_POINTS.MISSED_WORKOUT) };
  } catch (error) {
    return { success: false, error: 'Failed to handle missed workout' };
  }
}

/**
 * Get user's weight tracking data
 */
export async function getWeightTracking(userId: string): Promise<{ success: boolean; data?: WeightEntry[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_weight_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('weight_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch weight tracking' };
  }
}

/**
 * Add weight entry
 */
export async function addWeightEntry(
  userId: string,
  weightKg: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get starting weight for comparison
    const { data: startingWeight } = await supabase
      .from('user_weight_tracking')
      .select('weight_kg')
      .eq('user_id', userId)
      .order('weight_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    const weightChangeFromStart = startingWeight ? 
      weightKg - startingWeight.weight_kg : 0;

    const { error } = await supabase
      .from('user_weight_tracking')
      .upsert({
        user_id: userId,
        weight_kg: weightKg,
        weight_date: today,
        notes: notes || null,
        weight_change_from_start: weightChangeFromStart
      }, {
        onConflict: 'user_id,weight_date'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check for weight milestones
    if (weightChangeFromStart <= -5) {
      await addAuraPoints(
        userId,
        AURA_EVENT_TYPES.MILESTONE_HIT,
        40,
        'Lost 5kg milestone!'
      );
    } else if (weightChangeFromStart <= -10) {
      await addAuraPoints(
        userId,
        AURA_EVENT_TYPES.MILESTONE_HIT,
        80,
        'Lost 10kg milestone!'
      );
    }

    await checkAchievements(userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to add weight entry' };
  }
}

/**
 * Get Aura level and mood for avatar display
 */
export function getAuraLevel(totalAura: number): { level: string; mood: string; color: string } {
  if (totalAura >= 1000) {
    return { level: 'Legendary', mood: 'glowing', color: '#FFD700' };
  } else if (totalAura >= 500) {
    return { level: 'Elite', mood: 'excited', color: '#FF6B6B' };
  } else if (totalAura >= 200) {
    return { level: 'Advanced', mood: 'motivated', color: '#4ECDC4' };
  } else if (totalAura >= 100) {
    return { level: 'Intermediate', mood: 'confident', color: '#45B7D1' };
  } else if (totalAura >= 50) {
    return { level: 'Beginner+', mood: 'positive', color: '#96CEB4' };
  } else if (totalAura >= 20) {
    return { level: 'Beginner', mood: 'normal', color: '#FFEAA7' };
  } else {
    return { level: 'Starting', mood: 'cloudy', color: '#DDA0DD' };
  }
}

/**
 * Reset daily counters (should be called daily)
 */
export async function resetDailyCounters(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_aura_summary')
      .update({
        daily_aura_earned: 0,
        shares_today: 0,
        coach_glo_interactions_today: 0
      })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reset daily counters' };
  }
}
