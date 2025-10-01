import { supabase } from './supabase'

export interface CoachGlowMessage {
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

export interface CoachGlowResponse {
  success: boolean
  response: string
  intent: 'motivation' | 'plan_swap' | 'general'
  action_required?: {
    type: 'meal_swap' | 'workout_swap' | 'plan_update'
    data?: any
  }
  error?: string
}

export interface ApplySwapRequest {
  userId: string
  swapType: 'meal' | 'workout'
  day: string
  mealType?: string
  newContent: any
}

export interface ApplySwapResponse {
  success: boolean
  message: string
  error?: string
}

export interface ChatHistory {
  id: string
  user_message: string
  coach_response: string
  intent: string
  context?: any
  created_at: string
}

/**
 * Sends a message to Coach Glow and gets a response
 */
export async function sendMessageToCoachGlow(
  message: CoachGlowMessage
): Promise<CoachGlowResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('coach-glow', {
      body: message
    })

    // Check if the response contains a user-friendly error message
    if (data && !data.success && data.error) {
      throw new Error(data.error)
    }

    if (error) {
      // Provide a user-friendly error message instead of technical details
      throw new Error('I had trouble connecting. Please try again in a moment.')
    }

    return data as CoachGlowResponse
  } catch (error) {
    
    throw error
  }
}

/**
 * Applies a plan swap when user confirms the change
 */
export async function applyPlanSwap(
  swapRequest: ApplySwapRequest
): Promise<ApplySwapResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('apply-plan-swap', {
      body: swapRequest
    })

    // Check if the response contains a user-friendly error message
    if (data && !data.success && data.error) {
      throw new Error(data.error)
    }

    if (error) {
      // Provide a user-friendly error message instead of technical details
      throw new Error('I had trouble updating your plan. Please try again.')
    }

    return data as ApplySwapResponse
  } catch (error) {
    
    throw error
  }
}

/**
 * Gets recent chat history with Coach Glow (last 30 days)
 */
export async function getCoachGlowChatHistory(
  userId: string,
  limit: number = 20
): Promise<ChatHistory[]> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('coach_glow_chats')
      .select('id, user_message, coach_response, intent, context, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch chat history: ${error.message}`)
    }

    // Reverse to get chronological order (oldest first) for proper display
    return (data || []).reverse()
  } catch (error) {
    
    throw error
  }
}

/**
 * Gets chat history for a specific intent (motivation, plan_swap, general)
 */
export async function getCoachGlowChatHistoryByIntent(
  userId: string,
  intent: 'motivation' | 'plan_swap' | 'general',
  limit: number = 10
): Promise<ChatHistory[]> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('coach_glow_chats')
      .select('id, user_message, coach_response, intent, context, created_at')
      .eq('user_id', userId)
      .eq('intent', intent)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch chat history: ${error.message}`)
    }

    // Reverse to get chronological order (oldest first) for proper display
    return (data || []).reverse()
  } catch (error) {
    
    throw error
  }
}

/**
 * Helper function to create context for meal-related queries
 */
export function createMealContext(
  currentDay?: string,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
) {
  return {
    currentDay: currentDay || getCurrentDay(),
    mealType: mealType
  }
}

/**
 * Helper function to create context for workout-related queries
 */
export function createWorkoutContext(currentDay?: string) {
  return {
    currentDay: currentDay || getCurrentDay(),
    workoutType: 'workout'
  }
}

/**
 * Gets current day name
 */
function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

/**
 * Helper function to detect if a message is likely a plan swap request
 */
export function isPlanSwapRequest(message: string): boolean {
  const planSwapKeywords = [
    'change', 'swap', 'replace', 'different', 'instead', 'modify', 'update',
    'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'food', 'eat',
    'workout', 'exercise', 'routine', 'training', 'gym', 'cardio', 'strength',
    'don\'t like', 'hate', 'dislike', 'boring', 'tired of', 'new', 'alternative'
  ]
  
  const lowerMessage = message.toLowerCase()
  return planSwapKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Helper function to detect if a message is likely a motivation request
 */
export function isMotivationRequest(message: string): boolean {
  const motivationKeywords = [
    'motivated', 'motivation', 'unmotivated', 'quitting', 'give up', 'struggling',
    'hard', 'difficult', 'tired', 'exhausted', 'burned out', 'frustrated',
    'progress', 'stuck', 'plateau', 'losing', 'gained weight', 'missed workout',
    'skipped', 'cheat day', 'binge', 'fell off', 'consistency', 'streak',
    'encourage', 'support', 'help', 'advice', 'tips', 'stuck'
  ]
  
  const lowerMessage = message.toLowerCase()
  return motivationKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Example usage functions for common scenarios
 */

/**
 * Ask Coach Glow for motivation and encouragement
 */
export async function askForMotivation(
  userId: string,
  message: string
): Promise<CoachGlowResponse> {
  return sendMessageToCoachGlow({
    userId,
    message,
    context: undefined
  })
}

/**
 * Ask Coach Glow to swap a meal
 */
export async function askForMealSwap(
  userId: string,
  message: string,
  day?: string,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<CoachGlowResponse> {
  return sendMessageToCoachGlow({
    userId,
    message,
    context: createMealContext(day, mealType)
  })
}

/**
 * Ask Coach Glow to swap a workout
 */
export async function askForWorkoutSwap(
  userId: string,
  message: string,
  day?: string
): Promise<CoachGlowResponse> {
  return sendMessageToCoachGlow({
    userId,
    message,
    context: createWorkoutContext(day)
  })
}

/**
 * Ask Coach Glow a general fitness question
 */
export async function askGeneralQuestion(
  userId: string,
  message: string
): Promise<CoachGlowResponse> {
  return sendMessageToCoachGlow({
    userId,
    message,
    context: undefined
  })
}
