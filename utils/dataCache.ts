/**
 * Data caching utility to eliminate loading delays between screen transitions
 */

import { UserProfile, UserPlan } from './profileService';
import { StoredPlan } from './planService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // User-specific cache keys
  getUserProfileKey(userId: string): string {
    return `user_profile_${userId}`;
  }

  getUserPlanKey(userId: string): string {
    return `user_plan_${userId}`;
  }

  getCompletionStatsKey(userId: string): string {
    return `completion_stats_${userId}`;
  }

  getCompletedDaysKey(userId: string): string {
    return `completed_days_${userId}`;
  }

  getIndividualCompletionsKey(userId: string, date: string): string {
    return `individual_completions_${userId}_${date}`;
  }
}

export const dataCache = new DataCache();
