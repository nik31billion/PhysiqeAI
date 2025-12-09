import { supabase } from './supabase';
import { FoodItem } from '../components/FoodAnalysisResults';

export interface DailyFoodIntakeEntry {
  id?: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  food_name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  source: 'food_scanner' | 'barcode_scanner' | 'manual_entry';
  confidence_score?: number;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at?: string;
  updated_at?: string;
}

export interface DailyNutritionSummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  food_count: number;
}

/**
 * Adds a single food item to daily intake
 */
export async function addFoodToDaily(
  userId: string,
  foodItem: FoodItem,
  source: 'food_scanner' | 'barcode_scanner' | 'manual_entry' = 'food_scanner',
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<{ success: boolean; data?: DailyFoodIntakeEntry; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const calories = Math.round(foodItem.nutrition.calories);
    
    // Optimistic update: Add calories to store immediately
    try {
      const { useCaloriesStore } = await import('./stores/caloriesStore');
      const store = useCaloriesStore.getState();
      await store.addScannerCalories(calories, userId, today);
    } catch (storeError) {
      // Silently fail if store not available - backward compatibility
      console.log('Store update skipped:', storeError);
    }
    
    const foodEntry: Omit<DailyFoodIntakeEntry, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      date: today,
      food_name: foodItem.name,
      quantity: foodItem.quantity,
      calories: calories,
      protein_g: Math.round(foodItem.nutrition.protein * 10) / 10, // 1 decimal place
      carbs_g: Math.round(foodItem.nutrition.carbs * 10) / 10, // 1 decimal place
      fat_g: Math.round(foodItem.nutrition.fat * 10) / 10, // 1 decimal place
      fiber_g: Math.round((foodItem.nutrition.fiber || 0) * 10) / 10, // 1 decimal place
      sugar_g: Math.round((foodItem.nutrition.sugar || 0) * 10) / 10, // 1 decimal place
      sodium_mg: foodItem.nutrition.sodium || 0,
      source: source,
      confidence_score: foodItem.nutrition.confidence || 0,
      meal_type: mealType,
    };

    addBreadcrumb('Adding food to daily intake', 'food_intake', { 
      userId, 
      foodName: foodItem.name,
      source,
      mealType,
    });
    
    const { data, error } = await supabase
      .from('daily_food_intake')
      .insert([foodEntry])
      .select()
      .single();

    if (error) {
      console.error('Error adding food to daily intake:', error);
      captureException(new Error(`Failed to add food to daily intake: ${error.message}`), {
        foodIntake: {
          operation: 'addFoodToDaily',
          userId,
          foodName: foodItem.name,
          source,
          errorCode: error.code,
          errorMessage: error.message,
        },
      });
      return { success: false, error: error.message };
    }

    console.log('Successfully added food to daily intake:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in addFoodToDaily:', error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      foodIntake: {
        operation: 'addFoodToDaily',
        userId,
        errorType: 'exception',
      },
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Adds multiple food items to daily intake (for batch operations)
 */
export async function addMultipleFoodsToDaily(
  userId: string,
  foodItems: FoodItem[],
  source: 'food_scanner' | 'barcode_scanner' | 'manual_entry' = 'food_scanner',
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<{ success: boolean; data?: DailyFoodIntakeEntry[]; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate total calories for optimistic update
    const totalCalories = foodItems.reduce(
      (total, item) => total + Math.round(item.nutrition.calories),
      0
    );
    
    // Optimistic update: Add calories to store immediately
    try {
      const { useCaloriesStore } = await import('./stores/caloriesStore');
      const store = useCaloriesStore.getState();
      await store.addScannerCalories(totalCalories, userId, today);
    } catch (storeError) {
      // Silently fail if store not available - backward compatibility
      console.log('Store update skipped:', storeError);
    }
    
    const foodEntries: Omit<DailyFoodIntakeEntry, 'id' | 'created_at' | 'updated_at'>[] = 
      foodItems.map(foodItem => ({
        user_id: userId,
        date: today,
        food_name: foodItem.name,
        quantity: foodItem.quantity,
        calories: Math.round(foodItem.nutrition.calories),
        protein_g: Math.round(foodItem.nutrition.protein * 10) / 10, // 1 decimal place
        carbs_g: Math.round(foodItem.nutrition.carbs * 10) / 10, // 1 decimal place
        fat_g: Math.round(foodItem.nutrition.fat * 10) / 10, // 1 decimal place
        fiber_g: Math.round((foodItem.nutrition.fiber || 0) * 10) / 10, // 1 decimal place
        sugar_g: Math.round((foodItem.nutrition.sugar || 0) * 10) / 10, // 1 decimal place
        sodium_mg: foodItem.nutrition.sodium || 0,
        source: source,
        confidence_score: foodItem.nutrition.confidence || 0,
        meal_type: mealType,
      }));

    const { data, error } = await supabase
      .from('daily_food_intake')
      .insert(foodEntries)
      .select();

    if (error) {
      console.error('Error adding multiple foods to daily intake:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully added multiple foods to daily intake:', data.length, 'items');
    return { success: true, data };
  } catch (error) {
    console.error('Error in addMultipleFoodsToDaily:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Gets daily nutrition summary for a user
 */
export async function getDailyNutritionSummary(
  userId: string,
  date?: string // YYYY-MM-DD format, defaults to today
): Promise<{ success: boolean; data?: DailyNutritionSummary; error?: string }> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .rpc('get_daily_calorie_intake', {
        p_user_id: userId,
        p_date: targetDate
      });

    if (error) {
      console.error('Error getting daily nutrition summary:', error);
      return { success: false, error: error.message };
    }

    // The RPC function returns an array with one object
    const summary = data && data.length > 0 ? data[0] : {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      food_count: 0
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error('Error in getDailyNutritionSummary:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Gets all food items for a specific day
 */
export async function getDailyFoodItems(
  userId: string,
  date?: string // YYYY-MM-DD format, defaults to today
): Promise<{ success: boolean; data?: DailyFoodIntakeEntry[]; error?: string }> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_food_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting daily food items:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getDailyFoodItems:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Deletes a food item from daily intake
 */
export async function deleteFoodFromDaily(
  userId: string,
  foodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('daily_food_intake')
      .delete()
      .eq('id', foodId)
      .eq('user_id', userId); // Ensure user can only delete their own items

    if (error) {
      console.error('Error deleting food from daily intake:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully deleted food from daily intake:', foodId);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteFoodFromDaily:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Updates a food item in daily intake
 */
export async function updateFoodInDaily(
  userId: string,
  foodId: string,
  updates: Partial<Pick<DailyFoodIntakeEntry, 'food_name' | 'quantity' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'meal_type'>>
): Promise<{ success: boolean; data?: DailyFoodIntakeEntry; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('daily_food_intake')
      .update(updates)
      .eq('id', foodId)
      .eq('user_id', userId) // Ensure user can only update their own items
      .select()
      .single();

    if (error) {
      console.error('Error updating food in daily intake:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully updated food in daily intake:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateFoodInDaily:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
