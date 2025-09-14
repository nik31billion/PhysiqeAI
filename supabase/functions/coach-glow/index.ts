import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types and Interfaces
interface UserProfile {
  id: string
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  target_weight_kg: number
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
  primary_goal: string
  fitness_goal: string
}

interface StreakData {
  current_streak: number
  longest_streak: number
  last_workout_date: string | null
  last_meal_completion: string | null
  aura_points: number
  total_workouts_completed: number
  total_meals_completed: number
}

interface PlanData {
  workout_plan: any[]
  diet_plan: any[]
}

interface CoachGlowRequest {
  userId: string
  message: string
  context?: {
    currentDay?: string
    mealType?: string
    workoutType?: string
  }
  conversationHistory?: Array<{
    user_message: string
    coach_response: string
    intent: string
    context?: any
    created_at: string
  }>
}

interface CoachGlowResponse {
  success: boolean
  response: string
  intent: 'motivation' | 'plan_swap' | 'general'
  action_required?: {
    type: 'meal_swap' | 'workout_swap' | 'plan_update'
    data?: any
  }
  error?: string
}

// Intent Detection Keywords
const MOTIVATION_KEYWORDS = [
  'motivated', 'motivation', 'unmotivated', 'quitting', 'give up', 'struggling',
  'hard', 'difficult', 'tired', 'exhausted', 'burned out', 'frustrated',
  'progress', 'stuck', 'plateau', 'losing', 'gained weight', 'missed workout',
  'skipped', 'cheat day', 'binge', 'fell off', 'consistency', 'streak',
  'encourage', 'support', 'help', 'advice', 'tips', 'stuck', 'cheating',
  'cheat', 'habit', 'bad habit', 'guilty', 'feel bad', 'disappointed'
]

const PLAN_SWAP_KEYWORDS = [
  'change', 'swap', 'replace', 'different', 'instead', 'modify', 'update',
  'don\'t like', 'hate', 'dislike', 'boring', 'tired of', 'new', 'alternative',
  'give me', 'suggest', 'recommend', 'can i have', 'i want', 'i need'
]

const MEAL_INFO_KEYWORDS = [
  'what is', 'tell me about', 'explain', 'describe', 'details about', 'info about',
  'this meal', 'my meal', 'current meal', 'today\'s meal', 'understand', 'can\'t understand'
]

/**
 * Analyzes user message to determine intent
 */
function detectIntent(message: string): 'motivation' | 'plan_swap' | 'general' {
  const lowerMessage = message.toLowerCase()
  
  // Check for motivation keywords first (highest priority)
  const hasMotivationKeywords = MOTIVATION_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  )
  
  // Check for meal info keywords (should be general, not plan swap)
  const hasMealInfoKeywords = MEAL_INFO_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  )
  
  // Check for plan swap keywords (only if not asking for info)
  const hasSwapKeywords = PLAN_SWAP_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  )
  
  // Priority order: motivation > meal info (general) > plan swap
  if (hasMotivationKeywords) {
    return 'motivation'
  }
  
  if (hasMealInfoKeywords) {
    return 'general'
  }
  
  if (hasSwapKeywords) {
    return 'plan_swap'
  }
  
  return 'general'
}

/**
 * Extracts user profile data from database
 */
async function getUserProfile(supabase: any, userId: string): Promise<UserProfile> {
  const { data: userData, error } = await supabase
    .from('user_profiles')
    .select(`
      id, age, gender, height_cm, weight_kg, target_weight_kg, target_timeline_weeks,
      fitness_experience, activity_level, dietary_preferences, meal_frequency,
      allergies, medical_conditions, physique_inspiration, preferred_workout_time,
      primary_goal, fitness_goal
    `)
    .eq('id', userId)
    .single()

  if (error || !userData) {
    throw new Error(`Failed to fetch user profile: ${error?.message || 'User not found'}`)
  }

  return {
    id: userData.id,
    age: userData.age,
    gender: userData.gender,
    height_cm: userData.height_cm,
    weight_kg: userData.weight_kg,
    target_weight_kg: userData.target_weight_kg,
    target_timeline_weeks: userData.target_timeline_weeks,
    fitness_experience: userData.fitness_experience,
    activity_level: userData.activity_level,
    dietary_preferences: userData.dietary_preferences,
    meal_frequency: userData.meal_frequency,
    allergies: userData.allergies || [],
    medical_conditions: userData.medical_conditions || [],
    physique_inspiration: userData.physique_inspiration || '',
    preferred_workout_time: userData.preferred_workout_time || '',
    target_calories: userData.target_calories || 2000,
    primary_goal: userData.primary_goal || '',
    fitness_goal: userData.fitness_goal || ''
  }
}

/**
 * Extracts streak and progress data
 */
async function getStreakData(supabase: any, userId: string): Promise<StreakData> {
  // Get current streak from day_completions table
  const { data: streakData } = await supabase
    .from('day_completions')
    .select('current_streak, longest_streak, last_workout_date, last_meal_completion, aura_points')
    .eq('user_id', userId)
    .single()

  // Get completion counts
  const { data: completionData } = await supabase
    .from('individual_completions')
    .select('completion_type')
    .eq('user_id', userId)

  const workoutCount = completionData?.filter(c => c.completion_type === 'workout').length || 0
  const mealCount = completionData?.filter(c => c.completion_type === 'meal').length || 0

  return {
    current_streak: streakData?.current_streak || 0,
    longest_streak: streakData?.longest_streak || 0,
    last_workout_date: streakData?.last_workout_date,
    last_meal_completion: streakData?.last_meal_completion,
    aura_points: streakData?.aura_points || 0,
    total_workouts_completed: workoutCount,
    total_meals_completed: mealCount
  }
}

/**
 * Extracts relevant plan data based on context
 */
async function getPlanData(supabase: any, userId: string, context?: any): Promise<PlanData | null> {
  const { data: planData, error } = await supabase
    .from('user_plans')
    .select('workout_plan, diet_plan')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !planData) {
    return null
  }

  return {
    workout_plan: planData.workout_plan || [],
    diet_plan: planData.diet_plan || []
  }
}

/**
 * Gets recent conversation history to understand context
 */
async function getRecentConversationHistory(supabase: any, userId: string, limit: number = 5): Promise<Array<{
  user_message: string
  coach_response: string
  intent: string
  context?: any
  created_at: string
}>> {
  try {
    const { data, error } = await supabase
      .from('coach_glow_chats')
      .select('user_message, coach_response, intent, context, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching conversation history:', error)
    return []
  }
}

/**
 * Analyzes conversation history to determine what meal the user is referring to
 */
function analyzeMealContextFromHistory(conversationHistory: any[], currentMessage: string): string | null {
  const messageLower = currentMessage.toLowerCase()
  
  // Check if user is referring to a previous meal
  const referenceKeywords = ['this meal', 'that meal', 'it', 'the meal', 'my meal', 'current meal', 'update it', 'apply it', 'change it']
  const hasReference = referenceKeywords.some(keyword => messageLower.includes(keyword))
  
  if (!hasReference) {
    return null
  }

  // Look through recent conversation history for meal mentions (most recent first)
  for (const chat of conversationHistory) {
    const userMessage = chat.user_message.toLowerCase()
    const coachResponse = chat.coach_response.toLowerCase()
    
    // Check if previous messages mentioned specific meals
    const mealKeywords = ['breakfast', 'lunch', 'dinner', 'snack']
    for (const mealType of mealKeywords) {
      if (userMessage.includes(mealType) || coachResponse.includes(mealType)) {
        console.log(`🍽️ Found meal reference in history: ${mealType} from message: "${userMessage}"`)
        return mealType
      }
    }
    
    // Check context from previous messages
    if (chat.context?.mealType) {
      console.log(`🍽️ Found meal type from context: ${chat.context.mealType}`)
      return chat.context.mealType
    }
  }
  
  return null
}

/**
 * Creates motivation/accountability prompt
 */
function createMotivationPrompt(userProfile: UserProfile, streakData: StreakData, message: string): string {
  return `You are Coach Glow, a supportive fitness and wellness AI coach. You are empathetic, encouraging, and motivational. You help users stay accountable and motivated on their fitness journey.

**User Profile:**
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Goal: ${userProfile.primary_goal} (${userProfile.fitness_goal})
- Current Weight: ${userProfile.weight_kg}kg
- Target Weight: ${userProfile.target_weight_kg}kg
- Timeline: ${userProfile.target_timeline_weeks} weeks
- Fitness Level: ${userProfile.fitness_experience}
- Activity Level: ${userProfile.activity_level}
- Dietary Preference: ${userProfile.dietary_preferences}

**Current Progress:**
- Current Streak: ${streakData.current_streak} days
- Longest Streak: ${streakData.longest_streak} days
- Aura Points: ${streakData.aura_points}
- Total Workouts Completed: ${streakData.total_workouts_completed}
- Total Meals Completed: ${streakData.total_meals_completed}
- Last Workout: ${streakData.last_workout_date || 'No recent workouts'}
- Last Meal Completion: ${streakData.last_meal_completion || 'No recent meals'}

**User Message:** "${message}"

**Instructions:**
- Respond with empathy and understanding
- Provide actionable advice and encouragement
- Acknowledge their progress and achievements
- Help them overcome obstacles
- Keep responses conversational and supportive
- Do not mention being an AI
- Keep response under 200 words
- Use their name or "champion" to personalize

Respond as Coach Glow:`
}

/**
 * Creates plan swap prompt
 */
function createPlanSwapPrompt(userProfile: UserProfile, planData: PlanData, message: string, context?: any, conversationHistory?: any[]): string {
  const currentDay = context?.currentDay || getCurrentDay()
  const mealType = context?.mealType || 'meal'
  const workoutType = context?.workoutType || 'workout'

  // Extract relevant plan section with better meal detection
  let relevantPlan = ''
  let allMealsInfo = ''
  
  if (mealType !== 'workout') {
    const dayPlan = planData.diet_plan.find((day: any) => 
      day.day.toLowerCase() === currentDay.toLowerCase()
    )
    
    if (dayPlan) {
      // First, try to find the specific meal mentioned in the message
      const messageLower = message.toLowerCase()
      let specificMeal = null
      
      // Look for meal type keywords in the message
      const mealKeywords = ['breakfast', 'lunch', 'dinner', 'snack', 'meal']
      for (const keyword of mealKeywords) {
        if (messageLower.includes(keyword)) {
          specificMeal = dayPlan.meals.find((m: any) => 
            m.meal.toLowerCase().includes(keyword)
          )
          if (specificMeal) break
        }
      }
      
      // If no specific meal found, use the context mealType
      if (!specificMeal) {
        specificMeal = dayPlan.meals.find((m: any) => 
          m.meal.toLowerCase().includes(mealType.toLowerCase())
        )
      }
      
      if (specificMeal) {
        const meal = specificMeal as any
        relevantPlan = `Current ${meal.meal}: ${meal.description} (${meal.kcal} kcal)`
        if (meal.protein_g) relevantPlan += ` | Protein: ${meal.protein_g}g`
        if (meal.carbs_g) relevantPlan += ` | Carbs: ${meal.carbs_g}g`
        if (meal.fat_g) relevantPlan += ` | Fat: ${meal.fat_g}g`
        if (meal.ingredients) relevantPlan += ` | Ingredients: ${meal.ingredients.join(', ')}`
      }
      
      // Also provide all meals for context
      allMealsInfo = `\n\n**All meals for ${currentDay}:**\n`
      dayPlan.meals.forEach((meal: any) => {
        allMealsInfo += `- ${meal.meal}: ${meal.description} (${meal.kcal} kcal)`
        if (meal.protein_g) allMealsInfo += ` | Protein: ${meal.protein_g}g`
        if (meal.carbs_g) allMealsInfo += ` | Carbs: ${meal.carbs_g}g`
        if (meal.fat_g) allMealsInfo += ` | Fat: ${meal.fat_g}g`
        allMealsInfo += '\n'
      })
    }
  } else {
    const dayPlan = planData.workout_plan.find((day: any) => 
      day.day.toLowerCase() === currentDay.toLowerCase()
    )
    if (dayPlan) {
      relevantPlan = `Current workout: ${JSON.stringify(dayPlan.routine)}`
    }
  }

  // Build conversation context
  let conversationContext = ''
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = '\n\n**Recent Conversation Context:**\n'
    conversationHistory.slice(0, 3).forEach((chat, index) => {
      conversationContext += `User: "${chat.user_message}"\n`
      conversationContext += `Coach: "${chat.coach_response}"\n\n`
    })
  }

  return `You are Coach Glow, a fitness and nutrition expert. Help users modify their meal or workout plans while maintaining their goals.

**User Profile:**
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Goal: ${userProfile.primary_goal} (${userProfile.fitness_goal})
- Dietary Preference: ${userProfile.dietary_preferences}
- Allergies: ${userProfile.allergies.join(', ') || 'None'}
- Target Calories: ${userProfile.target_calories} kcal/day
- Fitness Level: ${userProfile.fitness_experience}
- Activity Level: ${userProfile.activity_level}

**Current Plan Context:**
${relevantPlan}${allMealsInfo}${conversationContext}

**User Request:** "${message}"

**Instructions:**
- CRITICAL: Use the conversation history to understand what meal the user is referring to when they say "this meal", "that meal", "it", "update it", "apply it", etc.
- If the user is asking about a specific meal (like "what is this meal" or "tell me about my snack"), provide detailed information about that meal including calories, macros, and ingredients. DO NOT suggest alternatives unless explicitly requested.
- If requesting meal change: Suggest a replacement meal that matches calories/macros and dietary preferences
- If requesting workout change: Suggest alternative exercises matching their fitness level
- ALWAYS reference the specific meal the user is asking about based on conversation context - do not confuse different meals
- Only suggest alternatives when the user explicitly asks for changes, swaps, or alternatives
- Ensure suggestions align with their goals and constraints
- Provide specific details (ingredients, instructions, or exercise form)
- Keep response focused and actionable
- Do not mention being an AI
- When suggesting updates, make sure you're referring to the correct meal from the conversation history

**IMPORTANT FOR MEAL SUGGESTIONS:**
When suggesting a meal replacement, format your response as:
Meal: [meal name]
Description: [detailed description]
Calories: [number] kcal
Protein: [number]g
Carbs: [number]g
Fat: [number]g
Ingredients: [comma-separated list]

Respond with the specific information or replacement:`
}

/**
 * Creates general fitness query prompt
 */
function createGeneralPrompt(userProfile: UserProfile, message: string): string {
  return `You are Coach Glow, a trusted fitness and nutrition expert. Answer user questions with personalized advice based on their profile.

**User Profile:**
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Goal: ${userProfile.primary_goal} (${userProfile.fitness_goal})
- Current Weight: ${userProfile.weight_kg}kg
- Target Weight: ${userProfile.target_weight_kg}kg
- Timeline: ${userProfile.target_timeline_weeks} weeks
- Fitness Level: ${userProfile.fitness_experience}
- Activity Level: ${userProfile.activity_level}
- Dietary Preference: ${userProfile.dietary_preferences}
- Allergies: ${userProfile.allergies.join(', ') || 'None'}

**User Question:** "${message}"

**Instructions:**
- Provide clear, accurate, and personalized advice
- Consider their specific goals, fitness level, and dietary preferences
- Keep responses conversational and friendly
- Provide actionable tips when appropriate
- Do not mention being an AI
- Keep response under 300 words

Respond as Coach Glow:`
}

/**
 * Calls Gemini API with the constructed prompt
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  console.log('🤖 Calling Gemini API for Coach Glow response')

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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('❌ Gemini API error:', errorData)
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API')
  }

  const generatedText = data.candidates[0].content.parts[0].text
  console.log('✅ Coach Glow response generated successfully')

  return generatedText.trim()
}

/**
 * Extracts specific meal or workout from plan based on context
 */
function extractRelevantPlanSection(planData: PlanData, context: any): any {
  const currentDay = context?.currentDay || getCurrentDay()
  const mealType = context?.mealType
  const workoutType = context?.workoutType

  if (mealType && mealType !== 'workout') {
    // Extract meal
    const dayPlan = planData.diet_plan.find((day: any) => 
      day.day.toLowerCase() === currentDay.toLowerCase()
    )
    if (dayPlan) {
      const meal = dayPlan.meals.find((m: any) => 
        m.meal.toLowerCase().includes(mealType.toLowerCase())
      )
      return { type: 'meal', data: meal, day: currentDay }
    }
  } else if (workoutType || mealType === 'workout') {
    // Extract workout
    const dayPlan = planData.workout_plan.find((day: any) => 
      day.day.toLowerCase() === currentDay.toLowerCase()
    )
    if (dayPlan) {
      return { type: 'workout', data: dayPlan.routine, day: currentDay }
    }
  }

  return null
}

/**
 * Gets current day name
 */
function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

/**
 * Updates user plan with new meal or workout
 */
async function updateUserPlan(
  supabase: any,
  userId: string,
  planSection: any,
  newContent: any
): Promise<void> {
  try {
    const { data: currentPlan } = await supabase
      .from('user_plans')
      .select('workout_plan, diet_plan')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!currentPlan) {
      throw new Error('No active plan found')
    }

    let updatedPlan = { ...currentPlan }

    if (planSection.type === 'meal') {
      // Update meal in diet plan
      const dayIndex = updatedPlan.diet_plan.findIndex((day: any) => 
        day.day.toLowerCase() === planSection.day.toLowerCase()
      )
      
      if (dayIndex !== -1) {
        const mealIndex = updatedPlan.diet_plan[dayIndex].meals.findIndex((meal: any) => 
          meal.meal.toLowerCase().includes(planSection.data.meal.toLowerCase())
        )
        
        if (mealIndex !== -1) {
          updatedPlan.diet_plan[dayIndex].meals[mealIndex] = {
            ...updatedPlan.diet_plan[dayIndex].meals[mealIndex],
            ...newContent,
            swapped_at: new Date().toISOString()
          }
        }
      }
    } else if (planSection.type === 'workout') {
      // Update workout in workout plan
      const dayIndex = updatedPlan.workout_plan.findIndex((day: any) => 
        day.day.toLowerCase() === planSection.day.toLowerCase()
      )
      
      if (dayIndex !== -1) {
        updatedPlan.workout_plan[dayIndex] = {
          ...updatedPlan.workout_plan[dayIndex],
          routine: newContent,
          swapped_at: new Date().toISOString()
        }
      }
    }

    // Update the plan in database
    await supabase
      .from('user_plans')
      .update({
        diet_plan: updatedPlan.diet_plan,
        workout_plan: updatedPlan.workout_plan,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    console.log(`✅ Updated ${planSection.type} for user ${userId}`)
  } catch (error) {
    console.error('Failed to update user plan:', error)
    throw error
  }
}

/**
 * Logs chat interaction for tracking and personalization
 */
async function logChatInteraction(
  supabase: any, 
  userId: string, 
  message: string, 
  response: string, 
  intent: string,
  context?: any,
  responseTime?: number
): Promise<void> {
  try {
    await supabase
      .from('coach_glow_chats')
      .insert({
        user_id: userId,
        user_message: message,
        coach_response: response,
        intent: intent,
        context: context,
        response_time_ms: responseTime,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log chat interaction:', error)
    // Don't throw error as this is not critical
  }
}

/**
 * Main Coach Glow handler
 */
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
    const { userId, message, context, conversationHistory }: CoachGlowRequest = await req.json()

    if (!userId || !message) {
      return new Response(
        JSON.stringify({ error: 'userId and message are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`💬 Coach Glow request from user ${userId}: "${message}"`)

    // Get recent conversation history if not provided
    let recentHistory = conversationHistory || await getRecentConversationHistory(supabase, userId, 5)

    // Detect intent
    const intent = detectIntent(message)
    console.log(`🎯 Detected intent: ${intent}`)

    // Get user profile
    const userProfile = await getUserProfile(supabase, userId)

    // Get streak data for motivation context
    const streakData = await getStreakData(supabase, userId)

    // Get plan data if needed for swaps or meal questions
    let planData: PlanData | null = null
    if (intent === 'plan_swap' || intent === 'general') {
      planData = await getPlanData(supabase, userId, context)
    }

    // Enhance context based on message content and conversation history for better meal detection
    let enhancedContext = { ...context }
    if (planData && (intent === 'plan_swap' || intent === 'general')) {
      const messageLower = message.toLowerCase()
      const mealKeywords = ['breakfast', 'lunch', 'dinner', 'snack', 'meal']
      
      // First, try to detect meal type from conversation history
      const mealFromHistory = analyzeMealContextFromHistory(recentHistory, message)
      if (mealFromHistory) {
        enhancedContext.mealType = mealFromHistory
        console.log(`🍽️ Detected meal type from conversation history: ${mealFromHistory}`)
      } else {
        // Fallback to detecting from current message
        for (const keyword of mealKeywords) {
          if (messageLower.includes(keyword)) {
            enhancedContext.mealType = keyword
            break
          }
        }
        
        // If no specific meal type detected but asking about meals, default to 'meal'
        if (!enhancedContext.mealType && (messageLower.includes('meal') || messageLower.includes('food') || messageLower.includes('eat'))) {
          enhancedContext.mealType = 'meal'
        }
      }
    }

    // Start timing for response
    const startTime = Date.now()

    // Create appropriate prompt based on intent
    let prompt: string
    let planSection: any = null
    
    switch (intent) {
      case 'motivation':
        prompt = createMotivationPrompt(userProfile, streakData, message)
        break
      case 'plan_swap':
        if (!planData) {
          throw new Error('No active plan found for user')
        }
        planSection = extractRelevantPlanSection(planData, enhancedContext)
        prompt = createPlanSwapPrompt(userProfile, planData, message, enhancedContext, recentHistory)
        break
      case 'general':
        // If asking about meals, use plan swap prompt for better context
        if (planData && enhancedContext.mealType) {
          planSection = extractRelevantPlanSection(planData, enhancedContext)
          prompt = createPlanSwapPrompt(userProfile, planData, message, enhancedContext, recentHistory)
        } else {
          prompt = createGeneralPrompt(userProfile, message)
        }
        break
      default:
        prompt = createGeneralPrompt(userProfile, message)
    }

    // Call Gemini API
    const coachResponse = await callGeminiAPI(prompt)
    const responseTime = Date.now() - startTime

    // Handle plan modifications if this is a swap request
    let actionRequired: any = undefined
    if (intent === 'plan_swap' && planSection) {
      // Only set actionRequired if the response actually contains a suggestion
      // Check if the response contains words that indicate a suggestion/alternative
      const responseLower = coachResponse.toLowerCase()
      const suggestionKeywords = ['suggest', 'recommend', 'alternative', 'instead', 'try', 'replace', 'swap']
      const hasSuggestion = suggestionKeywords.some(keyword => responseLower.includes(keyword))
      
      if (hasSuggestion) {
        actionRequired = {
          type: planSection.type === 'meal' ? 'meal_swap' : 'workout_swap',
          data: {
            current: planSection.data,
            suggested: coachResponse,
            day: planSection.day,
            mealType: enhancedContext.mealType || planSection.data?.meal || 'meal'
          }
        }
      }
    }

    // Log the interaction
    await logChatInteraction(supabase, userId, message, coachResponse, intent, context, responseTime)

    // Prepare response
    const response: CoachGlowResponse = {
      success: true,
      response: coachResponse,
      intent: intent,
      action_required: actionRequired
    }

    console.log(`✅ Coach Glow response sent successfully`)

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
    console.error('❌ Error in Coach Glow function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
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
