import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UserProfile {
  id: string
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  target_weight_kg: number | null
  target_timeline_weeks: number
  fitness_experience: string
  activity_level: string
  dietary_preferences: string
  meal_frequency: string
  allergies: string[]
  medical_conditions: string[]
  physique_inspiration: string
  preferred_workout_time: string
  target_calories: number
  fitness_goal: string
  bmr?: number
  tdee?: number
}

interface MealData {
  meal: string
  description: string
  kcal: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  ingredients?: string[]
  instructions?: string[]
  cooking_time?: string
  serving_size?: string
}

interface RequestBody {
  userId: string
  currentMeal: MealData
  dayName: string
  mealType: string // e.g., "Breakfast", "Lunch", "Dinner"
  targetCalories?: number
}

/**
 * Creates the Gemini prompt for meal swapping
 */
function createMealSwapPrompt(userData: UserProfile, currentMeal: MealData, dayName: string, mealType: string): string {
  const prompt = `You are an expert nutrition AI with 20+ years of experience in meal planning and dietary optimization.

Generate a SINGLE alternative meal to replace the current meal. The new meal should:
1. Match the same calorie target (${currentMeal.kcal} kcal)
2. Fit the user's dietary preferences and restrictions
3. Be nutritionally balanced
4. Be different from the current meal
5. Be practical and easy to prepare

**Current Meal to Replace:**
- Name: ${currentMeal.meal}
- Description: ${currentMeal.description}
- Calories: ${currentMeal.kcal} kcal
- Day: ${dayName} - ${mealType}

**User Profile:**
- Age: ${userData.age}
- Gender: ${userData.gender}
- Height: ${userData.height_cm} cm
- Weight: ${userData.weight_kg} kg
- Target Weight: ${userData.target_weight_kg || 'Not specified'} kg
- Fitness Goal: ${userData.fitness_goal}
- Dietary Preferences: ${userData.dietary_preferences}
- Allergies: ${userData.allergies?.join(', ') || 'None'}
- Medical Conditions: ${userData.medical_conditions?.join(', ') || 'None'}
- Target Calories: ${userData.target_calories} kcal/day
- Meal Frequency: ${userData.meal_frequency}

**Requirements:**
- Generate a COMPLETELY DIFFERENT meal from the current one
- Maintain the same calorie count (${currentMeal.kcal} kcal)
- Ensure nutritional balance (protein, carbs, fats)
- **CRITICAL HEALTH REQUIREMENTS:**
  * ONLY use healthy, nutritious whole foods (lean proteins, vegetables, fruits, whole grains, healthy fats)
  * NEVER include junk food, processed foods, or unhealthy snacks (no donuts, chips, candy, fast food, etc.)
  * Prioritize nutrient-dense foods that support fitness goals
  * Focus on clean eating principles unless user explicitly requests otherwise
  * Use fresh, minimally processed ingredients
- Include detailed ingredients list
- Provide step-by-step cooking instructions
- Consider user's dietary restrictions and preferences
- Make it practical and achievable

**Output Format (JSON only):**
{
  "meal": "New Meal Name",
  "description": "Brief description of the meal",
  "kcal": ${currentMeal.kcal},
  "protein_g": 25.5,
  "carbs_g": 45.2,
  "fat_g": 12.8,
  "ingredients": [
    "Ingredient 1 with quantity",
    "Ingredient 2 with quantity",
    "Ingredient 3 with quantity"
  ],
  "instructions": [
    "Step 1: Detailed cooking instruction",
    "Step 2: Next step in preparation",
    "Step 3: Final preparation step"
  ],
  "cooking_time": "15-20 minutes",
  "serving_size": "1 serving"
}

Generate the alternative meal now:`;

  return prompt;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { userId, currentMeal, dayName, mealType, targetCalories }: RequestBody = await req.json()

    if (!userId || !currentMeal || !dayName || !mealType) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: userId, currentMeal, dayName, mealType' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`🔄 Meal swap request for user ${userId}: ${currentMeal.meal} on ${dayName}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Error fetching user profile:', profileError)
      return new Response(JSON.stringify({ 
        error: 'User profile not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Prepare user data for prompt
    const userData: UserProfile = {
      id: profile.id,
      age: profile.age || 25,
      gender: profile.gender || 'male',
      height_cm: profile.height_cm || 170,
      weight_kg: profile.weight_kg || 70,
      target_weight_kg: profile.target_weight_kg,
      target_timeline_weeks: profile.target_timeline_weeks || 12,
      fitness_experience: profile.fitness_experience || 'beginner',
      activity_level: profile.activity_level || 'moderately-active',
      dietary_preferences: profile.dietary_preferences || 'none',
      meal_frequency: profile.meal_frequency || '3-meals',
      allergies: profile.allergies || [],
      medical_conditions: profile.medical_conditions || [],
      physique_inspiration: profile.physique_inspiration || '',
      preferred_workout_time: profile.preferred_workout_time || 'evening',
      target_calories: targetCalories || profile.target_calories || 2000,
      fitness_goal: profile.fitness_goal || 'maintain-weight',
      bmr: profile.bmr,
      tdee: profile.tdee
    }

    // Create the prompt
    const prompt = createMealSwapPrompt(userData, currentMeal, dayName, mealType)

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('❌ Gemini API key not found')
      return new Response(JSON.stringify({ 
        error: 'AI service configuration error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Use FASTEST proven models - prioritize speed over newest version
    // Based on testing: gemini-2.0-flash responded instantly
    const modelVersions = [
      'gemini-2.0-flash',        // ✅ FASTEST - Instant response
      'gemini-flash-latest',     // ✅ FAST - Good response time
      'gemini-2.5-flash',        // ✅ Works but slower - fallback only
    ];

    let geminiResponse: Response | null = null;
    let lastError: Error | null = null;

    for (const model of modelVersions) {
      try {
        console.log(`Meal Swap: Attempting to call ${model}...`);
        
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096, // Increased for detailed meal descriptions
              }
            })
          }
        )

        if (geminiResponse.ok) {
          console.log(`Meal Swap: Successfully connected to ${model}`);
          break; // Success, exit the loop
        } else {
          const errorData = await geminiResponse.json()
          const errorMessage = `${model} API error: ${geminiResponse.status} - ${errorData.error?.message || 'Unknown error'}`
          console.log(`Meal Swap: ${errorMessage}`)
          lastError = new Error(errorMessage)
          geminiResponse = null; // Reset for next iteration
          continue; // Try next model
        }
        
      } catch (error) {
        console.log(`Meal Swap: Error with ${model}:`, error.message)
        lastError = error instanceof Error ? error : new Error(String(error))
        geminiResponse = null;
        continue; // Try next model
      }
    }

    // If all models failed
    if (!geminiResponse || !geminiResponse.ok) {
      console.error('❌ All Gemini models failed:', lastError?.message || 'Unknown error')
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await geminiResponse.json()
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    
    console.log(`Meal Swap: Response length: ${responseText?.length || 0} characters`)

    if (!responseText) {
      console.error('❌ No response from Gemini API')
      return new Response(JSON.stringify({ 
        error: 'AI service returned empty response' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse the JSON response with improved error handling
    let newMeal: MealData
    try {
      // Extract JSON from the response (in case there's extra text)
      let jsonString = responseText.trim()
      
      // Remove markdown code blocks if present
      if (jsonString.includes('```json')) {
        jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Find JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      jsonString = jsonMatch[0]
      console.log('🔍 Raw JSON string:', jsonString.substring(0, 200) + '...')
      
      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
        .replace(/,(\s*$)/g, '') // Remove trailing commas at end of string
        .replace(/'/g, '"') // Replace single quotes with double quotes
        // Fix unquoted property names
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      
      newMeal = JSON.parse(jsonString)
      
      // Validate required fields
      if (!newMeal.meal || !newMeal.description || !newMeal.kcal) {
        throw new Error('Missing required meal fields')
      }
      
      console.log('✅ Successfully parsed meal:', newMeal.meal)
    } catch (parseError) {
      console.error('❌ Error parsing Gemini response:', parseError)
      console.error('Raw response:', responseText)
      
      // Try to extract basic meal info even if JSON parsing fails
      try {
        const mealMatch = responseText.match(/"meal":\s*"([^"]+)"/)
        const descMatch = responseText.match(/"description":\s*"([^"]+)"/)
        const kcalMatch = responseText.match(/"kcal":\s*(\d+)/)
        
        if (mealMatch && descMatch && kcalMatch) {
          console.log('🔄 Attempting fallback parsing...')
          newMeal = {
            meal: mealMatch[1],
            description: descMatch[1],
            kcal: parseInt(kcalMatch[1]),
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            ingredients: ['Ingredients not available'],
            instructions: ['Instructions not available'],
            cooking_time: 'Not specified',
            serving_size: '1 serving'
          }
          console.log('✅ Fallback parsing successful:', newMeal.meal)
        } else {
          throw new Error('Fallback parsing also failed')
        }
      } catch (fallbackError) {
        console.error('❌ Fallback parsing failed:', fallbackError)
        return new Response(JSON.stringify({ 
          error: 'Failed to parse AI response' 
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    console.log(`✅ Generated new meal: ${newMeal.meal} (${newMeal.kcal} kcal)`)

    return new Response(JSON.stringify({
      success: true,
      newMeal,
      message: `Successfully generated alternative meal: ${newMeal.meal}`
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('❌ Meal swap error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
