import { supabase } from './supabase';
import { AURA_EVENT_TYPES, AURA_POINTS } from './constants';

interface StateUpdateResult {
  success: boolean;
  error?: string;
  data?: any;
}

class UnifiedStateManager {
  private static instance: UnifiedStateManager;
  private listeners: Map<string, Set<(data: any) => void>>;
  private cache: Map<string, any>;

  private constructor() {
    this.listeners = new Map();
    this.cache = new Map();
  }

  public static getInstance(): UnifiedStateManager {
    if (!UnifiedStateManager.instance) {
      UnifiedStateManager.instance = new UnifiedStateManager();
    }
    return UnifiedStateManager.instance;
  }

  private notifyListeners(key: string, data: any) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(data));
    }
  }

  public subscribe(key: string, listener: (data: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
      }
    };
  }

  private async updateCache(key: string, data: any) {
    this.cache.set(key, data);
    this.notifyListeners(key, data);
  }

  public async handleMealCompletion(
    userId: string,
    planId: string,
    mealIndex: number,
    mealName: string,
    calories: number
  ): Promise<StateUpdateResult> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update local cache IMMEDIATELY for instant UI updates
      const cacheKey = `user:${userId}:today`;
      const currentCache = this.cache.get(cacheKey) || {
        completedMeals: new Set(),
        caloriesConsumed: 0,
        auraPoints: 0,
        targetCalories: 2000 // Default target calories
      };

      const updatedCache = {
        ...currentCache,
        completedMeals: new Set([...currentCache.completedMeals, mealIndex]),
        caloriesConsumed: currentCache.caloriesConsumed + calories,
        auraPoints: currentCache.auraPoints + AURA_POINTS.MEAL_COMPLETION,
        caloriesLeft: Math.max(0, currentCache.targetCalories - (currentCache.caloriesConsumed + calories))
      };

      // Update cache instantly - no waiting
      this.cache.set(cacheKey, updatedCache);
      this.notifyListeners(cacheKey, updatedCache);

      // Do database operations in background - don't wait for them
      this.updateDatabaseInBackground(userId, planId, mealIndex, mealName, calories, today);

      return { success: true, data: updatedCache };
    } catch (error) {
      console.error('Error in handleMealCompletion:', error);
      return { success: false, error: 'Failed to complete meal' };
    }
  }

  private async updateDatabaseInBackground(
    userId: string,
    planId: string,
    mealIndex: number,
    mealName: string,
    calories: number,
    today: string
  ) {
    try {
      // Do all database updates in parallel without waiting
      Promise.all([
        supabase.from('meal_completions').insert({
          user_id: userId,
          plan_id: planId,
          completed_date: today,
          meal_index: mealIndex,
          meal_name: mealName,
          calories,
          completed_at: new Date().toISOString(),
          is_active: true
        }),
        
        supabase.from('aura_events').insert({
          user_id: userId,
          event_type: AURA_EVENT_TYPES.MEAL_COMPLETION,
          points: AURA_POINTS.MEAL_COMPLETION,
          event_date: today,
          metadata: { meal_index: mealIndex }
        }),
        
        supabase.from('daily_nutrition').upsert({
          user_id: userId,
          date: today,
          calories_consumed: calories,
          last_meal_completion: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        })
      ]);
    } catch (error) {
      console.error('Background database update failed:', error);
    }
  }

  public async getCurrentState(userId: string): Promise<any> {
    const cacheKey = `user:${userId}:today`;
    return this.cache.get(cacheKey);
  }

  public clearCache() {
    this.cache.clear();
  }
}

export const unifiedStateManager = UnifiedStateManager.getInstance();
