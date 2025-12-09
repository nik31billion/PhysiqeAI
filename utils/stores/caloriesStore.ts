/**
 * Zustand store for calories data with AsyncStorage persistence
 * Provides instant access to calories data without waiting for DB queries
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

interface CaloriesState {
  // Current day's data
  consumedCalories: number;
  totalCalories: number;
  plannedMealCalories: number;
  scannerCalories: number;
  
  // Meal completions for today (to avoid recalculating)
  completedMealIndices: Set<number>;
  
  // Loading states
  isLoading: boolean;
  lastSynced: number | null;
  
  // Actions
  setConsumedCalories: (calories: number) => void;
  setTotalCalories: (calories: number) => void;
  addMealCompletion: (mealIndex: number, mealCalories: number, userId?: string, date?: string) => Promise<void>;
  addScannerCalories: (calories: number, userId?: string, date?: string) => Promise<void>;
  loadFromCache: (userId: string, date: string) => Promise<void>;
  syncWithDatabase: (userId: string, date: string, userPlan: any) => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY_PREFIX = 'calories_store_';

export const useCaloriesStore = create<CaloriesState>((set, get) => ({
  consumedCalories: 0,
  totalCalories: 0,
  plannedMealCalories: 0,
  scannerCalories: 0,
  completedMealIndices: new Set<number>(),
  isLoading: false,
  lastSynced: null,

  setConsumedCalories: (calories: number) => {
    set({ consumedCalories: calories });
  },

  setTotalCalories: (calories: number) => {
    set({ totalCalories: calories });
  },

  addMealCompletion: async (mealIndex: number, mealCalories: number, userId?: string, date?: string) => {
    const state = get();
    
    // Check if meal is already completed to avoid double counting
    if (state.completedMealIndices.has(mealIndex)) {
      return; // Already completed, skip
    }
    
    const newIndices = new Set(state.completedMealIndices);
    newIndices.add(mealIndex);
    
    const newPlannedCalories = state.plannedMealCalories + mealCalories;
    const newConsumed = newPlannedCalories + state.scannerCalories;
    
    // Update store immediately - this will trigger re-renders in subscribed components
    set({
      completedMealIndices: newIndices,
      plannedMealCalories: newPlannedCalories,
      consumedCalories: newConsumed,
    });
    
    // Persist to AsyncStorage immediately if userId and date provided
    if (userId && date) {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${date}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify({
          consumedCalories: newConsumed,
          totalCalories: state.totalCalories,
          plannedMealCalories: newPlannedCalories,
          scannerCalories: state.scannerCalories,
          completedMealIndices: Array.from(newIndices),
          lastSynced: state.lastSynced,
        }));
      } catch (error) {
        console.error('Error saving calories to cache:', error);
      }
    }
  },

  addScannerCalories: async (calories: number, userId?: string, date?: string) => {
    const state = get();
    const newScannerCalories = state.scannerCalories + calories;
    const newConsumed = state.plannedMealCalories + newScannerCalories;
    
    set({
      scannerCalories: newScannerCalories,
      consumedCalories: newConsumed,
    });
    
    // Persist to AsyncStorage immediately if userId and date provided
    if (userId && date) {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${date}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify({
          consumedCalories: newConsumed,
          totalCalories: state.totalCalories,
          plannedMealCalories: state.plannedMealCalories,
          scannerCalories: newScannerCalories,
          completedMealIndices: Array.from(state.completedMealIndices),
          lastSynced: state.lastSynced,
        }));
      } catch (error) {
        console.error('Error saving calories to cache:', error);
      }
    }
  },

  loadFromCache: async (userId: string, date: string) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${date}`;
      const cached = await AsyncStorage.getItem(storageKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        // Convert array back to Set
        const completedIndices = new Set<number>(data.completedMealIndices || []);
        
        set({
          consumedCalories: data.consumedCalories || 0,
          totalCalories: data.totalCalories || 0,
          plannedMealCalories: data.plannedMealCalories || 0,
          scannerCalories: data.scannerCalories || 0,
          completedMealIndices: completedIndices,
          lastSynced: data.lastSynced || null,
        });
      }
    } catch (error) {
      console.error('Error loading calories from cache:', error);
    }
  },

  syncWithDatabase: async (userId: string, date: string, userPlan: any) => {
    const state = get();
    
    // Don't sync if already synced recently (within 30 seconds)
    if (state.lastSynced && Date.now() - state.lastSynced < 30000) {
      return;
    }

    // Store current optimistic state before sync
    const optimisticConsumed = state.consumedCalories;
    const optimisticPlanned = state.plannedMealCalories;
    const optimisticIndices = new Set(state.completedMealIndices);

    set({ isLoading: true });

    try {
      // Calculate calories from completed planned meals
      let plannedMealCalories = 0;
      let dbCompletedIndices = new Set<number>();
      
      if (userPlan) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = weekDays[dayOfWeek];
        
        const currentDiet = userPlan.diet_plan?.weeks?.[0]?.days?.find(
          (d: any) => d.day.toLowerCase() === currentDay
        );
        
        if (currentDiet?.meals) {
          const { getCompletedMeals } = await import('../completionService');
          const completedMealsResult = await getCompletedMeals(userId);
          
          if (completedMealsResult.success && completedMealsResult.data) {
            dbCompletedIndices = new Set(completedMealsResult.data.map((c: any) => c.meal_index));
            
            plannedMealCalories = currentDiet.meals
              .filter((_: any, index: number) => dbCompletedIndices.has(index))
              .reduce((total: number, meal: any) => {
                let calories = meal.kcal || 0;
                if (calories === 0 && meal.description) {
                  // Extract calories from description if needed
                  const match = meal.description.match(/(\d+)\s*kcal/i);
                  if (match) {
                    calories = parseInt(match[1], 10);
                  }
                }
                return total + calories;
              }, 0);
          }
        }
      }
      
      // Calculate calories from food scanner entries
      let scannerCalories = 0;
      try {
        const { getDailyNutritionSummary } = await import('../dailyFoodIntakeService');
        const scannerResult = await getDailyNutritionSummary(userId);
        
        if (scannerResult.success && scannerResult.data) {
          scannerCalories = scannerResult.data.total_calories || 0;
        }
      } catch (scannerError) {
        console.log('Could not fetch scanner calories:', scannerError);
      }
      
      // Merge optimistic updates with DB data
      // Combine indices from both sources (optimistic might have newer completions)
      const finalIndices = new Set([...dbCompletedIndices, ...optimisticIndices]);
      
      // Recalculate planned calories based on merged indices to ensure accuracy
      // This handles cases where DB hasn't synced yet but optimistic has the meal
      let recalculatedPlannedCalories = 0;
      if (userPlan) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = weekDays[dayOfWeek];
        
        const currentDiet = userPlan.diet_plan?.weeks?.[0]?.days?.find(
          (d: any) => d.day.toLowerCase() === currentDay
        );
        
        if (currentDiet?.meals) {
          // Calculate calories for all completed meals (from merged indices)
          recalculatedPlannedCalories = currentDiet.meals
            .filter((_: any, index: number) => finalIndices.has(index))
            .reduce((total: number, meal: any) => {
              let calories = meal.kcal || 0;
              if (calories === 0 && meal.description) {
                // Extract calories from description if needed
                const match = meal.description.match(/(\d+)\s*kcal/i);
                if (match) {
                  calories = parseInt(match[1], 10);
                }
              }
              return total + calories;
            }, 0);
        }
      }
      
      // Use the higher value between recalculated and optimistic to handle edge cases
      // CRITICAL: Always prefer optimistic if it has more completed meals (newer completions)
      const hasMoreOptimisticCompletions = optimisticIndices.size > dbCompletedIndices.size;
      const finalPlannedCalories = hasMoreOptimisticCompletions 
        ? optimisticPlanned 
        : Math.max(recalculatedPlannedCalories, optimisticPlanned);
      const finalConsumed = finalPlannedCalories + scannerCalories;
      
      // CRITICAL FIX: If optimistic has more completed meals, use optimistic indices
      // This ensures that meals completed just now (but not yet in DB) are preserved
      const finalIndicesToUse = hasMoreOptimisticCompletions 
        ? optimisticIndices 
        : finalIndices;
      
      // Always update if we have any changes (optimistic or DB)
      const shouldUpdate = finalIndicesToUse.size > 0 || finalConsumed !== optimisticConsumed;
      
      if (shouldUpdate) {
        // Update state with merged data - prioritize optimistic if it's newer
        set({
          consumedCalories: finalConsumed,
          plannedMealCalories: finalPlannedCalories,
          scannerCalories,
          completedMealIndices: finalIndicesToUse,
          lastSynced: Date.now(),
          isLoading: false,
        });
        
        // Persist the merged state to cache
        try {
          const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${date}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify({
            consumedCalories: finalConsumed,
            totalCalories: state.totalCalories,
            plannedMealCalories: finalPlannedCalories,
            scannerCalories,
            completedMealIndices: Array.from(finalIndicesToUse),
            lastSynced: Date.now(),
          }));
        } catch (error) {
          console.error('Error saving merged calories to cache:', error);
        }
      } else {
        // Keep optimistic data, just update scanner calories and sync time
        set({
          scannerCalories,
          lastSynced: Date.now(),
          isLoading: false,
        });
      }
      
      // Save to cache with final merged values
      const finalState = get();
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${date}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        consumedCalories: finalState.consumedCalories,
        totalCalories: finalState.totalCalories,
        plannedMealCalories: finalState.plannedMealCalories,
        scannerCalories: finalState.scannerCalories,
        completedMealIndices: Array.from(finalState.completedMealIndices),
        lastSynced: finalState.lastSynced,
      }));
      
    } catch (error) {
      console.error('Error syncing calories with database:', error);
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      consumedCalories: 0,
      totalCalories: 0,
      plannedMealCalories: 0,
      scannerCalories: 0,
      completedMealIndices: new Set<number>(),
      lastSynced: null,
    });
  },
}));

