// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Circuit breaker pattern to prevent cascading failures
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const circuitBreakers: Map<string, CircuitBreakerState> = new Map();

function getCircuitBreakerState(model: string): CircuitBreakerState {
  if (!circuitBreakers.has(model)) {
    circuitBreakers.set(model, {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false
    });
  }
  return circuitBreakers.get(model)!;
}

function shouldSkipModel(model: string): boolean {
  const state = getCircuitBreakerState(model);
  const now = Date.now();
  const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
  
  // If circuit is open and cooldown period hasn't passed, skip this model
  if (state.isOpen && (now - state.lastFailureTime) < cooldownPeriod) {
    console.log(`Circuit breaker is open for ${model}, skipping...`);
    return true;
  }
  
  // Reset circuit breaker if cooldown period has passed
  if (state.isOpen && (now - state.lastFailureTime) >= cooldownPeriod) {
    console.log(`Circuit breaker cooldown period passed for ${model}, resetting...`);
    state.isOpen = false;
    state.failures = 0;
  }
  
  return false;
}

function recordFailure(model: string): void {
  const state = getCircuitBreakerState(model);
  state.failures++;
  state.lastFailureTime = Date.now();
  
  // Open circuit breaker after 3 consecutive failures
  if (state.failures >= 3) {
    state.isOpen = true;
    console.log(`Circuit breaker opened for ${model} after ${state.failures} failures`);
  }
}

function recordSuccess(model: string): void {
  const state = getCircuitBreakerState(model);
  state.failures = 0;
  state.isOpen = false;
}

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
  planType?: 'workout' | 'diet' | 'both' // Which plan to regenerate
}

/**
 * Creates the Gemini prompt with user data inserted
 */
function createGeminiPrompt(userData: UserProfile, planType?: 'workout' | 'diet' | 'both'): string {
  const generateBoth = !planType || planType === 'both'
  const generateWorkout = generateBoth || planType === 'workout'
  const generateDiet = generateBoth || planType === 'diet'
  
  // Determine workout split based on user profile
  const getWorkoutSplit = () => {
    const fitnessLevel = userData.fitness_experience.toLowerCase()
    const goal = userData.fitness_goal.toLowerCase()
    const timeline = userData.target_timeline_weeks
    
    // Beginner: Full body or upper/lower
    if (fitnessLevel.includes('beginner') || fitnessLevel.includes('novice')) {
      return 'full-body' // 3 days per week
    }
    
    // Intermediate: Push/Pull/Legs or Upper/Lower
    if (fitnessLevel.includes('intermediate')) {
      return 'push-pull-legs' // 6 days per week
    }
    
    // Advanced: Specialized splits
    if (fitnessLevel.includes('advanced') || fitnessLevel.includes('expert')) {
      return 'bodybuilder' // Chest/Back, Shoulders/Arms, Legs, etc.
    }
    
    // Default based on goal
    if (goal.includes('muscle') || goal.includes('strength')) {
      return 'push-pull-legs'
    }
    
    return 'upper-lower' // Default for most users
  }
  
  const workoutSplit = getWorkoutSplit()
  
  const prompt = `You are an expert fitness and nutrition AI with 20+ years of experience in personal training and sports nutrition.

Generate a fully personalized ${generateWorkout ? '7-day workout' : ''}${generateBoth ? ' and ' : ''}${generateDiet ? '7-day meal' : ''} plan for the following user. Use ONLY the provided calorie target and constraints. Do not recalculate BMR, TDEE, or calories. Output results in JSON format only.

**IMPORTANT: Create a UNIQUE and DIFFERENT plan each time you generate. Vary exercises, meal combinations, and approaches to ensure fresh, engaging content.**

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

${generateWorkout ? `**CRITICAL WORKOUT PROGRAMMING REQUIREMENTS:**

**WORKOUT SPLIT SELECTION:**
Based on the user's fitness level "${userData.fitness_experience}", use this split: ${workoutSplit}

**EXERCISE COUNT REQUIREMENTS:**
- **NEVER** create a workout with only 1 exercise - this is unacceptable for any fitness level
- **Minimum exercises per workout day:**
  * Full Body: 6-8 exercises per day
  * Upper/Lower: 6-8 exercises per day  
  * Push/Pull/Legs: 5-7 exercises per day
  * Bodybuilder Split: 4-6 exercises per day
- **Each exercise must have:**
  * Exercise name (specific, not generic)
  * Sets: 3-5 sets minimum
  * Reps: Specific rep ranges (e.g., "8-12", "12-15", "6-8")
  * Rest: Rest periods between sets

**WORKOUT SPLIT SPECIFICATIONS:**

**Full Body Split (3 days/week - Mon/Wed/Fri):**
- Day 1: Full Body A (Squat, Bench Press, Row, Overhead Press, Bicep Curl, Tricep Extension)
- Day 2: Rest
- Day 3: Full Body B (Deadlift, Incline Press, Pull-up, Lateral Raise, Hammer Curl, Close-grip Press)
- Day 4: Rest  
- Day 5: Full Body C (Lunges, Chest Fly, Lat Pulldown, Face Pull, Preacher Curl, Overhead Extension)
- Day 6: Rest
- Day 7: Rest

**Upper/Lower Split (4 days/week - Mon/Tue/Thu/Fri):**
- Day 1: Upper Body A (Bench Press, Row, Overhead Press, Lat Pulldown, Bicep Curl, Tricep Dip)
- Day 2: Lower Body A (Squat, Romanian Deadlift, Leg Press, Leg Curl, Calf Raise, Hip Thrust)
- Day 3: Rest
- Day 4: Upper Body B (Incline Press, Pull-up, Lateral Raise, Face Pull, Hammer Curl, Close-grip Press)
- Day 5: Lower Body B (Deadlift, Bulgarian Split Squat, Leg Extension, Leg Curl, Standing Calf Raise, Glute Bridge)
- Day 6: Rest
- Day 7: Rest

**Push/Pull/Legs Split (6 days/week):**
- Day 1: Push A (Bench Press, Overhead Press, Incline Press, Lateral Raise, Tricep Dip, Overhead Extension)
- Day 2: Pull A (Deadlift, Pull-up, Row, Face Pull, Bicep Curl, Hammer Curl)
- Day 3: Legs A (Squat, Romanian Deadlift, Leg Press, Leg Curl, Calf Raise, Hip Thrust)
- Day 4: Push B (Incline Press, Overhead Press, Chest Fly, Lateral Raise, Close-grip Press, Tricep Extension)
- Day 5: Pull B (Barbell Row, Lat Pulldown, Face Pull, Rear Delt Fly, Preacher Curl, Cable Curl)
- Day 6: Legs B (Deadlift, Bulgarian Split Squat, Leg Extension, Leg Curl, Standing Calf Raise, Glute Bridge)
- Day 7: Rest

**Bodybuilder Split (6 days/week):**
- Day 1: Chest/Triceps (Bench Press, Incline Press, Chest Fly, Dips, Close-grip Press, Overhead Extension)
- Day 2: Back/Biceps (Deadlift, Pull-up, Row, Lat Pulldown, Bicep Curl, Hammer Curl)
- Day 3: Shoulders (Overhead Press, Lateral Raise, Face Pull, Rear Delt Fly, Shrug, Upright Row)
- Day 4: Legs (Squat, Romanian Deadlift, Leg Press, Leg Curl, Calf Raise, Hip Thrust)
- Day 5: Arms (Bicep Curl, Tricep Dip, Hammer Curl, Close-grip Press, Preacher Curl, Overhead Extension)
- Day 6: Rest/Active Recovery
- Day 7: Rest

**EXERCISE VARIETY RULES:**
- If same muscle group appears on multiple days, use COMPLETELY DIFFERENT exercises
- Example: If Monday has Bench Press, Friday should have Incline Press, not Bench Press again
- Vary rep ranges: Heavy days (4-6 reps), Moderate days (8-12 reps), Light days (12-15 reps)
- Include both compound and isolation exercises
- Progress from compound to isolation within each workout
- **CRITICAL: Each regeneration must use DIFFERENT exercise selections and combinations**
- Rotate between exercise variations (e.g., Barbell vs Dumbbell vs Machine exercises)
- Vary the order and structure of workouts to keep them fresh and engaging

**DIFFICULTY PROGRESSION:**
- Beginner: Focus on form, lighter weights, higher reps (12-15)
- Intermediate: Moderate weights, balanced reps (8-12), more volume
- Advanced: Heavy weights, varied reps (4-12), high volume, advanced techniques

**REST DAYS:**
- Always include at least 1 full rest day per week
- For 6-day splits, make Day 7 a complete rest day
- For 3-4 day splits, spread rest days throughout the week` : ''}

${generateDiet ? `**MEAL PLAN REQUIREMENTS:**
- Provide daily meal breakdowns (breakfast, lunch, dinner, snacks)
- Ensure each day's total calories ≈ ${userData.target_calories} kcal (±25 kcal tolerance)
- List key macros (protein, carbs, fat) per meal
- For EACH meal, include:
  * Ingredients list with exact measurements
  * Step-by-step preparation instructions  
  * Cooking time
  * Serving size
- **CRITICAL HEALTH REQUIREMENTS:**
  * ONLY use healthy, nutritious whole foods (lean proteins, vegetables, fruits, whole grains, healthy fats)
  * NEVER include junk food, processed foods, or unhealthy snacks (no donuts, chips, candy, fast food, etc.)
  * Prioritize nutrient-dense foods that support fitness goals
  * Focus on clean eating principles unless user explicitly requests otherwise
  * Use fresh, minimally processed ingredients
- Avoid all user allergies and restrictions: ${userData.allergies?.join(', ') || 'None'}
- Use user's dietary preference: ${userData.dietary_preferences}
- Consider user's meal frequency: ${userData.meal_frequency}
- **CRITICAL: Each regeneration must use DIFFERENT meal combinations and recipes**
- Vary cooking methods (grilled, baked, steamed, raw, etc.)
- Rotate between different protein sources, vegetables, and grains
- Create diverse flavor profiles and cuisines while respecting dietary preferences` : ''}

**CRITICAL JSON FORMATTING RULES:**
- ONLY output valid JSON - no markdown, no explanations, no extra text
- The response MUST be a single JSON object with this EXACT structure:
{
  "workout": [ /* array of 7 days */ ],
  "diet": [ /* array of 7 days */ ]
}
- NEVER nest arrays incorrectly - each array must be properly bracketed
- NEVER use triple quotes or double quotes - use single quotes for JSON structure
- ALL property names must be quoted with double quotes
- ALL string values must be quoted with double quotes
- Numbers must NOT be quoted (e.g., "sets": 3, not "sets": "3")
- Arrays must be properly formatted with commas between items
- Objects must be properly formatted with commas between properties
- NEVER include any text before or after the JSON object
- NEVER include markdown code blocks or other formatting
- The response must be parseable by JSON.parse() without any modifications

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
 * Creates a fallback plan structure when JSON parsing completely fails
 */
function createFallbackPlan(): GeminiResponse {
  
  
  return {
    workout: [
      { day: "Monday", routine: [{ exercise: "Push-ups", sets: 3, reps: 10, rest: "1 min" }] },
      { day: "Tuesday", routine: [{ exercise: "Squats", sets: 3, reps: 15, rest: "1 min" }] },
      { day: "Wednesday", routine: [{ exercise: "Plank", reps: "30 seconds", rest: "1 min" }] },
      { day: "Thursday", routine: [{ exercise: "Lunges", sets: 3, reps: 10, rest: "1 min" }] },
      { day: "Friday", routine: [{ exercise: "Burpees", sets: 3, reps: 5, rest: "1 min" }] },
      { day: "Saturday", routine: [{ exercise: "Mountain Climbers", reps: "30 seconds", rest: "1 min" }] },
      { day: "Sunday", routine: [] }
    ],
    diet: [
      { 
        day: "Monday", 
        meals: [
          { meal: "Breakfast", description: "Oatmeal with fruits", kcal: 300, protein_g: 10, carbs_g: 50, fat_g: 8 },
          { meal: "Lunch", description: "Grilled chicken salad", kcal: 400, protein_g: 30, carbs_g: 20, fat_g: 15 },
          { meal: "Dinner", description: "Baked salmon with vegetables", kcal: 500, protein_g: 35, carbs_g: 25, fat_g: 20 }
        ]
      },
      { 
        day: "Tuesday", 
        meals: [
          { meal: "Breakfast", description: "Greek yogurt with berries", kcal: 250, protein_g: 15, carbs_g: 30, fat_g: 5 },
          { meal: "Lunch", description: "Turkey wrap", kcal: 450, protein_g: 25, carbs_g: 35, fat_g: 18 },
          { meal: "Dinner", description: "Quinoa bowl with vegetables", kcal: 400, protein_g: 20, carbs_g: 45, fat_g: 12 }
        ]
      },
      { 
        day: "Wednesday", 
        meals: [
          { meal: "Breakfast", description: "Scrambled eggs with toast", kcal: 350, protein_g: 20, carbs_g: 30, fat_g: 15 },
          { meal: "Lunch", description: "Lentil soup", kcal: 300, protein_g: 18, carbs_g: 40, fat_g: 8 },
          { meal: "Dinner", description: "Grilled fish with rice", kcal: 450, protein_g: 30, carbs_g: 35, fat_g: 16 }
        ]
      },
      { 
        day: "Thursday", 
        meals: [
          { meal: "Breakfast", description: "Smoothie bowl", kcal: 300, protein_g: 12, carbs_g: 45, fat_g: 10 },
          { meal: "Lunch", description: "Chicken stir-fry", kcal: 400, protein_g: 28, carbs_g: 25, fat_g: 18 },
          { meal: "Dinner", description: "Vegetable pasta", kcal: 350, protein_g: 15, carbs_g: 50, fat_g: 12 }
        ]
      },
      { 
        day: "Friday", 
        meals: [
          { meal: "Breakfast", description: "Avocado toast", kcal: 320, protein_g: 12, carbs_g: 35, fat_g: 18 },
          { meal: "Lunch", description: "Tuna salad", kcal: 380, protein_g: 25, carbs_g: 20, fat_g: 22 },
          { meal: "Dinner", description: "Beef stir-fry", kcal: 480, protein_g: 32, carbs_g: 30, fat_g: 20 }
        ]
      },
      { 
        day: "Saturday", 
        meals: [
          { meal: "Breakfast", description: "Pancakes with syrup", kcal: 400, protein_g: 10, carbs_g: 60, fat_g: 15 },
          { meal: "Lunch", description: "Burger with fries", kcal: 600, protein_g: 25, carbs_g: 55, fat_g: 30 },
          { meal: "Dinner", description: "Pizza slice", kcal: 350, protein_g: 15, carbs_g: 40, fat_g: 18 }
        ]
      },
      { 
        day: "Sunday", 
        meals: [
          { meal: "Breakfast", description: "French toast", kcal: 380, protein_g: 12, carbs_g: 45, fat_g: 16 },
          { meal: "Lunch", description: "Roast chicken", kcal: 450, protein_g: 35, carbs_g: 25, fat_g: 20 },
          { meal: "Dinner", description: "Pasta with meatballs", kcal: 420, protein_g: 22, carbs_g: 40, fat_g: 18 }
        ]
      }
    ]
  };
}

interface JsonStructureValidation {
  isValid: boolean;
  error?: string;
  canRepair: boolean;
  repairedJson?: string;
}

/**
 * Validates JSON structure and attempts to repair common issues
 */
function validateJsonStructure(jsonText: string): JsonStructureValidation {
  try {
    console.log('Validating JSON structure...');
    const trimmedJson = jsonText.trim();

    // Basic structure checks
    if (!trimmedJson.startsWith('{')) {
      console.log('JSON does not start with {');
      // Try to find and extract a valid JSON object
      const jsonMatch = trimmedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found potential JSON object in text');
        return {
          isValid: false,
          error: 'JSON embedded in other text',
          canRepair: true,
          repairedJson: jsonMatch[0]
        };
      }
      return {
        isValid: false,
        error: 'JSON must start with {',
        canRepair: false
      };
    }

    // Fix common quotation mark issues
    let repairedJson = trimmedJson
      // Fix triple quotes
      .replace(/"""/g, '"')
      // Fix double quotes
      .replace(/""/g, '"')
      // Fix unescaped quotes in strings
      .replace(/(?<!\\)"/g, '\\"')
      .replace(/\\\\"/g, '\\"')
      // Restore outer quotes
      .replace(/^\{/, '{"')
      .replace(/\}$/, '"}')
      // Fix property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // Check for balanced braces and brackets
    const openBraces = (repairedJson.match(/\{/g) || []).length;
    const closeBraces = (repairedJson.match(/\}/g) || []).length;
    const openBrackets = (repairedJson.match(/\[/g) || []).length;
    const closeBrackets = (repairedJson.match(/\]/g) || []).length;

    console.log(`Braces: ${openBraces}/${closeBraces}, Brackets: ${openBrackets}/${closeBrackets}`);

    if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
      // Try to repair by adding missing braces/brackets
      const missingCloseBrackets = openBrackets - closeBrackets;
      const missingCloseBraces = openBraces - closeBraces;

      if (missingCloseBrackets > 0) {
        console.log(`Adding ${missingCloseBrackets} missing close brackets`);
        repairedJson = repairedJson.replace(/\s*$/, ']'.repeat(missingCloseBrackets));
      }
      if (missingCloseBraces > 0) {
        console.log(`Adding ${missingCloseBraces} missing close braces`);
        repairedJson = repairedJson.replace(/\s*$/, '}'.repeat(missingCloseBraces));
      }

      return {
        isValid: false,
        error: 'Unbalanced braces/brackets',
        canRepair: true,
        repairedJson
      };
    }

    // Check for required workout/diet structure
    const hasWorkout = /"workout"\s*:\s*\[/.test(repairedJson);
    const hasDiet = /"diet"\s*:\s*\[/.test(repairedJson);

    if (!hasWorkout && !hasDiet) {
      console.log('Missing required workout/diet arrays');
      return {
        isValid: false,
        error: 'Missing required workout/diet structure',
        canRepair: false
      };
    }

    // Try to parse the JSON to validate structure
    try {
      JSON.parse(repairedJson);
      console.log('JSON structure is valid');
      return { 
        isValid: true, 
        canRepair: false,
        repairedJson 
      };
    } catch (parseError) {
      console.log('JSON parse error:', parseError instanceof Error ? parseError.message : 'Unknown error');
      return {
        isValid: false,
        error: 'Invalid JSON structure',
        canRepair: true,
        repairedJson
      };
    }

  } catch (error) {
    console.log('Validation error:', error instanceof Error ? error.message : 'Unknown error');
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      canRepair: false
    };
  }
}

/**
 * Attempts to repair malformed JSON by fixing common issues
 */
function repairJson(jsonText: string): string {
  console.log('Repairing JSON...');
  let repaired = jsonText;
  
  // Enhanced JSON repair patterns
  const repairPatterns = [
    // Fix unquoted AMRAP and similar values
    { pattern: /\"reps\":\s*as many as possible\s*\(AMRAP\)/g, replacement: '"reps": "as many as possible (AMRAP)"' },
    { pattern: /\"reps\":\s*as many as possible/g, replacement: '"reps": "as many as possible"' },
    { pattern: /\"reps\":\s*as many as you can/g, replacement: '"reps": "as many as you can"' },
    { pattern: /\"reps\":\s*to failure/g, replacement: '"reps": "to failure"' },
    { pattern: /\"reps\":\s*max/g, replacement: '"reps": "max"' },
    { pattern: /\"reps\":\s*AMRAP/g, replacement: '"reps": "AMRAP"' },
    { pattern: /\"reps\":\s*(\d+)\s*-\s*(\d+)/g, replacement: '"reps": "$1-$2"' },
    { pattern: /\"reps\":\s*(\d+)\s*or\s*(\d+)/g, replacement: '"reps": "$1 or $2"' },
    
    // Fix mixed data types in reps/minutes
    { pattern: /\"reps\/minutes\":\s*(\d+)\s*seconds/g, replacement: '"reps/minutes": $1' },
    { pattern: /\"reps\/minutes\":\s*(\d+)\s*minutes/g, replacement: '"reps/minutes": $1' },
    
    // Fix common issues with rest field
    { pattern: /\"rest\":\s*(\d+)\s*-\s*(\d+)\s*min/g, replacement: '"rest": "$1-$2 min"' },
    { pattern: /\"rest\":\s*(\d+)\s*sec/g, replacement: '"rest": "$1 sec"' },
    { pattern: /\"rest\":\s*(\d+)\s*min/g, replacement: '"rest": "$1 min"' },
    
    // Fix intensity field
    { pattern: /\"intensity\":\s*moderate/g, replacement: '"intensity": "moderate"' },
    { pattern: /\"intensity\":\s*high/g, replacement: '"intensity": "high"' },
    { pattern: /\"intensity\":\s*low/g, replacement: '"intensity": "low"' },
    
    // Fix unquoted property names
    { pattern: /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, replacement: '$1"$2":' },
    
    // Fix missing commas between array items
    { pattern: /}\s*{/g, replacement: '}, {' },
    { pattern: /]\s*{/g, replacement: '], {' },
    { pattern: /}\s*\[/g, replacement: '}, [' },
    
    // Fix trailing/leading commas
    { pattern: /,(\s*[}\]])/g, replacement: '$1' },
    { pattern: /([{[]\s*),/g, replacement: '$1' },
    
    // Fix double quotes inside strings
    { pattern: /"([^"]*)""/g, replacement: '"$1\\"' },
    
    // Fix missing quotes around string values
    { pattern: /:\s*([a-zA-Z][a-zA-Z0-9\s-]*[a-zA-Z0-9])(\s*[,}])/g, replacement: ':"$1"$2' }
  ];

  // Apply each repair pattern and log changes
  repairPatterns.forEach(({ pattern, replacement }) => {
    const before = repaired;
    repaired = repaired.replace(pattern, replacement);
    if (before !== repaired) {
      console.log(`Applied repair pattern: ${pattern}`);
    }
  });

  // Fix exercise field with special characters (needs custom function)
  repaired = repaired.replace(/\"exercise\":\s*([^",}\]]+?)\s*\([^)]+\)/g, (match, exercise) => {
      return `"exercise": "${exercise.trim()} (${match.match(/\([^)]+\)/)?.[0] || ''})"`;
  });

  // Fix any remaining unquoted string values
  repaired = repaired.replace(/:\s*([^",}\]\d][^,}\]]*[^,}\]\d])(\s*[,}\]])/g, (match: string, value: string, end: string) => {
      const trimmedValue = value.trim();
    // Skip if it's a number, boolean, or null
    if (!isNaN(Number(trimmedValue)) || 
        ['true', 'false', 'null'].includes(trimmedValue.toLowerCase())) {
      return match;
    }
    return `: "${trimmedValue}"${end}`;
  });

  // Clean up whitespace
  repaired = repaired
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*{\s*/g, '{ ')
    .replace(/\s*}\s*/g, ' }')
    .replace(/\s*\[\s*/g, '[ ')
    .replace(/\s*\]\s*/g, ' ]')
    .trim();
  
  return repaired;
}

/**
 * Calls Gemini API with the prompt - tries multiple model versions for reliability
 */
/**
 * Pre-processes the raw Gemini response to ensure consistent formatting
 */
function preprocessGeminiResponse(text: string): string {
  console.log('Pre-processing Gemini response...');
  console.log('Original length:', text.length);
  
  // First, try to extract just the JSON part
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log('No JSON object found in response');
    return text;
  }
  
  let processed = jsonMatch[0];
  console.log('Extracted JSON length:', processed.length);
  
  // Fix common formatting issues
  processed = processed
    // Remove any markdown code block markers
    .replace(/```[a-z]*\n?|\n?```/g, '')
    // Fix array formatting
    .replace(/"\s*\[\s*\[/g, '"[')
    .replace(/\]\s*\]"/g, ']')
    // Fix nested quotes
    .replace(/"{2,}/g, '"')
    .replace(/'{2,}/g, '"')
    // Fix property names
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix string values
    .replace(/:\s*"([^"]*)""/g, ':"$1"')
    // Fix array/object separators
    .replace(/}\s*{/g, '},{')
    .replace(/]\s*{/g, '],{')
    .replace(/}\s*\[/g, '},[')
    // Remove any remaining whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Processed length:', processed.length);
  return processed;
}

async function callGeminiAPI(prompt: string): Promise<GeminiResponse> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  // Use FASTEST proven models - prioritize speed over newest version
  // Based on testing: gemini-2.0-flash responded instantly with "Hello"
  // Reordered to prioritize most reliable models first
  const modelVersions = [
    'gemini-2.0-flash',        // ✅ FASTEST & MOST RELIABLE - Instant "Hello" response
    'gemini-flash-latest',     // ✅ FAST - Good response time, secondary fallback
    'gemini-2.5-flash',        // ✅ Works but slower (2 min) - last resort fallback
  ];

  let lastError: Error | null = null;
  
  // Add retry logic with exponential backoff for 503 errors
  const maxRetries = 2;
  const baseDelay = 1000; // 1 second

  for (const model of modelVersions) {
    // Check circuit breaker before attempting to call the model
    if (shouldSkipModel(model)) {
      continue;
    }
    
    let retryCount = 0;
    let modelSuccess = false;
    
    while (retryCount <= maxRetries && !modelSuccess) {
      try {
        if (retryCount > 0) {
          const delay = baseDelay * Math.pow(2, retryCount - 1);
          console.log(`Retrying ${model} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`Attempting to call ${model}...`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
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
                maxOutputTokens: 8192, // Reduced from 32000 for faster generation
              }
            })
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          const errorMessage = `${model} API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
          console.log(errorMessage)
          
          // For 503 errors, retry with exponential backoff
          if (response.status === 503 && retryCount < maxRetries) {
            console.log(`Service temporarily unavailable for ${model}, retrying...`)
            retryCount++;
            continue;
          }
          
          // For 503 errors on final retry, log as service unavailable but don't treat as critical failure
          if (response.status === 503) {
            console.log(`Service temporarily unavailable for ${model} after ${maxRetries} retries, trying next model...`)
          }
          
          recordFailure(model); // Record failure for circuit breaker
          lastError = new Error(errorMessage)
          break; // Exit retry loop and try next model
        }

        console.log(`Successfully connected to ${model}`)
        const data = await response.json()

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          const errorMessage = `Invalid response from ${model} API`
          console.log(errorMessage)
          recordFailure(model); // Record failure for circuit breaker
          lastError = new Error(errorMessage)
          break; // Exit retry loop and try next model
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        console.log(`${model} generated response successfully`);
        console.log(`Response length: ${generatedText.length} characters`);
        
        // Check for error messages embedded in the response
        if (generatedText.includes('[ERROR]') || generatedText.includes('error:') || generatedText.includes('Error:')) {
          console.log(`Detected error message in ${model} response, retrying...`);
          if (retryCount < maxRetries) {
            retryCount++;
            continue;
          } else {
            console.log(`Error messages persist in ${model} response after ${maxRetries} retries, trying next model...`);
            recordFailure(model); // Record failure for circuit breaker
            lastError = new Error(`Error messages detected in ${model} response`);
            break;
          }
        }
        
        // Log first and last parts of response for debugging
        console.log(`Response start: ${generatedText.substring(0, 200)}`);
        console.log(`Response end: ${generatedText.substring(Math.max(0, generatedText.length - 200))}`);
        
        // Pre-process and clean the response
        const preprocessed = preprocessGeminiResponse(generatedText);
        
        // Try to parse the pre-processed response
        try {
          const parsed = JSON.parse(preprocessed) as GeminiResponse;
          if (isValidPlanStructure(parsed)) {
            console.log('Successfully parsed pre-processed response');
            recordSuccess(model); // Record success for circuit breaker
            return parsed;
          }
        } catch (parseError) {
          console.log('Failed to parse pre-processed response:', parseError instanceof Error ? parseError.message : 'Unknown error');
        }
        
        // If pre-processing failed, try full processing
        const result = processGeminiResponse(generatedText);
        if (result && isValidPlanStructure(result)) {
          recordSuccess(model); // Record success for circuit breaker
          return result;
        }
        
        // If parsing failed, retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`JSON parsing failed for ${model}, retrying...`);
          retryCount++;
          continue;
        } else {
          console.log(`JSON parsing failed for ${model} after ${maxRetries} retries, trying next model...`);
          recordFailure(model); // Record failure for circuit breaker
          lastError = new Error(`JSON parsing failed for ${model}`);
          break;
        }
        
      } catch (error) {
        console.log(`Error with ${model}:`, error.message)
        if (retryCount < maxRetries) {
          console.log(`Retrying ${model} due to error...`);
          retryCount++;
          continue;
        } else {
          recordFailure(model); // Record failure for circuit breaker
          lastError = error instanceof Error ? error : new Error(String(error))
          break; // Exit retry loop and try next model
        }
      }
    }
    
    // If we exit the retry loop without success, continue to next model
    if (!modelSuccess) {
      continue;
    }
  }

  // If all models failed, provide a more user-friendly error message
  const friendlyErrorMessage = 'Plan generation is temporarily unavailable. Please try again in a few moments.';
  console.log('All Gemini model versions failed. Last error:', lastError?.message);
  throw new Error(friendlyErrorMessage)
}

/**
 * Processes the raw Gemini response text and returns parsed JSON
 */
function processGeminiResponse(generatedText: string): GeminiResponse {
  // Enhanced logging for debugging
  console.log('Processing Gemini response...');
  console.log('Raw response length:', generatedText.length);
  console.log('Response preview:', generatedText.substring(0, 200));
  
  // Extract JSON from the response with enhanced markdown handling
  let jsonText = generatedText.trim();
  
  // First clean up any markdown and extra characters
  interface CleanupPattern {
    pattern: RegExp;
    replacement: string | ((match: string, ...args: any[]) => string);
  }

  const cleanupPatterns: CleanupPattern[] = [
    { pattern: /```json\s*/g, replacement: '' },    // JSON code block start
    { pattern: /```typescript\s*/g, replacement: '' }, // TypeScript code block start
    { pattern: /```javascript\s*/g, replacement: '' }, // JavaScript code block start
    { pattern: /```\s*/g, replacement: '' },        // Any code block start/end
    { pattern: /^\s*```[\s\S]*?```\s*$/gm, replacement: '' }, // Complete code blocks
    { pattern: /^\s*#.*$/gm, replacement: '' },     // Markdown headers
    { pattern: /\[.*?\]/g, replacement: '' },       // Markdown links
    { pattern: /\(.*?\)/g, replacement: '' },       // Markdown link targets
    { pattern: /^\s*[-*]\s.*$/gm, replacement: '' }, // List items
    { pattern: /"""/g, replacement: '"' },          // Fix triple quotes
    { pattern: /""/g, replacement: '"' },           // Fix double quotes
    { pattern: /(['"])([^'"]*)\1/g, replacement: (_: string, __: string, content: string) => `"${content}"` }, // Standardize quotes
    { pattern: /\\"/g, replacement: '"' },          // Fix escaped quotes
    { pattern: /\n/g, replacement: ' ' },           // Remove newlines
    { pattern: /\s+/g, replacement: ' ' }           // Normalize whitespace
  ];
  
  cleanupPatterns.forEach(({ pattern, replacement }) => {
    const before = jsonText;
    if (typeof replacement === 'string') {
      jsonText = jsonText.replace(pattern, replacement);
    } else {
      jsonText = jsonText.replace(pattern, replacement);
    }
    if (before !== jsonText) {
      console.log(`Applied cleanup pattern: ${pattern}`);
    }
  });
  
  // Find the JSON object with enhanced validation
  let jsonStart = -1;
  let jsonEnd = -1;
  let validJsonFound = false;
  
  // Look for multiple potential JSON start positions
  const potentialStarts = [];
  let pos = 0;
  while ((pos = jsonText.indexOf('{', pos)) !== -1) {
    potentialStarts.push(pos);
    pos++;
  }
  
  console.log(`Found ${potentialStarts.length} potential JSON start positions`);
  
  // Try each potential start position
  for (const start of potentialStarts) {
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
    let isValid = true;
  
    for (let i = start; i < jsonText.length; i++) {
    const char = jsonText[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
            // Found a complete JSON object
            jsonStart = start;
          jsonEnd = i;
            validJsonFound = true;
            break;
          } else if (braceCount < 0) {
            // Invalid JSON structure
            isValid = false;
          break;
        }
      }
    }
  }
  
    if (validJsonFound) {
      console.log(`Found valid JSON structure at position ${jsonStart}`);
      break;
    }
  }
  
  if (!validJsonFound) {
    console.log('No valid JSON structure found in response');
    console.log('Attempting advanced recovery...');
    
    // Try to find any complete objects
    const matches = jsonText.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g);
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} potential complete JSON objects`);
      
      // Try each match to find a valid workout/diet plan
      for (const match of matches) {
        try {
          const parsed = JSON.parse(match);
          if ((parsed.workout && Array.isArray(parsed.workout)) || 
              (parsed.diet && Array.isArray(parsed.diet))) {
            console.log('Found valid plan structure in JSON match');
            jsonText = match;
            validJsonFound = true;
          break;
          }
        } catch (e) {
          // Continue to next match
        }
      }
    }
    
    if (!validJsonFound) {
      console.log('Advanced recovery failed, using fallback plan');
      return createFallbackPlan();
    }
  }
  
  // Extract and clean the JSON
  jsonText = validJsonFound ? 
    jsonText.substring(jsonStart, jsonEnd + 1) : 
    jsonText;
  
  // Enhanced structure validation
  const structureValidation = validateJsonStructure(jsonText);
  if (!structureValidation.isValid) {
    console.log('Structure validation failed:', structureValidation.error);
    if (structureValidation.canRepair) {
      console.log('Attempting to repair structure...');
      jsonText = structureValidation.repairedJson || jsonText;
    }
  }
  
  // Apply enhanced JSON repair
  jsonText = repairJson(jsonText);

  try {
    let parsedResponse: GeminiResponse = createFallbackPlan();
    let parseSuccess = false;
    let parseError: Error | null = null;
    
      // First attempt: standard JSON parsing
    try {
      parsedResponse = JSON.parse(jsonText);
      parseSuccess = true;
    } catch (firstError) {
      console.log('Initial JSON parse failed:', firstError instanceof Error ? firstError.message : 'Unknown error');
      parseError = firstError instanceof Error ? firstError : new Error('Unknown parse error');
    }

    // If first attempt failed, try with enhanced validation and repair
    if (!parseSuccess) {
      console.log('Attempting enhanced JSON parsing...');
      
      // Apply enhanced validation
      const validation = validateJsonStructure(jsonText);
      if (!validation.isValid) {
        console.log('Structure validation failed:', validation.error);
        if (validation.canRepair && validation.repairedJson) {
          console.log('Attempting to parse repaired structure...');
          try {
            parsedResponse = JSON.parse(validation.repairedJson);
            parseSuccess = true;
          } catch (structureError) {
            console.log('Structure repair parsing failed:', structureError instanceof Error ? structureError.message : 'Unknown error');
          }
        }
      }

      // If still not successful, try aggressive cleaning
      if (!parseSuccess) {
        console.log('Attempting aggressive JSON cleaning...');
        const cleanedJson = jsonText
          .replace(/,\s*[}\]]/g, '$&')  // Fix trailing commas
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // Fix unquoted property names
          .replace(/:\s*'([^']*)'/g, ':"$1"')  // Fix single quotes
          .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove comments
          .replace(/\/\/.*$/gm, '')
          .trim();
        
        try {
          parsedResponse = JSON.parse(cleanedJson);
          parseSuccess = true;
        } catch (cleanError) {
          console.log('Clean parse failed:', cleanError instanceof Error ? cleanError.message : 'Unknown error');
        }
      }

      // If still not successful, try pattern-based repair
      if (!parseSuccess) {
        console.log('Attempting pattern-based repair...');
        try {
  // Find complete JSON objects
  const jsonPattern = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
  const matches = jsonText.match(jsonPattern);
  
  if (matches) {
    for (const match of matches) {
      try {
        const candidate = JSON.parse(match) as GeminiResponse;
        if (isValidPlanStructure(candidate)) {
          parsedResponse = candidate;
          parseSuccess = true;
          break;
        }
      } catch {
        // Continue to next match
      }
    }
  }
        } catch (patternError) {
          console.log('Pattern repair failed:', patternError instanceof Error ? patternError.message : 'Unknown error');
        }
      }
    }

    // If we have a parsed response, validate its structure
    if (parseSuccess && parsedResponse) {
      console.log('Validating plan structure...');
      
      // Enhanced structure validation
      const validationResult = validatePlanStructure(parsedResponse);
      if (!validationResult.isValid) {
        console.log('Plan structure validation failed:', validationResult.errors);
        
        if (validationResult.canFix && validationResult.fixedPlan) {
          console.log('Using fixed plan structure');
          parsedResponse = validationResult.fixedPlan;
        } else {
          console.log('Cannot fix plan structure, using fallback');
          return createFallbackPlan();
        }
      }

      return parsedResponse;
    }

    // If all parsing attempts failed
    console.log('All parsing attempts failed');
    if (parseError) {
      console.log('Original parse error:', parseError.message);
      console.log('Error context:', getErrorContext(parseError, jsonText));
    }
    
    return createFallbackPlan();

  } catch (error) {
    console.log('Unexpected error during JSON processing:', error instanceof Error ? error.message : 'Unknown error');
    return createFallbackPlan();
  }
}

/**
 * Validates if an object has the correct plan structure
 */
function isValidPlanStructure(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    (
      (Array.isArray(obj.workout) && obj.workout.length === 7) ||
      (Array.isArray(obj.diet) && obj.diet.length === 7)
    )
  );
}

interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
  canFix: boolean;
  fixedPlan?: GeminiResponse;
}

/**
 * Performs detailed validation of the plan structure
 */
function validatePlanStructure(plan: any): PlanValidationResult {
  const errors: string[] = [];
  let canFix = false;
  let fixedPlan: GeminiResponse | undefined;

  // Check basic structure
  if (!plan || typeof plan !== 'object') {
    errors.push('Invalid plan object');
    return { isValid: false, errors, canFix: false };
  }

  // Validate workout section
  if (plan.workout !== undefined) {
    if (!Array.isArray(plan.workout)) {
      errors.push('Workout must be an array');
    } else {
      if (plan.workout.length !== 7) {
        errors.push(`Workout must have exactly 7 days (found ${plan.workout.length})`);
        // Try to fix workout length
        if (plan.workout.length > 7) {
          plan.workout = plan.workout.slice(0, 7);
          canFix = true;
        } else if (plan.workout.length < 7) {
          // Pad with rest days
          while (plan.workout.length < 7) {
            plan.workout.push({ day: getDayName(plan.workout.length), type: "rest", routine: [] });
          }
          canFix = true;
        }
      }

      // Validate each workout day
      plan.workout.forEach((day: any, index: number) => {
        if (!day.day || !day.routine || !Array.isArray(day.routine)) {
          errors.push(`Invalid workout day structure at day ${index + 1}`);
        }
      });
    }
  }

  // Validate diet section
  if (plan.diet !== undefined) {
    if (!Array.isArray(plan.diet)) {
      errors.push('Diet must be an array');
    } else {
      if (plan.diet.length !== 7) {
        errors.push(`Diet must have exactly 7 days (found ${plan.diet.length})`);
        // Try to fix diet length
        if (plan.diet.length > 7) {
          plan.diet = plan.diet.slice(0, 7);
          canFix = true;
        } else if (plan.diet.length < 7) {
          // Pad with default days
          while (plan.diet.length < 7) {
            plan.diet.push({
              day: getDayName(plan.diet.length),
              meals: [
                { meal: "Breakfast", description: "Default breakfast", kcal: 300 },
                { meal: "Lunch", description: "Default lunch", kcal: 400 },
                { meal: "Dinner", description: "Default dinner", kcal: 500 }
              ]
            });
          }
          canFix = true;
        }
      }

      // Validate each diet day
      plan.diet.forEach((day: any, index: number) => {
        if (!day.day || !day.meals || !Array.isArray(day.meals)) {
          errors.push(`Invalid diet day structure at day ${index + 1}`);
        }
      });
    }
  }

  // If we can fix the issues and have made fixes
  if (canFix && errors.length > 0) {
    fixedPlan = plan as GeminiResponse;
  }

  return {
    isValid: errors.length === 0,
    errors,
    canFix,
    fixedPlan
  };
}

/**
 * Gets the day name for a given index
 */
function getDayName(index: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[index % 7];
}

/**
 * Gets context around a JSON parse error
 */
function getErrorContext(error: Error, jsonText: string): string {
  let context = '';
  
  if (error instanceof SyntaxError) {
    // Try to get position from error message
    const posMatch = error.message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const start = Math.max(0, pos - 50);
      const end = Math.min(jsonText.length, pos + 50);
      context = `...${jsonText.substring(start, pos)}[ERROR]${jsonText.substring(pos, end)}...`;
    }
    
    // Try to get line/column information
    const lineMatch = error.message.match(/line (\d+) column (\d+)/);
    if (lineMatch) {
      const [, line, column] = lineMatch;
      const lines = jsonText.split('\n');
      if (parseInt(line) <= lines.length) {
        context += `\nLine ${line}, Column ${column}:\n${lines[parseInt(line) - 1]}`;
      }
    }
  }
  
  return context || 'No specific error context available';
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
    const { userId, regenerate = false, planType = 'both' }: RequestBody = await req.json()

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
    if (!userData.onboarding_complete) {
      // Allow plan generation even if onboarding is not complete
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
      let finalWorkoutPlan: any[] | null = null
      let finalDietPlan: any[] | null = null
      let updatedUserData = validatedUserData

      // If regenerating diet plan, fetch latest user data and recalculate BMR and calories first
      if (planType === 'diet' || planType === 'both') {
        try {
          // First, fetch the latest user data from the database to get updated weight
          const { data: latestUserData, error: userDataError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (userDataError || !latestUserData) {
            // Use existing validatedUserData if latest data fetch fails
          } else {
            // Update validatedUserData with latest data
            updatedUserData = {
              ...validatedUserData,
              ...latestUserData
            }
          }

          // Map activity level to the format expected by calculate-calories
          const mapActivityLevel = (activityLevel: string): 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active' | 'Super active' => {
            switch (activityLevel) {
              case 'sedentary':
                return 'Sedentary';
              case 'lightly-active':
                return 'Lightly active';
              case 'moderately-active':
                return 'Moderately active';
              case 'very-active':
                return 'Very active';
              case 'super-active':
                return 'Super active';
              default:
                return 'Sedentary'; // Default fallback
            }
          };

          // Call the calculate-calories edge function with the latest data
          const calorieResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-calories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              age: updatedUserData.age,
              gender: updatedUserData.gender,
              height_cm: updatedUserData.height_cm,
              weight_kg: updatedUserData.weight_kg,
              goal_weight_kg: updatedUserData.target_weight_kg || updatedUserData.weight_kg,
              activity_level: mapActivityLevel(updatedUserData.activity_level),
              goal_type: updatedUserData.fitness_goal === 'lose-fat' ? 'lose' : 
                         updatedUserData.fitness_goal === 'gain-muscle' ? 'gain' : 'maintain',
              goal_timeframe_weeks: updatedUserData.target_timeline_weeks
            })
          })

          if (calorieResponse.ok) {
            const calorieData = await calorieResponse.json()
            
            // Update user data with new BMR and target calories
            updatedUserData = {
              ...updatedUserData,
              target_calories: calorieData.targetCalories,
              bmr: calorieData.bmr,
              tdee: calorieData.tdee
            }

            // Update the user profile in the database with new BMR and calorie data
            const { error: updateProfileError } = await supabase
              .from('user_profiles')
              .update({
                target_calories: calorieData.targetCalories,
                bmr: calorieData.bmr,
                tdee: calorieData.tdee,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)

            if (updateProfileError) {
              // Profile update failed but continue with plan generation
            }
          } else {
            const errorText = await calorieResponse.text()
            // Calorie calculation failed but continue with plan generation
          }
        } catch (error) {
          // Error in calorie calculation, continue with existing data
        }
      }

      if (planType === 'both') {
        // Generate both workout and diet plans
        const prompt = createGeminiPrompt(updatedUserData, 'both')
      const geminiResponse = await callGeminiAPI(prompt)
        finalWorkoutPlan = geminiResponse.workout
        finalDietPlan = geminiResponse.diet
      } else {
        // Get existing plan data to preserve the part we're not regenerating
        const { data: existingPlan } = await supabase
          .from('user_plans')
          .select('workout_plan, diet_plan')
          .eq('user_id', userId)
          .eq('is_active', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (planType === 'workout') {
          // Generate only workout plan, keep existing diet plan
          const prompt = createGeminiPrompt(updatedUserData, 'workout')
          const geminiResponse = await callGeminiAPI(prompt)
          finalWorkoutPlan = geminiResponse.workout
          finalDietPlan = existingPlan?.diet_plan || []
        } else if (planType === 'diet') {
          // Generate only diet plan, keep existing workout plan
          const prompt = createGeminiPrompt(updatedUserData, 'diet')
          const geminiResponse = await callGeminiAPI(prompt)
          
          // Validate generated diet plan calories
          if (geminiResponse.diet && Array.isArray(geminiResponse.diet)) {
            geminiResponse.diet.forEach((day: any, index: number) => {
              if (day.meals && Array.isArray(day.meals)) {
                const dayCalories = day.meals.reduce((total: number, meal: any) => total + (meal.kcal || 0), 0)
                const targetCalories = updatedUserData.target_calories
                const difference = Math.abs(dayCalories - targetCalories)
                
                if (difference > 50) {
                  // Calorie difference is significant but continue with plan
                }
              }
            })
          }
          
          finalWorkoutPlan = existingPlan?.workout_plan || []
          finalDietPlan = geminiResponse.diet
        }
      }

      // Update plan with generated content
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({
          workout_plan: finalWorkoutPlan,
          diet_plan: finalDietPlan,
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
          workout: finalWorkoutPlan,
          diet: finalDietPlan
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
