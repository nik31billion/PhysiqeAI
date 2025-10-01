/**
 * Real-time state management system for instant updates across all screens
 * This eliminates the need for cache invalidation and re-fetching
 */

import { dataCache } from './dataCache';

// Event system for real-time updates
class RealTimeStateManager {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private state: Map<string, any> = new Map();

  /**
   * Subscribe to real-time updates for a specific data type
   */
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Update state and notify all subscribers instantly
   */
  updateState(key: string, data: any): void {
    
    
    // Update the state
    this.state.set(key, data);
    
    // Update cache with fresh data
    dataCache.set(key, data);
    
    // Notify all subscribers instantly
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          
        }
      });
    }
  }

  /**
   * Get current state
   */
  getState(key: string): any {
    return this.state.get(key);
  }

  /**
   * Update completion stats in real-time
   */
  updateCompletionStats(userId: string, newStats: any): void {
    const key = dataCache.getCompletionStatsKey(userId);
    this.updateState(key, newStats);
  }

  /**
   * Update user profile in real-time
   */
  updateUserProfile(userId: string, newProfile: any): void {
    const key = dataCache.getUserProfileKey(userId);
    this.updateState(key, newProfile);
  }

  /**
   * Update user plan in real-time
   */
  updateUserPlan(userId: string, newPlan: any): void {
    const key = dataCache.getUserPlanKey(userId);
    this.updateState(key, newPlan);
  }

  /**
   * Update stored plan in real-time
   */
  updateStoredPlan(userId: string, newPlan: any): void {
    const key = `stored_plan_${userId}`;
    this.updateState(key, newPlan);
  }

  /**
   * Update completed days in real-time
   */
  updateCompletedDays(userId: string, newDays: any): void {
    const key = dataCache.getCompletedDaysKey(userId);
    this.updateState(key, newDays);
  }

  /**
   * Handle meal completion with instant updates
   */
  handleMealCompletion(userId: string, planId: string, mealIndex: number, mealName: string): void {
    
    
    // Get current completion stats
    const statsKey = dataCache.getCompletionStatsKey(userId);
    const currentStats = this.getState(statsKey);
    
    if (currentStats) {
      // Update stats instantly
      const updatedStats = {
        ...currentStats,
        totalMealsCompleted: currentStats.totalMealsCompleted + 1,
        mealsCompletedToday: currentStats.mealsCompletedToday + 1,
        lastUpdated: new Date().toISOString()
      };
      
      this.updateCompletionStats(userId, updatedStats);
    }

    // Update completed days
    const daysKey = dataCache.getCompletedDaysKey(userId);
    const currentDays = this.getState(daysKey);
    
    if (currentDays) {
      const today = new Date().toISOString().split('T')[0];
      const updatedDays = {
        ...currentDays,
        [today]: {
          ...currentDays[today],
          mealsCompleted: (currentDays[today]?.mealsCompleted || 0) + 1,
          lastUpdated: new Date().toISOString()
        }
      };
      
      this.updateCompletedDays(userId, updatedDays);
    }
  }

  /**
   * Handle exercise completion with instant updates
   */
  handleExerciseCompletion(userId: string, planId: string, exerciseIndex: number, exerciseName: string): void {
    
    
    // Get current completion stats
    const statsKey = dataCache.getCompletionStatsKey(userId);
    const currentStats = this.getState(statsKey);
    
    if (currentStats) {
      // Update stats instantly
      const updatedStats = {
        ...currentStats,
        totalExercisesCompleted: currentStats.totalExercisesCompleted + 1,
        exercisesCompletedToday: currentStats.exercisesCompletedToday + 1,
        lastUpdated: new Date().toISOString()
      };
      
      this.updateCompletionStats(userId, updatedStats);
    }

    // Update completed days
    const daysKey = dataCache.getCompletedDaysKey(userId);
    const currentDays = this.getState(daysKey);
    
    if (currentDays) {
      const today = new Date().toISOString().split('T')[0];
      const updatedDays = {
        ...currentDays,
        [today]: {
          ...currentDays[today],
          exercisesCompleted: (currentDays[today]?.exercisesCompleted || 0) + 1,
          lastUpdated: new Date().toISOString()
        }
      };
      
      this.updateCompletedDays(userId, updatedDays);
    }
  }

  /**
   * Handle day completion with instant updates
   */
  handleDayCompletion(userId: string, planId: string): void {
    
    
    // Get current completion stats
    const statsKey = dataCache.getCompletionStatsKey(userId);
    const currentStats = this.getState(statsKey);
    
    if (currentStats) {
      // Update stats instantly
      const updatedStats = {
        ...currentStats,
        totalDaysCompleted: currentStats.totalDaysCompleted + 1,
        currentStreak: currentStats.currentStreak + 1,
        lastUpdated: new Date().toISOString()
      };
      
      this.updateCompletionStats(userId, updatedStats);
    }

    // Update completed days
    const daysKey = dataCache.getCompletedDaysKey(userId);
    const currentDays = this.getState(daysKey);
    
    if (currentDays) {
      const today = new Date().toISOString().split('T')[0];
      const updatedDays = {
        ...currentDays,
        [today]: {
          ...currentDays[today],
          isCompleted: true,
          completedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
      
      this.updateCompletedDays(userId, updatedDays);
    }
  }

  /**
   * Handle plan regeneration with instant updates
   */
  handlePlanRegeneration(userId: string, newPlan: any): void {
    
    
    // Update both user plan and stored plan
    this.updateUserPlan(userId, newPlan);
    this.updateStoredPlan(userId, newPlan);
  }
}

// Export singleton instance
export const realTimeStateManager = new RealTimeStateManager();
