import React, { useState, useCallback, useRef } from 'react'
import { 
  sendMessageToCoachGlow, 
  applyPlanSwap, 
  getCoachGlowChatHistory,
  CoachGlowMessage,
  CoachGlowResponse,
  ApplySwapRequest,
  ChatHistory,
  isPlanSwapRequest,
  isMotivationRequest
} from './coachGlowService'
import { loadUserData } from './instantDataManager'

interface UseCoachGlowOptions {
  userId: string
  autoLoadHistory?: boolean
  historyLimit?: number
}

interface UseCoachGlowReturn {
  // State
  isLoading: boolean
  isApplyingSwap: boolean
  chatHistory: ChatHistory[]
  lastResponse: CoachGlowResponse | null
  error: string | null
  
  // Actions
  sendMessage: (message: string, context?: CoachGlowMessage['context']) => Promise<void>
  applySwap: (swapRequest: ApplySwapRequest) => Promise<void>
  loadChatHistory: () => Promise<void>
  clearChatHistory: () => void
  clearError: () => void
  
  // Helpers
  isPlanSwap: (message: string) => boolean
  isMotivation: (message: string) => boolean
}

export function useCoachGlow({
  userId,
  autoLoadHistory = true,
  historyLimit = 20
}: UseCoachGlowOptions): UseCoachGlowReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isApplyingSwap, setIsApplyingSwap] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [lastResponse, setLastResponse] = useState<CoachGlowResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const historyLoaded = useRef(false)

  const sendMessage = useCallback(async (
    message: string, 
    context?: CoachGlowMessage['context']
  ) => {
    if (!userId || !message.trim()) {
      setError('User ID and message are required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get recent conversation history to provide context (last 10 messages)
      const recentHistory = chatHistory.slice(-10).map(chat => ({
        user_message: chat.user_message,
        coach_response: chat.coach_response,
        intent: chat.intent,
        context: chat.context,
        created_at: chat.created_at
      }))

      const response = await sendMessageToCoachGlow({
        userId,
        message: message.trim(),
        context,
        conversationHistory: recentHistory
      })

      setLastResponse(response)
      
      // Don't reload chat history here - let the chat component handle it
      // This prevents message reordering issues
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'I had trouble connecting. Please try again.'
      setError(errorMessage)
      
    } finally {
      setIsLoading(false)
    }
  }, [userId, chatHistory])

  const applySwap = useCallback(async (swapRequest: ApplySwapRequest) => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setIsApplyingSwap(true)
    setError(null)

    try {
      const response = await applyPlanSwap(swapRequest)
      
      if (response.success) {
        // Reload chat history to include the swap action
        await loadChatHistory()
        
        // Refresh user data to reflect the plan changes
        
        await loadUserData(userId)
      } else {
        setError(response.error || 'I had trouble updating your plan. Please try again.')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'I had trouble updating your plan. Please try again.'
      setError(errorMessage)
      
    } finally {
      setIsApplyingSwap(false)
    }
  }, [userId])

  const loadChatHistory = useCallback(async () => {
    if (!userId) return

    try {
      const history = await getCoachGlowChatHistory(userId, historyLimit)
      setChatHistory(history)
      historyLoaded.current = true
    } catch (err) {
      
      // Don't set error state for history loading failures
    }
  }, [userId, historyLimit])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearChatHistory = useCallback(() => {
    setChatHistory([])
    setLastResponse(null)
    historyLoaded.current = false
  }, [])

  // Helper functions
  const isPlanSwap = useCallback((message: string) => {
    return isPlanSwapRequest(message)
  }, [])

  const isMotivation = useCallback((message: string) => {
    return isMotivationRequest(message)
  }, [])

  // Auto-load history on mount
  React.useEffect(() => {
    if (autoLoadHistory && userId && !historyLoaded.current) {
      loadChatHistory()
    }
  }, [autoLoadHistory, userId, loadChatHistory])

  return {
    // State
    isLoading,
    isApplyingSwap,
    chatHistory,
    lastResponse,
    error,
    
    // Actions
    sendMessage,
    applySwap,
    loadChatHistory,
    clearChatHistory,
    clearError,
    
    // Helpers
    isPlanSwap,
    isMotivation
  }
}

// Convenience hooks for specific use cases

/**
 * Hook for motivation and accountability features
 */
export function useCoachGlowMotivation(userId: string) {
  const coachGlow = useCoachGlow({ userId })
  
  const askForMotivation = useCallback(async (message: string) => {
    await coachGlow.sendMessage(message)
  }, [coachGlow])

  const getMotivationHistory = useCallback(async () => {
    try {
      const history = await getCoachGlowChatHistory(userId, 10)
      return history.filter(chat => chat.intent === 'motivation')
    } catch (error) {
      
      return []
    }
  }, [userId])

  return {
    ...coachGlow,
    askForMotivation,
    getMotivationHistory
  }
}

/**
 * Hook for plan modification features
 */
export function useCoachGlowPlanSwaps(userId: string) {
  const coachGlow = useCoachGlow({ userId })
  
  const askForMealSwap = useCallback(async (
    message: string, 
    day?: string, 
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => {
    await coachGlow.sendMessage(message, {
      currentDay: day,
      mealType: mealType
    })
  }, [coachGlow])

  const askForWorkoutSwap = useCallback(async (message: string, day?: string) => {
    await coachGlow.sendMessage(message, {
      currentDay: day,
      workoutType: 'workout'
    })
  }, [coachGlow])

  const applyMealSwap = useCallback(async (
    day: string,
    mealType: string,
    newContent: any
  ) => {
    await coachGlow.applySwap({
      userId,
      swapType: 'meal',
      day,
      mealType,
      newContent
    })
    
    // Refresh user data after successful meal swap
    
    await loadUserData(userId)
  }, [coachGlow, userId])

  const applyWorkoutSwap = useCallback(async (
    day: string,
    newContent: any
  ) => {
    await coachGlow.applySwap({
      userId,
      swapType: 'workout',
      day,
      newContent
    })
    
    // Refresh user data after successful workout swap
    
    await loadUserData(userId)
  }, [coachGlow, userId])

  const getSwapHistory = useCallback(async () => {
    try {
      const history = await getCoachGlowChatHistory(userId, 10)
      return history.filter(chat => chat.intent === 'plan_swap')
    } catch (error) {
      
      return []
    }
  }, [userId])

  return {
    ...coachGlow,
    askForMealSwap,
    askForWorkoutSwap,
    applyMealSwap,
    applyWorkoutSwap,
    getSwapHistory
  }
}

/**
 * Hook for general fitness queries
 */
export function useCoachGlowGeneral(userId: string) {
  const coachGlow = useCoachGlow({ userId })
  
  const askGeneralQuestion = useCallback(async (message: string) => {
    await coachGlow.sendMessage(message)
  }, [coachGlow])

  const getGeneralHistory = useCallback(async () => {
    try {
      const history = await getCoachGlowChatHistory(userId, 10)
      return history.filter(chat => chat.intent === 'general')
    } catch (error) {
      
      return []
    }
  }, [userId])

  return {
    ...coachGlow,
    askGeneralQuestion,
    getGeneralHistory
  }
}
