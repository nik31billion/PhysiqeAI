import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ApplySwapRequest {
  userId: string
  swapType: 'meal' | 'workout'
  day: string
  mealType?: string // for meal swaps
  newContent: any
}

interface ApplySwapResponse {
  success: boolean
  message: string
  error?: string
}

/**
 * Parses Gemini response to extract structured meal data
 */
function parseMealResponse(response: string): any {
  try {
    // If response is already an object, return it
    if (typeof response === 'object' && response !== null) {
      return response
    }

    // If response is a string, try to parse it
    if (typeof response === 'string') {
      // Try to extract meal information from the text response
      const lines = response.split('\n').filter(line => line.trim())
      
      let meal = {
        description: '',
        kcal: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        ingredients: []
      }

      // Try structured format first (Meal:, Description:, etc.)
      const mealMatch = response.match(/meal[:\s]*(.+?)(?:\n|$)/i)
      const descriptionMatch = response.match(/description[:\s]*(.+?)(?:\n|$)/i)
      const caloriesMatch = response.match(/calories?[:\s]*(\d+)\s*kcal/i)
      const proteinMatch = response.match(/protein[:\s]*(\d+(?:\.\d+)?)\s*g/i)
      const carbsMatch = response.match(/carbs?[:\s]*(\d+(?:\.\d+)?)\s*g/i)
      const fatMatch = response.match(/fat[:\s]*(\d+(?:\.\d+)?)\s*g/i)
      const ingredientsMatch = response.match(/ingredients?[:\s]*(.+?)(?:\n|$)/i)

      if (descriptionMatch) {
        meal.description = descriptionMatch[1].trim()
      } else if (mealMatch) {
        meal.description = mealMatch[1].trim()
      } else {
        // Fallback: use first line as description
        meal.description = lines[0] || response
      }

      if (caloriesMatch) {
        meal.kcal = parseInt(caloriesMatch[1])
      } else {
        // Fallback: try to find calories anywhere in the text
        const kcalMatch = response.match(/(\d+)\s*kcal/i)
        if (kcalMatch) {
          meal.kcal = parseInt(kcalMatch[1])
        }
      }

      if (proteinMatch) {
        meal.protein_g = parseFloat(proteinMatch[1])
      }

      if (carbsMatch) {
        meal.carbs_g = parseFloat(carbsMatch[1])
      }

      if (fatMatch) {
        meal.fat_g = parseFloat(fatMatch[1])
      }

      if (ingredientsMatch) {
        meal.ingredients = ingredientsMatch[1].split(',').map((ing: string) => ing.trim())
      }

      return meal
    }

    // Fallback: return basic structure
    return {
      description: response || 'New meal suggestion',
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      ingredients: []
    }
  } catch (error) {
    
    // Return safe fallback
    return {
      description: response || 'New meal suggestion',
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      ingredients: []
    }
  }
}

/**
 * Applies a plan swap to the user's active plan
 */
async function applyPlanSwap(
  supabase: any,
  userId: string,
  swapType: 'meal' | 'workout',
  day: string,
  mealType: string | undefined,
  newContent: any
): Promise<void> {
  try {
    // Get current active plan
    const { data: currentPlan, error: planError } = await supabase
      .from('user_plans')
      .select('workout_plan, diet_plan')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (planError || !currentPlan) {
      throw new Error('No active plan found for user')
    }

    let updatedPlan = { ...currentPlan }
    let updated = false

    if (swapType === 'meal' && mealType) {
      // Parse the new content to ensure it's structured properly
      const parsedMeal = parseMealResponse(newContent)
      
      
      // Update meal in diet plan
      
      const dayIndex = updatedPlan.diet_plan.findIndex((dayPlan: any) => 
        dayPlan.day.toLowerCase() === day.toLowerCase()
      )
      
      
      
      if (dayIndex !== -1) {
        
        const mealIndex = updatedPlan.diet_plan[dayIndex].meals.findIndex((meal: any) => 
          meal.meal.toLowerCase().includes(mealType.toLowerCase())
        )
        
        
        
        if (mealIndex !== -1) {
          
          // Store original meal data
          const originalMeal = updatedPlan.diet_plan[dayIndex].meals[mealIndex]
          
          // Update only the necessary fields, preserving the meal structure
          updatedPlan.diet_plan[dayIndex].meals[mealIndex] = {
            ...originalMeal, // Keep original structure
            description: parsedMeal.description || originalMeal.description,
            kcal: parsedMeal.kcal || originalMeal.kcal || 0,
            protein_g: parsedMeal.protein_g || originalMeal.protein_g || 0,
            carbs_g: parsedMeal.carbs_g || originalMeal.carbs_g || 0,
            fat_g: parsedMeal.fat_g || originalMeal.fat_g || 0,
            ingredients: parsedMeal.ingredients && parsedMeal.ingredients.length > 0 
              ? parsedMeal.ingredients 
              : originalMeal.ingredients || [],
            swapped_at: new Date().toISOString(),
            original_meal: originalMeal.description
          }
          updated = true
        } else {
          console.log('Meal not found. Available meals:', updatedPlan.diet_plan[dayIndex]?.meals?.map((m: any) => m.meal))
        }
      } else {
        console.log('Day not found. Available days:', updatedPlan.diet_plan?.map((d: any) => d.day))
      }
    } else if (swapType === 'workout') {
      // Update workout in workout plan
      const dayIndex = updatedPlan.workout_plan.findIndex((dayPlan: any) => 
        dayPlan.day.toLowerCase() === day.toLowerCase()
      )
      
      if (dayIndex !== -1) {
        updatedPlan.workout_plan[dayIndex] = {
          ...updatedPlan.workout_plan[dayIndex],
          routine: newContent,
          swapped_at: new Date().toISOString(),
          original_routine: updatedPlan.workout_plan[dayIndex].routine
        }
        updated = true
      }
    }

    if (!updated) {
      throw new Error(`Could not find ${swapType} to update for ${day}`)
    }

    // Update the plan in database
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({
        diet_plan: updatedPlan.diet_plan,
        workout_plan: updatedPlan.workout_plan,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (updateError) {
      throw new Error(`Failed to update plan: ${updateError.message}`)
    }

    
  } catch (error) {
    
    throw error
  }
}

/**
 * Logs the plan swap action
 */
async function logPlanSwap(
  supabase: any,
  userId: string,
  swapType: 'meal' | 'workout',
  day: string,
  mealType: string | undefined,
  newContent: any
): Promise<void> {
  try {
    await supabase
      .from('coach_glow_chats')
      .insert({
        user_id: userId,
        user_message: `Applied ${swapType} swap for ${day}`,
        coach_response: `Successfully updated ${swapType}`,
        intent: 'plan_swap',
        context: {
          action: 'applied_swap',
          swap_type: swapType,
          day: day,
          meal_type: mealType,
          new_content: newContent
        },
        created_at: new Date().toISOString()
      })
  } catch (error) {
    
    // Don't throw error as this is not critical
  }
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { userId, swapType, day, mealType, newContent }: ApplySwapRequest = await req.json()

    if (!userId || !swapType || !day || !newContent) {
      return new Response(
        JSON.stringify({ error: 'userId, swapType, day, and newContent are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (swapType !== 'meal' && swapType !== 'workout') {
      return new Response(
        JSON.stringify({ error: 'swapType must be either "meal" or "workout"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (swapType === 'meal' && !mealType) {
      return new Response(
        JSON.stringify({ error: 'mealType is required for meal swaps' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    
    

    // Apply the plan swap
    await applyPlanSwap(supabase, userId, swapType, day, mealType, newContent)

    // Log the action
    await logPlanSwap(supabase, userId, swapType, day, mealType, newContent)

    const response: ApplySwapResponse = {
      success: true,
      message: `Successfully updated ${swapType} for ${day}`
    }

    

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    

    return new Response(
      JSON.stringify({
        success: false,
        error: 'I had trouble updating your plan. Please try again.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
