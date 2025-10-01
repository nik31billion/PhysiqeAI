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
  intent: 'coach' // Simplified - Gemini handles all intents naturally
  error?: string
}

// Remove all keyword-based intent detection - let Gemini handle context naturally

/**
 * Validates user message for edge cases
 */
function validateUserMessage(message: string): { isValid: boolean; issue?: string; sanitizedMessage?: string } {
  // Check for empty or extremely short messages
  if (!message || message.trim().length === 0) {
    return { isValid: false, issue: 'Empty message' }
  }
  
  if (message.trim().length < 2) {
    return { isValid: false, issue: 'Message too short' }
  }
  
  // Check for extremely long messages (potential spam or abuse)
  if (message.length > 2000) {
    return { isValid: false, issue: 'Message too long' }
  }
  
  // Check for repetitive characters or spam-like behavior
  const hasRepetitiveChars = /(.)\1{10,}/.test(message) // same character 10+ times
  const hasExcessiveCaps = message.replace(/[^A-Z]/g, '').length > message.length * 0.8 && message.length > 20
  
  if (hasRepetitiveChars || hasExcessiveCaps) {
    return { isValid: false, issue: 'Spam-like behavior detected' }
  }
  
  // Sanitize message (remove excessive whitespace, normalize)
  const sanitizedMessage = message
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s.,!?'-]/gi, '') // Remove special characters except basic punctuation
  
  return { isValid: true, sanitizedMessage }
}

// No more intent detection - let Gemini naturally understand the context and respond appropriately

/**
 * Checks for rate limiting to prevent spam/abuse
 */
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean; waitTime?: number }> {
  try {
    // Get user's recent message count in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    
    const { data, error } = await supabase
      .from('coach_glow_chats')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo)
    
    if (error) {
      console.log('Rate limit check failed, allowing request:', error.message)
      return { allowed: true }
    }
    
    const recentMessageCount = data?.length || 0
    const maxMessagesPerMinute = 10 // Reasonable limit
    
    if (recentMessageCount >= maxMessagesPerMinute) {
      const waitTime = 60 // seconds to wait
      console.log(`Rate limit exceeded for user ${userId}: ${recentMessageCount} messages in last minute`)
      return { allowed: false, waitTime }
    }
    
    return { allowed: true }
  } catch (error) {
    console.log('Rate limit check error, allowing request:', error)
    return { allowed: true }
  }
}

/**
 * Extracts user profile data from database with better error handling
 */
async function getUserProfile(supabase: any, userId: string): Promise<UserProfile> {
  const { data: userData, error } = await supabase
    .from('user_profiles')
    .select(`
      id, age, gender, height_cm, weight_kg, target_weight_kg, target_timeline_weeks,
      fitness_experience, activity_level, dietary_preferences, meal_frequency,
      allergies, medical_conditions, physique_inspiration, preferred_workout_time,
      primary_goal, fitness_goal, target_calories
    `)
    .eq('id', userId)
    .single()

  if (error || !userData) {
    throw new Error(`Failed to fetch user profile: ${error?.message || 'User not found'}`)
  }

  // Validate and provide sensible defaults for essential fields
  const currentWeight = Math.max(30, Math.min(300, userData.weight_kg || 70))
  const targetWeight = Math.max(30, Math.min(300, userData.target_weight_kg || currentWeight))
  
  const profile: UserProfile = {
    id: userData.id,
    age: Math.max(13, Math.min(100, userData.age || 25)), // Age between 13-100, default 25
    gender: userData.gender || 'Not specified',
    height_cm: Math.max(100, Math.min(250, userData.height_cm || 170)), // Height between 100-250cm, default 170
    weight_kg: currentWeight, // Current/starting weight
    target_weight_kg: targetWeight, // Goal/target weight
    target_timeline_weeks: Math.max(1, Math.min(104, userData.target_timeline_weeks || 12)), // 1-104 weeks, default 12
    fitness_experience: userData.fitness_experience || 'Beginner',
    activity_level: userData.activity_level || 'Moderate',
    dietary_preferences: userData.dietary_preferences || 'No specific preference',
    meal_frequency: userData.meal_frequency || '3 meals + snacks',
    allergies: Array.isArray(userData.allergies) ? userData.allergies : [],
    medical_conditions: Array.isArray(userData.medical_conditions) ? userData.medical_conditions : [],
    physique_inspiration: userData.physique_inspiration || '',
    preferred_workout_time: userData.preferred_workout_time || 'Flexible',
    target_calories: Math.max(1200, Math.min(5000, userData.target_calories || 2000)), // 1200-5000 calories, default 2000
    primary_goal: userData.primary_goal || 'General fitness',
    fitness_goal: userData.fitness_goal || 'Stay healthy'
  }

  // Log weight data for debugging hallucinations
  console.log(`Coach Glow: User ${userId} weight data - Current: ${currentWeight}kg, Target: ${targetWeight}kg, Direction: ${targetWeight > currentWeight ? 'GAIN' : 'LOSE'} (${Math.abs(targetWeight - currentWeight)}kg difference)`)

  // Log if any defaults were used (for debugging)
  if (!userData.age || !userData.height_cm || !userData.weight_kg) {
    console.log(`Using default values for user ${userId}: age=${userData.age ? 'provided' : 'default'}, height=${userData.height_cm ? 'provided' : 'default'}, weight=${userData.weight_kg ? 'provided' : 'default'}`)
  }

  return profile
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
      
      return []
    }

    return data || []
  } catch (error) {
    
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
        
        return mealType
      }
    }
    
    // Check context from previous messages
    if (chat.context?.mealType) {
      
      return chat.context.mealType
    }
  }
  
  return null
}

/**
 * Creates comprehensive Coach Glow prompt that handles all scenarios
 */
function createCoachPrompt(userProfile: UserProfile, streakData: StreakData, planData: PlanData | null, message: string, conversationHistory: any[], context?: any): string {
  const currentDay = context?.currentDay || getCurrentDay()
  
  // Build conversation context - include more messages for better context
  let conversationContext = ''
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = '\n\nRecent conversation:\n'
    conversationHistory.slice(-8).forEach((chat) => {
      conversationContext += `You: "${chat.user_message}"\nCoach: "${chat.coach_response}"\n\n`
    })
  }

  // Build plan context if available
  let planContext = ''
  if (planData) {
    const dayPlan = planData.diet_plan?.find((day: any) => 
      day.day.toLowerCase() === currentDay.toLowerCase()
    )
    if (dayPlan) {
      planContext = `\n\nToday's meals (${currentDay}):\n`
      dayPlan.meals.forEach((meal: any) => {
        planContext += `• ${meal.meal}: ${meal.description} (${meal.kcal} kcal)\n`
      })
    }

    const workoutPlan = planData.workout_plan?.find((day: any) => 
      day.day.toLowerCase() === currentDay.toLowerCase()
    )
    if (workoutPlan) {
      planContext += `\n\nToday's workout: ${workoutPlan.routine?.map((ex: any) => ex.name || ex.exercise).join(', ') || 'Rest day'}\n`
    }
  }

  return `You are Coach Glow, a supportive and motivational fitness coach. You help users achieve their fitness goals through encouragement, practical advice, and problem-solving.

User Profile:
• Name: Coach calls them "champion" or uses encouraging terms
• Age: ${userProfile.age}, Gender: ${userProfile.gender}
• Primary Goal: ${userProfile.primary_goal} (${userProfile.fitness_goal})
• Current Weight: ${userProfile.weight_kg}kg → Goal Weight: ${userProfile.target_weight_kg}kg
• Weight Journey: ${userProfile.target_weight_kg > userProfile.weight_kg ? 'GAINING WEIGHT' : 'LOSING WEIGHT'} (${Math.abs(userProfile.target_weight_kg - userProfile.weight_kg)}kg to go)
• Timeline: ${userProfile.target_timeline_weeks} weeks
• Fitness Level: ${userProfile.fitness_experience}
• Activity Level: ${userProfile.activity_level}
• Diet: ${userProfile.dietary_preferences}
• Target Calories: ${userProfile.target_calories} kcal/day
• Allergies: ${userProfile.allergies.join(', ') || 'None'}

Current Progress:
• Current Streak: ${streakData.current_streak} days
• Longest Streak: ${streakData.longest_streak} days
• Total Workouts: ${streakData.total_workouts_completed}
• Total Meals Completed: ${streakData.total_meals_completed}${planContext}${conversationContext}

User Message: "${message}"

COACHING GUIDELINES:
• BE MOTIVATIONAL: When users express doubts, lack of motivation, or problems with workouts/meals - actively coach and encourage them
• PROBLEM-SOLVING: If they don't want to workout, suggest alternatives, remind them of goals, provide motivation
• USE CONTEXT: ALWAYS reference the conversation history above. If user says "ok yeah do that" or similar, refer back to what was discussed in the recent conversation
• BE SUPPORTIVE: Acknowledge struggles but help them move forward with practical solutions
• MAINTAIN CONTEXT: Remember what you suggested in previous messages and what the user agreed to or asked for
• MEAL/WORKOUT SUGGESTIONS: When suggesting meal or workout changes, provide COMPLETE details:
  - For meals: Include exact calories, protein/carbs/fat grams, ingredients, and preparation instructions
  - For workouts: Match the workout type (full body, push day, pull day, etc.) and include sets/reps/rest
• RESPONSE LENGTH: Match the need - brief for simple questions (2-3 lines), longer for suggestions (5-10 lines)
• NEVER claim weight progress without actual data - their goal weight is TARGET, not achievement
• Don't use excessive formatting - keep it conversational and natural
• Don't say "Coach Glow here" - just respond as their supportive coach

Examples of good responses:
- User: "I don't want to workout" → Motivate them, remind them of goals, suggest easier alternatives
- User: "Thanks" → "You're welcome! Anything else I can help with?"
- User: "What's this meal?" → Explain the meal from their plan with calories/macros
- User: "Can I change my breakfast?" → Provide complete alternative with calories, macros, ingredients, and prep
- User: "ok yeah do that" → Reference what was discussed in recent conversation and proceed with that suggestion

Respond as their encouraging, solution-focused fitness coach:`
}

// Removed old complex prompt functions - using single comprehensive coach prompt

// Removed all old prompt functions - using single comprehensive createCoachPrompt

/**
 * Validates and cleans AI-generated responses
 */
function validateAndCleanResponse(response: string): string {
  // Check for empty or extremely short responses
  if (!response || response.length < 10) {
    return "I'm here to help! Could you please rephrase your question? I want to make sure I give you the best guidance possible."
  }
  
  // Check for extremely long responses (likely hallucination or error)
  if (response.length > 5000) {
    return response.substring(0, 4500) + "... Let me know if you need more specific information about any part of this!"
  }
  
  // Check for AI self-references and clean them
  const aiReferences = [
    /as an ai/gi,
    /i am an ai/gi,
    /i'm an ai/gi,
    /artificial intelligence/gi,
    /language model/gi,
    /trained by/gi,
    /created by/gi
  ]
  
  let cleanedResponse = response
  aiReferences.forEach(pattern => {
    cleanedResponse = cleanedResponse.replace(pattern, '')
  })
  
  // Remove "Coach Glow here!" as it's redundant - user already knows who's responding
  cleanedResponse = cleanedResponse.replace(/^Coach Glow here!\s*/i, '')
  
  // Remove all star/asterisk formatting to prevent ** text ** appearance
  cleanedResponse = cleanedResponse.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
  
  // Remove bullet points and formatting symbols
  cleanedResponse = cleanedResponse.replace(/^[•*-]\s*/gm, '')
  
  // Clean up excessive spacing and line breaks
  cleanedResponse = cleanedResponse.replace(/\n\s*\n/g, '\n').trim()
  
  // Allow longer responses for detailed meal/workout suggestions
  // No artificial line limits - let CoachGlow provide complete information
  
  return cleanedResponse.trim()
}

/**
 * Calls Gemini API with the constructed prompt - tries multiple model versions for reliability
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  // Use FASTEST proven models - prioritize speed over newest version
  // Based on testing: gemini-2.0-flash responded instantly
  const modelVersions = [
    'gemini-2.0-flash',        // ✅ FASTEST - Instant response
    'gemini-flash-latest',     // ✅ FAST - Good response time
    'gemini-2.5-flash',        // ✅ Works but slower - fallback only
  ];

  let lastError: Error | null = null;

  for (const model of modelVersions) {
    try {
      console.log(`Coach Glow: Attempting to call ${model}...`);
      
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
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 600, // Balanced limit for detailed responses without timeouts
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = `${model} API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        console.log(`Coach Glow: ${errorMessage}`)
        lastError = new Error(errorMessage)
        continue // Try next model
      }

      console.log(`Coach Glow: Successfully connected to ${model}`)
      const data = await response.json()

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        const errorMessage = `Invalid response from ${model} API`
        console.log(`Coach Glow: ${errorMessage}`)
        lastError = new Error(errorMessage)
        continue // Try next model
      }

      const generatedText = data.candidates[0].content.parts[0].text
      console.log(`Coach Glow: ${model} generated response successfully`)
      console.log(`Coach Glow: Response length: ${generatedText.length} characters`)
      
      // Validate the generated response for appropriateness
      const cleanedResponse = validateAndCleanResponse(generatedText.trim())
      return cleanedResponse
      
    } catch (error) {
      console.log(`Coach Glow: Error with ${model}:`, error.message)
      lastError = error instanceof Error ? error : new Error(String(error))
      continue // Try next model
    }
  }

  // If all models failed, throw the last error
  throw lastError || new Error('All Gemini model versions failed')
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

    
  } catch (error) {
    
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
    
    // Don't throw error as this is not critical
  }
}

/**
 * Main Coach Glow handler
 */
serve(async (req) => {
  console.log(`Coach Glow: Received ${req.method} request`)
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

    // Validate user message
    const validation = validateUserMessage(message)
    if (!validation.isValid) {
      console.log(`Message validation failed for user ${userId}: ${validation.issue}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.issue === 'Spam-like behavior detected' 
            ? "I'm here to help with your fitness and nutrition goals! Let's focus on that."
            : "Please provide a clear message so I can assist you better.",
          intent: 'general'
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(supabase, userId)
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for user ${userId}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Please wait ${rateLimitCheck.waitTime} seconds before sending another message. This helps me provide better responses!`,
          intent: 'general'
        }),
        {
          status: 429, // Too Many Requests
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': rateLimitCheck.waitTime?.toString() || '60'
          },
        }
      )
    }

    // Use sanitized message
    const sanitizedMessage = validation.sanitizedMessage || message

    

    // Get recent conversation history if not provided - increase to 10 messages for better context
    let recentHistory = conversationHistory || await getRecentConversationHistory(supabase, userId, 10)
    console.log(`Coach Glow: Conversation history length: ${recentHistory.length}`)
    if (recentHistory.length > 0) {
      console.log(`Coach Glow: Last user message: "${recentHistory[recentHistory.length - 1]?.user_message}"`)
      console.log(`Coach Glow: Last coach response: "${recentHistory[recentHistory.length - 1]?.coach_response}"`)
    }

    // No more intent detection - let Gemini handle everything naturally
    const intent = 'coach' // Simplified

    // Get user profile
    const userProfile = await getUserProfile(supabase, userId)

    // Get streak data for context
    const streakData = await getStreakData(supabase, userId)

    // Always get plan data for full context
    const planData = await getPlanData(supabase, userId, context)

    // Start timing for response
    const startTime = Date.now()

    // Use single comprehensive prompt that handles all scenarios
    const prompt = createCoachPrompt(userProfile, streakData, planData, sanitizedMessage, recentHistory, context)

    // Call Gemini API
    console.log(`Coach Glow: Starting API call for user ${userId}`)
    const coachResponse = await callGeminiAPI(prompt)
    const responseTime = Date.now() - startTime
    console.log(`Coach Glow: API call completed in ${responseTime}ms, response length: ${coachResponse.length}`)

    // No more action_required - CoachGlow provides complete suggestions directly in response

    // Log the interaction (use original message for logging purposes, but note if it was sanitized)
    const logContext = { 
      ...context, 
      wasSanitized: sanitizedMessage !== message,
      originalLength: message.length,
      sanitizedLength: sanitizedMessage.length 
    }
    await logChatInteraction(supabase, userId, sanitizedMessage, coachResponse, intent, logContext, responseTime)

    // Prepare response
    const response: CoachGlowResponse = {
      success: true,
      response: coachResponse,
      intent: intent
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
    console.log(`Coach Glow: Error occurred:`, error)
    console.log(`Coach Glow: Error stack:`, error.stack)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'I encountered an issue while processing your request. Please try again in a moment.'
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

