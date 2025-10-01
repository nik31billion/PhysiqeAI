import { supabase } from './supabase';

export interface SavedRecipe {
  id: string;
  user_id: string;
  meal_name: string;
  description?: string;
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  instructions?: string[];
  cooking_time?: string;
  serving_size?: string;
  source_plan_id?: string;
  source_day?: string;
  source_meal_type?: string;
  is_favorite: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MealData {
  meal: string;
  description: string;
  kcal: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
  instructions?: string[];
  cooking_time?: string;
  serving_size?: string;
}

/**
 * Save a recipe to user's favorites
 */
export const saveRecipe = async (
  userId: string,
  mealData: MealData,
  sourcePlanId?: string,
  sourceDay?: string,
  sourceMealType?: string,
  notes?: string
): Promise<{ success: boolean; data?: SavedRecipe; error?: string }> => {
  try {
    

    // First check if recipe already exists
    const { data: existingRecipe, error: checkError } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_name', mealData.meal)
      .eq('is_favorite', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      
      return { success: false, error: checkError.message };
    }

    if (existingRecipe) {
      
      return { success: false, error: 'Recipe already saved' };
    }

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: userId,
        meal_name: mealData.meal,
        description: mealData.description,
        kcal: mealData.kcal,
        protein_g: mealData.protein_g,
        carbs_g: mealData.carbs_g,
        fat_g: mealData.fat_g,
        ingredients: mealData.ingredients || [],
        instructions: mealData.instructions || [],
        cooking_time: mealData.cooking_time,
        serving_size: mealData.serving_size,
        source_plan_id: sourcePlanId,
        source_day: sourceDay,
        source_meal_type: sourceMealType,
        is_favorite: true,
        notes: notes
      })
      .select()
      .single();

    if (error) {
      
      return { success: false, error: error.message };
    }

    
    return { success: true, data };
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Get all saved recipes for a user
 */
export const getSavedRecipes = async (
  userId: string
): Promise<{ success: boolean; data?: SavedRecipe[]; error?: string }> => {
  try {
    

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) {
      
      return { success: false, error: error.message };
    }

    
    return { success: true, data: data || [] };
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Check if a recipe is already saved
 */
export const isRecipeSaved = async (
  userId: string,
  mealName: string
): Promise<{ success: boolean; isSaved?: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_name', mealName)
      .eq('is_favorite', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      
      return { success: false, error: error.message };
    }

    return { success: true, isSaved: !!data };
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Remove a recipe from saved recipes
 */
export const removeSavedRecipe = async (
  userId: string,
  recipeId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    

    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('id', recipeId);

    if (error) {
      
      return { success: false, error: error.message };
    }

    
    return { success: true };
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Update recipe notes
 */
export const updateRecipeNotes = async (
  userId: string,
  recipeId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('saved_recipes')
      .update({ notes })
      .eq('user_id', userId)
      .eq('id', recipeId);

    if (error) {
      
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
