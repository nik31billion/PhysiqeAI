/**
 * Sharing Limit Service
 * Handles daily/weekly sharing limits and aura rewards
 */

import { supabase } from './supabase';

export interface SharingLimitInfo {
  canShare: boolean;
  dailyRemaining: number;
  weeklyRemaining: number;
  dailyLimit: number;
  weeklyLimit: number;
  dailyAura: number;
  weeklyAura: number;
  dailyCount: number;
  weeklyCount: number;
}

export interface ShareResult {
  success: boolean;
  auraEarned?: number;
  platform?: string;
  dailyRemaining?: number;
  weeklyRemaining?: number;
  error?: string;
}

/**
 * Check if user can share and get limit information
 */
export async function checkSharingLimits(userId: string): Promise<SharingLimitInfo | null> {
  try {
    const { data, error } = await supabase.rpc('can_user_share', {
      user_uuid: userId
    });

    if (error) {
      
      return null;
    }

    return data as SharingLimitInfo;
  } catch (error) {
    
    return null;
  }
}

/**
 * Record a share and get aura reward
 */
export async function recordShare(userId: string, platform: string): Promise<ShareResult> {
  try {
    const { data, error } = await supabase.rpc('record_share', {
      user_uuid: userId,
      platform_name: platform
    });

    if (error) {
      
      return { success: false, error: 'Failed to record share' };
    }

    return data as ShareResult;
  } catch (error) {
    
    return { success: false, error: 'Failed to record share' };
  }
}

/**
 * Get sharing statistics for a user
 */
export async function getSharingStats(userId: string): Promise<{
  totalShares: number;
  todayShares: number;
  weekShares: number;
  totalAuraEarned: number;
} | null> {
  try {
    // Get total shares
    const { data: totalData, error: totalError } = await supabase
      .from('sharing_activities')
      .select('*')
      .eq('user_id', userId);

    if (totalError) {
      
      return null;
    }

    // Get today's shares
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayData, error: todayError } = await supabase
      .from('sharing_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('shared_at', today.toISOString());

    if (todayError) {
      
      return null;
    }

    // Get week's shares
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekData, error: weekError } = await supabase
      .from('sharing_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('shared_at', weekAgo.toISOString());

    if (weekError) {
      
      return null;
    }

    const totalAuraEarned = totalData?.reduce((sum, share) => sum + (share.aura_earned || 0), 0) || 0;

    return {
      totalShares: totalData?.length || 0,
      todayShares: todayData?.length || 0,
      weekShares: weekData?.length || 0,
      totalAuraEarned
    };
  } catch (error) {
    
    return null;
  }
}

/**
 * Get sharing history for a user
 */
export async function getSharingHistory(userId: string, limit: number = 20): Promise<{
  id: string;
  platform: string;
  shared_at: string;
  aura_earned: number;
}[] | null> {
  try {
    const { data, error } = await supabase
      .from('sharing_activities')
      .select('id, platform, shared_at, aura_earned')
      .eq('user_id', userId)
      .order('shared_at', { ascending: false })
      .limit(limit);

    if (error) {
      
      return null;
    }

    return data || [];
  } catch (error) {
    
    return null;
  }
}

/**
 * Check if user has reached daily limit
 */
export async function hasReachedDailyLimit(userId: string): Promise<boolean> {
  const limits = await checkSharingLimits(userId);
  return limits ? limits.dailyRemaining <= 0 : true;
}

/**
 * Check if user has reached weekly limit
 */
export async function hasReachedWeeklyLimit(userId: string): Promise<boolean> {
  const limits = await checkSharingLimits(userId);
  return limits ? limits.weeklyRemaining <= 0 : true;
}

/**
 * Get remaining shares for today
 */
export async function getRemainingSharesToday(userId: string): Promise<number> {
  const limits = await checkSharingLimits(userId);
  return limits ? limits.dailyRemaining : 0;
}

/**
 * Get remaining shares for this week
 */
export async function getRemainingSharesWeek(userId: string): Promise<number> {
  const limits = await checkSharingLimits(userId);
  return limits ? limits.weeklyRemaining : 0;
}
