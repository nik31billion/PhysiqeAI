/**
 * Daily Aura Service - Handles daily Aura events and maintenance
 */

import { supabase } from './supabase';
import { 
  addAuraPoints, 
  AURA_EVENT_TYPES, 
  AURA_POINTS,
  resetDailyCounters,
  updateStreak,
  checkAchievements
} from './auraService';

/**
 * Handle daily check-in (user opens the app)
 */
export async function handleDailyCheckin(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const { data: existingEvent } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.DAILY_CHECKIN)
      .eq('event_date', today)
      .single();

    if (existingEvent) {
      return { success: true, auraEarned: 0 }; // Already checked in today
    }

    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.DAILY_CHECKIN,
      AURA_POINTS.DAILY_CHECKIN,
      'Daily check-in'
    );

    if (!result.success) {
      return result;
    }

    return { success: true, auraEarned: AURA_POINTS.DAILY_CHECKIN };
  } catch (error) {
    return { success: false, error: 'Failed to handle daily check-in' };
  }
}

/**
 * Handle plan tweak request
 */
export async function handlePlanTweakRequest(userId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already requested this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekStartString = weekStart.toISOString().split('T')[0];
    
    const { data: existingEvent } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.PLAN_TWEAK_REQUEST)
      .gte('event_date', weekStartString)
      .single();

    if (existingEvent) {
      return { success: true, auraEarned: 0 }; // Already requested this week
    }

    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.PLAN_TWEAK_REQUEST,
      AURA_POINTS.PLAN_TWEAK_REQUEST,
      'Requested plan modification'
    );

    if (!result.success) {
      return result;
    }

    await checkAchievements(userId);
    return { success: true, auraEarned: AURA_POINTS.PLAN_TWEAK_REQUEST };
  } catch (error) {
    return { success: false, error: 'Failed to handle plan tweak request' };
  }
}

/**
 * Handle friend referral
 */
export async function handleFriendReferral(userId: string, referredUserId: string): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    // Check if already referred this user
    const { data: existingEvent } = await supabase
      .from('aura_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', AURA_EVENT_TYPES.FRIEND_REFERRAL)
      .eq('metadata->>referred_user_id', referredUserId)
      .single();

    if (existingEvent) {
      return { success: true, auraEarned: 0 }; // Already referred this user
    }

    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.FRIEND_REFERRAL,
      AURA_POINTS.FRIEND_REFERRAL,
      'Referred a friend',
      { referred_user_id: referredUserId }
    );

    if (!result.success) {
      return result;
    }

    await checkAchievements(userId);
    return { success: true, auraEarned: AURA_POINTS.FRIEND_REFERRAL };
  } catch (error) {
    return { success: false, error: 'Failed to handle friend referral' };
  }
}

/**
 * Handle milestone achievement
 */
export async function handleMilestoneAchievement(
  userId: string,
  milestoneType: string,
  milestoneValue: any,
  auraReward: number = AURA_POINTS.MILESTONE_HIT
): Promise<{ success: boolean; auraEarned?: number; error?: string }> {
  try {
    const result = await addAuraPoints(
      userId,
      AURA_EVENT_TYPES.MILESTONE_HIT,
      auraReward,
      `Achieved milestone: ${milestoneType}`,
      { milestone_type: milestoneType, milestone_value: milestoneValue }
    );

    if (!result.success) {
      return result;
    }

    await checkAchievements(userId);
    return { success: true, auraEarned: auraReward };
  } catch (error) {
    return { success: false, error: 'Failed to handle milestone achievement' };
  }
}

/**
 * Daily maintenance - reset counters and check for missed activities
 */
export async function performDailyMaintenance(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Reset daily counters
    await resetDailyCounters(userId);
    
    // Update streak (this will handle streak calculations)
    await updateStreak(userId);
    
    // Check for new achievements
    await checkAchievements(userId);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to perform daily maintenance' };
  }
}

/**
 * Check for missed activities and apply penalties
 */
export async function checkMissedActivities(userId: string): Promise<{ success: boolean; penaltiesApplied?: number; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    let penaltiesApplied = 0;
    
    // Check if user had a planned workout today but didn't complete it
    const { data: plannedWorkout } = await supabase
      .from('user_plans')
      .select('workout_plan')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (plannedWorkout?.workout_plan) {
      const { data: completedWorkout } = await supabase
        .from('aura_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', AURA_EVENT_TYPES.DAILY_WORKOUT)
        .eq('event_date', today)
        .single();
      
      if (!completedWorkout) {
        // Apply missed workout penalty
        const { data: penaltyResult } = await supabase.rpc('add_aura_points', {
          p_user_id: userId,
          p_event_type: AURA_EVENT_TYPES.MISSED_WORKOUT,
          p_aura_delta: AURA_POINTS.MISSED_WORKOUT,
          p_event_description: 'Missed planned workout',
          p_metadata: null
        });
        
        if (penaltyResult) {
          penaltiesApplied++;
        }
      }
    }
    
    return { success: true, penaltiesApplied };
  } catch (error) {
    return { success: false, error: 'Failed to check missed activities' };
  }
}

/**
 * Get daily Aura summary for user
 */
export async function getDailyAuraSummary(userId: string): Promise<{
  success: boolean;
  data?: {
    todayAuraEarned: number;
    todayEvents: any[];
    streakStatus: string;
    nextMilestone: string;
  };
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's aura events
    const { data: todayEvents, error: eventsError } = await supabase
      .from('aura_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_date', today)
      .order('event_timestamp', { ascending: false });
    
    if (eventsError) {
      throw eventsError;
    }
    
    const todayAuraEarned = todayEvents?.reduce((sum, event) => sum + event.aura_delta, 0) || 0;
    
    // Get user's current streak
    const { data: auraSummary } = await supabase
      .from('user_aura_summary')
      .select('current_streak, total_aura')
      .eq('user_id', userId)
      .single();
    
    const currentStreak = auraSummary?.current_streak || 0;
    const totalAura = auraSummary?.total_aura || 0;
    
    // Determine streak status
    let streakStatus = 'No streak';
    if (currentStreak > 0) {
      streakStatus = `${currentStreak}-day streak`;
    }
    
    // Determine next milestone
    let nextMilestone = 'Complete your first workout';
    if (totalAura < 50) {
      nextMilestone = 'Reach 50 Aura points';
    } else if (totalAura < 100) {
      nextMilestone = 'Reach 100 Aura points';
    } else if (totalAura < 200) {
      nextMilestone = 'Reach 200 Aura points';
    } else if (currentStreak < 7) {
      nextMilestone = 'Achieve 7-day streak';
    } else if (currentStreak < 14) {
      nextMilestone = 'Achieve 14-day streak';
    } else {
      nextMilestone = 'Keep the momentum going!';
    }
    
    return {
      success: true,
      data: {
        todayAuraEarned,
        todayEvents: todayEvents || [],
        streakStatus,
        nextMilestone,
      },
    };
  } catch (error) {
    return { success: false, error: 'Failed to get daily aura summary' };
  }
}
