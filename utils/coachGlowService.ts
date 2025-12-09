import { supabase } from './supabase'
import { captureException, addBreadcrumb, startTransaction } from './sentryConfig'

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
  const transaction = startTransaction('coach_glow_chat', 'api.call');
  const startTime = Date.now();
  
  try {
    addBreadcrumb('Sending message to Coach Glow', 'coach_glow', {
      userId: message.userId,
      messageLength: message.message.length,
      hasContext: !!message.context,
      historyLength: message.conversationHistory?.length || 0,
    });
    
    transaction.setData('user_id', message.userId);
    transaction.setData('message_length', message.message.length);
    
    // Track the API call performance
    const apiCallSpan = transaction.startChild('supabase_edge_function', 'http.client');
    const { data, error } = await supabase.functions.invoke('coach-glow', {
      body: message
    })
    
    // Finish API call span
    apiCallSpan.setTag('status', error ? 'error' : 'success');
    if (error) {
      apiCallSpan.setTag('error', 'true');
      apiCallSpan.setData('error_message', error.message);
      apiCallSpan.setData('error_code', error.status || 'unknown');
    }
    apiCallSpan.finish();

    // Check if the response contains a user-friendly error message
    if (data && !data.success && data.error) {
      const apiError = new Error(data.error);
      captureException(apiError, {
        coachGlow: {
          operation: 'sendMessageToCoachGlow',
          userId: message.userId,
          messageLength: message.message.length,
          apiError: data.error,
        },
      });
      transaction.setTag('error', 'true');
      transaction.finish();
      throw apiError;
    }

    if (error) {
      const supabaseError = new Error('I had trouble connecting. Please try again in a moment.');
      captureException(supabaseError, {
        coachGlow: {
          operation: 'sendMessageToCoachGlow',
          userId: message.userId,
          messageLength: message.message.length,
          supabaseError: error.message,
          errorCode: error.status || 'unknown',
        },
      });
      transaction.setTag('error', 'true');
      transaction.finish();
      throw supabaseError;
    }

    const duration = Date.now() - startTime;
    const response = data as CoachGlowResponse;
    
    transaction.setData('duration_ms', duration);
    transaction.setData('response_length', response.response.length);
    transaction.setTag('intent', response.intent || 'general');
    transaction.setTag('success', 'true');
    
    addBreadcrumb('Coach Glow response received', 'coach_glow', {
      userId: message.userId,
      intent: response.intent,
      responseLength: response.response.length,
      duration,
    });
    
    transaction.setTag('intent', response.intent);
    transaction.setData('duration', duration);
    transaction.setData('responseLength', response.response.length);
    transaction.finish();
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    transaction.setTag('error', 'true');
    transaction.setData('duration', duration);
    transaction.finish();
    throw error;
  }
}

/**
 * Concurrent version of Coach Glow chat - processes multiple requests simultaneously
 * @param message - Coach Glow message
 * @returns Promise resolving to Coach Glow response
 */
export async function sendMessageToCoachGlowConcurrently(
  message: CoachGlowMessage
): Promise<CoachGlowResponse> {
  const transaction = startTransaction('coach_glow_concurrent_chat', 'api.call');
  const startTime = Date.now();
  
  try {
    addBreadcrumb('Starting concurrent Coach Glow chat', 'coach_glow', {
      userId: message.userId,
      messageLength: message.message.length,
    });
    
    const { concurrentLLMProcessor } = await import('./concurrentLLMProcessor');
    
    console.log(`[CoachGlowService] Adding chat request to concurrent processor for user ${message.userId}`);
    
    const result = await concurrentLLMProcessor.addRequest(
      message.userId,
      'coach_chat',
      message
    );
    
    const duration = Date.now() - startTime;
    transaction.setTag('intent', result.intent);
    transaction.setData('duration', duration);
    transaction.finish();
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    transaction.setTag('error', 'true');
    transaction.setData('duration', duration);
    transaction.finish();
    
    if (error instanceof Error) {
      captureException(error, {
        coachGlow: {
          operation: 'sendMessageToCoachGlowConcurrently',
          userId: message.userId,
          messageLength: message.message.length,
          errorMessage: error.message,
        },
      });
    }
    
    throw error;
  }
}

/**
 * Applies a plan swap when user confirms the change
 */
export async function applyPlanSwap(
  swapRequest: ApplySwapRequest
): Promise<ApplySwapResponse> {
  const transaction = startTransaction('coach_glow_plan_swap', 'api.call');
  const startTime = Date.now();
  
  try {
    addBreadcrumb('Applying plan swap', 'coach_glow', {
      userId: swapRequest.userId,
      swapType: swapRequest.swapType,
      day: swapRequest.day,
    });
    
    const { data, error } = await supabase.functions.invoke('apply-plan-swap', {
      body: swapRequest
    })

    // Check if the response contains a user-friendly error message
    if (data && !data.success && data.error) {
      const apiError = new Error(data.error);
      captureException(apiError, {
        coachGlow: {
          operation: 'applyPlanSwap',
          userId: swapRequest.userId,
          swapType: swapRequest.swapType,
          day: swapRequest.day,
          apiError: data.error,
        },
      });
      transaction.setTag('error', 'true');
      transaction.finish();
      throw apiError;
    }

    if (error) {
      const supabaseError = new Error('I had trouble updating your plan. Please try again.');
      captureException(supabaseError, {
        coachGlow: {
          operation: 'applyPlanSwap',
          userId: swapRequest.userId,
          swapType: swapRequest.swapType,
          day: swapRequest.day,
          supabaseError: error.message,
          errorCode: error.status || 'unknown',
        },
      });
      transaction.setTag('error', 'true');
      transaction.finish();
      throw supabaseError;
    }

    const duration = Date.now() - startTime;
    const response = data as ApplySwapResponse;
    
    transaction.setTag('success', response.success.toString());
    transaction.setData('duration', duration);
    transaction.finish();
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    transaction.setTag('error', 'true');
    transaction.setData('duration', duration);
    transaction.finish();
    throw error;
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
    addBreadcrumb('Fetching Coach Glow chat history', 'coach_glow', { userId, limit });
    
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
      const dbError = new Error(`Failed to fetch chat history: ${error.message}`);
      captureException(dbError, {
        coachGlow: {
          operation: 'getCoachGlowChatHistory',
          userId,
          limit,
          errorCode: error.code,
          errorMessage: error.message,
        },
      });
      throw dbError;
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
