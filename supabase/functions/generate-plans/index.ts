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
}

interface GeminiResponse {
  workout: Array<{
    day: string
    routine: any[]
  }>
  diet: Array<{
    day: string
    meals: Array<{
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
    }>
  }>
}

interface RequestBody {
  userId: string
  regenerate?: boolean // If true, creates new plan even if one exists
}

/**
 * Creates the Gemini prompt with user data inserted
 */
function createGeminiPrompt(userData: UserProfile): string {
  const prompt = `You are an expert fitness and nutrition AI.

Generate a fully personalized 7-day workout and 7-day meal plan for the following user, using ONLY the provided calorie target and constraints. Do not recalculate BMR, TDEE, or calories. Output results in JSON format only.

**User Profile:**
- Age: ${userData.age}
- Gender: ${userData.gender}
- Height: ${userData.height_cm} cm
- Current weight: ${userData.weight_kg} kg
- Goal weight: ${userData.target_weight_kg || userData.weight_kg} kg ${userData.fitness_goal === 'maintain-weight' ? '(maintaining current weight)' : ''}
- Goal timeframe: ${userData.target_timeline_weeks} weeks
- Fitness level: ${userData.fitness_experience}
- Activity level: ${userData.activity_level}
- Dietary preference: ${userData.dietary_preferences}
- Meal frequency: ${userData.meal_frequency}
- Allergies/Food restrictions: ${userData.allergies?.join(', ') || 'None'}
- Medical conditions: ${userData.medical_conditions?.join(', ') || 'None'}
- Daily calorie target: ${userData.target_calories} kcal
- Physique inspiration: ${userData.physique_inspiration || ''}
- Preferred workout time: ${userData.preferred_workout_time}

**Instructions:**
- For the workout plan: Provide daily exercise routines, workout type (push/pull/legs/cardio), number of sets/reps or minutes, rest days, and match difficulty to fitness level.

**CRITICAL WORKOUT PROGRAMMING REQUIREMENTS:**
- **Exercise Variety**: If the same muscle group appears on multiple days (e.g., two push days), use DIFFERENT exercises for each day. For example:
  * Monday Push: Bench Press, Shoulder Press, Tricep Dips
  * Friday Push: Incline Press, Lateral Raises, Overhead Extensions
- **Rep/Set Variation**: Implement different rep schemes across similar workout types:
  * Heavy Day (lower reps, higher intensity): 4-6 reps, 4-5 sets
  * Volume Day (higher reps, moderate intensity): 8-12 reps, 3-4 sets
  * Hypertrophy Day (moderate reps): 6-10 reps, 3-4 sets
- **Progressive Overload**: Structure the week so that similar muscle groups get different training stimuli
- **Split Examples**:
  * Push-Pull-Legs-Push-Pull: Days 1&4 should have different push exercises, Days 2&5 should have different pull exercises
  * Upper-Lower-Upper-Lower: Each upper day should focus on different movements/angles

- For the meal plan: Provide daily meal breakdowns (breakfast, lunch, dinner, snacks), and ensure each day's total calories ≈ ${userData.target_calories}. List key macros (protein, carbs, fat) per meal if possible.
- For EACH meal, include detailed information: ingredients list with exact measurements, step-by-step preparation instructions, cooking time, and serving size.
- Avoid all user allergies and restrictions.
- Use user's diet and cuisine if possible (e.g. Indian, Asian, etc. if relevant).
- Format output as JSON only, with two top-level keys: \`workout\` and \`diet\`.

**CRITICAL JSON FORMATTING RULES:**
- ALL string values MUST be enclosed in double quotes
- Numbers should NOT be quoted (e.g., "sets": 3, not "sets": "3")
- For reps, use numbers when possible (e.g., "reps": 10)
- For variable reps like "as many as possible", use quoted strings (e.g., "reps": "as many as possible")
- For time values, use numbers only (e.g., "reps/minutes": 30, not "reps/minutes": "30 seconds")
- Ensure ALL JSON is properly closed with matching braces and brackets
- Do NOT include any text outside the JSON structure

**Example Output:**
{
"workout": [
{ 
  "day": "Monday", 
  "type": "push",
  "routine": [
    { "exercise": "Bench Press", "sets": 4, "reps": 6, "rest": "2-3 min" },
    { "exercise": "Overhead Press", "sets": 3, "reps": 8, "rest": "2 min" },
    { "exercise": "Dips", "sets": 3, "reps": 10, "rest": "90 sec" }
  ]
},
{ 
  "day": "Tuesday", 
  "type": "pull",
  "routine": [
    { "exercise": "Pull-ups", "sets": 4, "reps": 8, "rest": "2-3 min" },
    { "exercise": "Barbell Rows", "sets": 3, "reps": 10, "rest": "2 min" },
    { "exercise": "Face Pulls", "sets": 3, "reps": 15, "rest": "90 sec" }
  ]
},
{ 
  "day": "Wednesday", 
  "type": "legs",
  "routine": [
    { "exercise": "Squats", "sets": 4, "reps": 8, "rest": "2-3 min" },
    { "exercise": "Romanian Deadlifts", "sets": 3, "reps": 10, "rest": "2 min" },
    { "exercise": "Walking Lunges", "sets": 3, "reps": 12, "rest": "90 sec" }
  ]
},
{ 
  "day": "Thursday", 
  "type": "cardio",
  "routine": [
    { "exercise": "Running", "reps/minutes": 30, "intensity": "moderate" }
  ]
},
{ 
  "day": "Friday", 
  "type": "push",
  "routine": [
    { "exercise": "Incline Dumbbell Press", "sets": 4, "reps": 10, "rest": "2 min" },
    { "exercise": "Lateral Raises", "sets": 3, "reps": 12, "rest": "90 sec" }
  ]
},
{ 
  "day": "Saturday", 
  "type": "pull",
  "routine": [
    { "exercise": "Chin-ups", "sets": 4, "reps": 8, "rest": "2-3 min" },
    { "exercise": "Cable Rows", "sets": 3, "reps": 12, "rest": "2 min" }
  ]
},
{ 
  "day": "Sunday", 
  "type": "rest",
  "routine": []
}
],
"diet": [
{ 
  "day": "Monday", 
  "meals": [ 
    { 
      "meal": "Breakfast", 
      "description": "Tofu Scramble with Vegetables", 
      "kcal": 450, 
      "protein_g": 20, 
      "carbs_g": 50, 
      "fat_g": 15,
      "ingredients": [
        "200g firm tofu",
        "1/2 cup mixed vegetables (bell peppers, onions, spinach)",
        "2 whole wheat bread slices",
        "1 tbsp olive oil",
        "1/2 tsp turmeric",
        "Salt and pepper to taste"
      ],
      "instructions": [
        "Press tofu to remove excess water",
        "Heat olive oil in a pan over medium heat",
        "Crumble tofu into the pan",
        "Add turmeric, salt, and pepper",
        "Add vegetables and cook for 5-7 minutes",
        "Serve with whole wheat toast"
      ],
      "cooking_time": "15 minutes",
      "serving_size": "1 serving"
    }, 
    ... 
  ] 
},
...
]
}

Do NOT add explanations or text outside the JSON.`

  return prompt
}

/**
 * Calls Gemini API with the prompt
 */
async function callGeminiAPI(prompt: string): Promise<GeminiResponse> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  console.log('🤖 Calling Gemini API with model: gemini-1.5-flash');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
          maxOutputTokens: 16384,
        }
      })
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('❌ Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  console.log('✅ Gemini API call successful');

  const data = await response.json()

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API')
  }

  const generatedText = data.candidates[0].content.parts[0].text
  console.log('📝 Raw Gemini response:', generatedText);

  // Extract JSON from the response (remove any markdown formatting)
  let jsonText = generatedText;
  
  // Remove markdown code blocks if present
  if (jsonText.includes('```json')) {
    jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
  }
  
  // Find the JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in Gemini response');
  }
  
  jsonText = jsonMatch[0];
  
  // Check if JSON appears to be truncated (missing closing braces)
  const openBraces = (jsonText.match(/\{/g) || []).length;
  const closeBraces = (jsonText.match(/\}/g) || []).length;
  const openBrackets = (jsonText.match(/\[/g) || []).length;
  const closeBrackets = (jsonText.match(/\]/g) || []).length;
  
  if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
    console.error('❌ JSON appears to be truncated or malformed:');
    console.error(`- Open braces: ${openBraces}, Close braces: ${closeBraces}`);
    console.error(`- Open brackets: ${openBrackets}, Close brackets: ${closeBrackets}`);
    console.error(`- JSON length: ${jsonText.length} characters`);
    throw new Error('JSON response appears to be truncated or malformed');
  }
  
  // Fix common JSON issues
  jsonText = jsonText
    // Fix unquoted AMRAP and similar values
    .replace(/\"reps\":\s*as many as possible\s*\(AMRAP\)/g, '"reps": "as many as possible (AMRAP)"')
    .replace(/\"reps\":\s*as many as possible/g, '"reps": "as many as possible"')
    .replace(/\"reps\":\s*as many as you can/g, '"reps": "as many as you can"')
    .replace(/\"reps\":\s*to failure/g, '"reps": "to failure"')
    .replace(/\"reps\":\s*max/g, '"reps": "max"')
    .replace(/\"reps\":\s*AMRAP/g, '"reps": "AMRAP"')
    .replace(/\"reps\":\s*(\d+)\s*-\s*(\d+)/g, '"reps": "$1-$2"')
    .replace(/\"reps\":\s*(\d+)\s*or\s*(\d+)/g, '"reps": "$1 or $2"')
    // Fix mixed data types in reps/minutes
    .replace(/\"reps\/minutes\":\s*(\d+)\s*seconds/g, '"reps/minutes": $1')
    .replace(/\"reps\/minutes\":\s*(\d+)\s*minutes/g, '"reps/minutes": $1')
    // Fix common issues with rest field
    .replace(/\"rest\":\s*(\d+)\s*-\s*(\d+)\s*min/g, '"rest": "$1-$2 min"')
    .replace(/\"rest\":\s*(\d+)\s*sec/g, '"rest": "$1 sec"')
    .replace(/\"rest\":\s*(\d+)\s*min/g, '"rest": "$1 min"')
    // Fix intensity field
    .replace(/\"intensity\":\s*moderate/g, '"intensity": "moderate"')
    .replace(/\"intensity\":\s*high/g, '"intensity": "high"')
    .replace(/\"intensity\":\s*low/g, '"intensity": "low"')
    // Fix exercise field with special characters
    .replace(/\"exercise\":\s*([^",}\]]+?)\s*\([^)]+\)/g, (match, exercise) => {
      return `"exercise": "${exercise.trim()} (${match.match(/\([^)]+\)/)?.[0] || ''})"`;
    })
    // Fix any other unquoted string values that should be quoted
    .replace(/\"reps\/minutes\":\s*([^",}\]]+)(?=\s*[,}\]])/g, (match, value) => {
      const trimmedValue = value.trim();
      // If it's already a number, keep it as is
      if (!isNaN(Number(trimmedValue))) {
        return `"reps/minutes": ${trimmedValue}`;
      }
      // Otherwise quote it
      return `"reps/minutes": "${trimmedValue}"`;
    })
    // More aggressive fix for unquoted values
    .replace(/:([^",}\]]+?)(?=\s*[,}\]])/g, (match, value) => {
      const trimmedValue = value.trim();
      // Skip if it's already quoted, a number, boolean, or null
      if (trimmedValue.startsWith('"') || trimmedValue.startsWith("'") || 
          !isNaN(Number(trimmedValue)) || 
          trimmedValue === 'true' || trimmedValue === 'false' || 
          trimmedValue === 'null' || trimmedValue === 'undefined') {
        return match;
      }
      // Quote the value
      return `: "${trimmedValue}"`;
    })
    // Fix trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties
    .replace(/\"(\w+)\"\s*:\s*"[^"]*"\s*\"(\w+)\"/g, '"$1": "$2", "$3"')
    // Fix any remaining syntax issues
    .replace(/\s+/g, ' ')
    .trim();
 
  console.log('🔧 Cleaned JSON text:', jsonText);

  try {
    let parsedResponse: GeminiResponse;
    
    try {
      // First attempt: standard JSON parsing
      parsedResponse = JSON.parse(jsonText);
    } catch (firstError) {
      console.log('⚠️ First JSON parse failed, trying with additional cleanup...');
      
      // Second attempt: more aggressive cleanup
      let cleanedJson = jsonText
        // Fix common issues that might cause parsing errors
        .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
        .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
        .replace(/{\s*,/g, '{')  // Remove leading commas after opening braces
        .replace(/\[\s*,/g, '[') // Remove leading commas after opening brackets
        // Fix unquoted property names
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Fix single quotes to double quotes
        .replace(/'/g, '"')
        // Remove any comments or extra text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      
      console.log('🔧 Attempting second parse with cleaned JSON...');
      parsedResponse = JSON.parse(cleanedJson);
    }

    console.log('🔍 Parsed response structure:');
    console.log('- workout type:', typeof parsedResponse.workout);
    console.log('- workout is array:', Array.isArray(parsedResponse.workout));
    console.log('- workout length:', parsedResponse.workout?.length);
    console.log('- diet type:', typeof parsedResponse.diet);
    console.log('- diet is array:', Array.isArray(parsedResponse.diet));
    console.log('- diet length:', parsedResponse.diet?.length);

    // Validate the response structure
    if (!parsedResponse.workout || !parsedResponse.diet) {
      throw new Error('Invalid plan structure: missing workout or diet sections')
    }

    if (!Array.isArray(parsedResponse.workout) || !Array.isArray(parsedResponse.diet)) {
      throw new Error('Invalid plan structure: workout and diet must be arrays')
    }

    if (parsedResponse.workout.length !== 7 || parsedResponse.diet.length !== 7) {
      console.error('❌ Validation failed:');
      console.error('- Workout days count:', parsedResponse.workout.length);
      console.error('- Diet days count:', parsedResponse.diet.length);
      console.error('- Workout days:', parsedResponse.workout.map(w => w.day));
      console.error('- Diet days:', parsedResponse.diet.map(d => d.day));
      throw new Error(`Invalid plan structure: must contain exactly 7 days for workout and diet (found ${parsedResponse.workout.length} workout days and ${parsedResponse.diet.length} diet days)`)
    }

    console.log('✅ Successfully parsed Gemini response');
    return parsedResponse

  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response:', parseError);
    console.error('📝 Raw response was:', generatedText);
    console.error('🔧 Cleaned JSON was:', jsonText);
    
    // Try to identify the problematic area around the error position
    if (parseError instanceof SyntaxError) {
      const errorMatch = parseError.message.match(/position (\d+)/);
      if (errorMatch) {
        const errorPos = parseInt(errorMatch[1]);
        const start = Math.max(0, errorPos - 100);
        const end = Math.min(jsonText.length, errorPos + 100);
        console.error('🔍 Error context around position', errorPos, ':', jsonText.substring(start, end));
      }
    }
    
      throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
  }
}

/**
 * Validates user data completeness
 */
function validateUserData(userData: any): UserProfile {
  const requiredFields = [
    'id', 'age', 'gender', 'height_cm', 'weight_kg',
    'target_timeline_weeks', 'fitness_experience', 'activity_level',
    'dietary_preferences', 'meal_frequency', 'target_calories', 'fitness_goal'
  ]

  // For maintain weight goals, target_weight_kg can be null
  const isMaintainWeight = userData.fitness_goal === 'maintain-weight';
  if (!isMaintainWeight) {
    requiredFields.push('target_weight_kg');
  }

  for (const field of requiredFields) {
    if (!userData[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // For maintain weight goals, use current weight as target weight
  const targetWeight = isMaintainWeight ? userData.weight_kg : userData.target_weight_kg;

  return {
    id: userData.id,
    age: Number(userData.age),
    gender: userData.gender,
    height_cm: Number(userData.height_cm),
    weight_kg: Number(userData.weight_kg),
    target_weight_kg: targetWeight ? Number(targetWeight) : null,
    target_timeline_weeks: Number(userData.target_timeline_weeks),
    fitness_experience: userData.fitness_experience,
    activity_level: userData.activity_level,
    dietary_preferences: userData.dietary_preferences,
    meal_frequency: userData.meal_frequency,
    allergies: Array.isArray(userData.allergies) ? userData.allergies : [],
    medical_conditions: Array.isArray(userData.medical_conditions) ? userData.medical_conditions : [],
    physique_inspiration: userData.physique_inspiration || '',
    preferred_workout_time: userData.preferred_workout_time || '',
    target_calories: Number(userData.target_calories),
    fitness_goal: userData.fitness_goal
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
    const { userId, regenerate = false }: RequestBody = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user already has an active plan and regeneration is not requested
    if (!regenerate) {
      const { data: existingPlan } = await supabase
        .from('user_plans')
        .select('id, generation_status')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (existingPlan) {
        if (existingPlan.generation_status === 'completed') {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Plan already exists',
              planId: existingPlan.id
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        } else if (existingPlan.generation_status === 'generating') {
          return new Response(
            JSON.stringify({
              error: 'Plan generation already in progress',
              planId: existingPlan.id
            }),
            {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }

    // Fetch user profile data
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        id, age, gender, height_cm, weight_kg, target_weight_kg, target_timeline_weeks,
        fitness_goal, fitness_experience, activity_level, dietary_preferences, meal_frequency,
        allergies, medical_conditions, physique_inspiration, preferred_workout_time,
        target_calories, onboarding_complete
      `)
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new Error(`Failed to fetch user profile: ${userError?.message || 'User not found'}`)
    }

    // Validate user data
    const validatedUserData = validateUserData(userData)

    // Check if onboarding is complete (allow plan generation even if onboarding is not complete)
    console.log('🔍 Checking onboarding_complete:', userData.onboarding_complete);
    if (!userData.onboarding_complete) {
      console.log('⚠️ User onboarding is not complete, but allowing plan generation for better UX');
    } else {
      console.log('✅ User onboarding is complete, proceeding with plan generation');
    }

    // Deactivate existing plans if regenerating
    if (regenerate) {
      await supabase
        .from('user_plans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)
    }

    // Create new plan entry with generating status
    const { data: newPlan, error: insertError } = await supabase
      .from('user_plans')
      .insert({
        user_id: userId,
        generation_status: 'generating',
        user_snapshot: validatedUserData,
        plan_version: regenerate ? await getNextPlanVersion(supabase, userId) : 1
      })
      .select()
      .single()

    if (insertError || !newPlan) {
      throw new Error(`Failed to create plan entry: ${insertError?.message}`)
    }

    try {
      // Create Gemini prompt
      const prompt = createGeminiPrompt(validatedUserData)

      // Call Gemini API
      const geminiResponse = await callGeminiAPI(prompt)

      // Update plan with generated content
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({
          workout_plan: geminiResponse.workout,
          diet_plan: geminiResponse.diet,
          generation_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', newPlan.id)

      if (updateError) {
        throw new Error(`Failed to update plan: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Plan generated successfully',
          planId: newPlan.id,
          workout: geminiResponse.workout,
          diet: geminiResponse.diet
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )

    } catch (generationError) {
      // Update plan with error status
      await supabase
        .from('user_plans')
        .update({
          generation_status: 'failed',
          error_message: generationError instanceof Error ? generationError.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', newPlan.id)

      throw generationError
    }

  } catch (error) {
    console.error('Error in generate-plans function:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
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

/**
 * Gets the next plan version number for a user
 */
async function getNextPlanVersion(supabase: any, userId: string): Promise<number> {
  const { data: latestPlan } = await supabase
    .from('user_plans')
    .select('plan_version')
    .eq('user_id', userId)
    .order('plan_version', { ascending: false })
    .limit(1)
    .single()

  return latestPlan ? latestPlan.plan_version + 1 : 1
}
