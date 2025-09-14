import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native'
import { useCoachGlow, useCoachGlowMotivation, useCoachGlowPlanSwaps } from '../utils'
import { useAuth } from '../utils'
import { handlePlanSwap } from '../utils/instantDataManager'

interface CoachGlowChatProps {
  visible: boolean
  onClose: () => void
  initialMessage?: string
  context?: {
    currentDay?: string
    mealType?: string
    workoutType?: string
  }
  mode?: 'general' | 'motivation' | 'plan_swap'
}

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  intent?: string
  actionRequired?: any
}

const { width, height } = Dimensions.get('window')

export default function CoachGlowChat({
  visible,
  onClose,
  initialMessage = '',
  context,
  mode = 'general'
}: CoachGlowChatProps) {
  const { user } = useAuth()
  const [inputText, setInputText] = useState(initialMessage)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  // Use different hooks based on mode
  const generalCoach = useCoachGlow({ userId: user?.id || '' })
  const motivationCoach = useCoachGlowMotivation(user?.id || '')
  const planSwapCoach = useCoachGlowPlanSwaps(user?.id || '')

  // Select the appropriate coach based on mode
  const coach = mode === 'motivation' ? motivationCoach : 
                mode === 'plan_swap' ? planSwapCoach : 
                generalCoach

  useEffect(() => {
    if (visible && initialMessage) {
      setInputText(initialMessage)
    }
  }, [visible, initialMessage])

  useEffect(() => {
    if (visible) {
      // Load chat history when modal opens
      coach.loadChatHistory()
    }
  }, [visible])

  useEffect(() => {
    // Convert chat history to messages - only set if we don't have messages yet
    if (coach.chatHistory.length > 0 && messages.length === 0) {
      const historyMessages: ChatMessage[] = coach.chatHistory.map((chat, index) => [
        {
          id: `user-${chat.id}`,
          text: chat.user_message,
          isUser: true,
          timestamp: new Date(chat.created_at),
          intent: chat.intent
        },
        {
          id: `coach-${chat.id}`,
          text: chat.coach_response,
          isUser: false,
          timestamp: new Date(chat.created_at),
          intent: chat.intent
        }
      ]).flat()
      
      setMessages(historyMessages)
    }
  }, [coach.chatHistory, messages.length])

  useEffect(() => {
    // Add new message when coach responds
    if (coach.lastResponse) {
      const newMessage: ChatMessage = {
        id: `coach-${Date.now()}`,
        text: coach.lastResponse.response,
        isUser: false,
        timestamp: new Date(),
        intent: coach.lastResponse.intent,
        actionRequired: coach.lastResponse.action_required
      }
      
      setMessages(prev => [...prev, newMessage])
      setIsTyping(false)
      
      // Scroll to bottom after adding new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [coach.lastResponse])

  const handleSendMessage = async () => {
    if (!inputText.trim() || coach.isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Scroll to bottom after adding user message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      await coach.sendMessage(inputText.trim(), context)
    } catch (error) {
      setIsTyping(false)
      Alert.alert('Error', 'Failed to send message to Coach Glow')
    }
  }

  const handleApplySwap = async (actionData: any) => {
    try {
      console.log('🔄 Applying swap with data:', actionData)
      
      if (actionData.type === 'meal_swap') {
        // Extract meal type from the data
        const mealType = actionData.data.mealType || actionData.data.current?.meal || 'meal'
        console.log(`🍽️ Applying meal swap for ${mealType} on ${actionData.data.day}`)
        
        await planSwapCoach.applyMealSwap(
          actionData.data.day,
          mealType,
          actionData.data.suggested
        )
      } else if (actionData.type === 'workout_swap') {
        await planSwapCoach.applyWorkoutSwap(
          actionData.data.day,
          actionData.data.suggested
        )
      }
      
      // Refresh the plan data immediately after successful swap
      if (user?.id) {
        console.log('🔄 Refreshing plan data after swap...')
        // Trigger a plan refresh by calling the instant data manager
        // This will cause the UI to update immediately
        await handlePlanSwap(user.id, null) // null will trigger a reload from database
      }
      
      Alert.alert('Success', 'Plan updated successfully!')
    } catch (error) {
      console.error('❌ Error applying swap:', error)
      Alert.alert('Error', 'Failed to apply changes to your plan')
    }
  }

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.coachMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.coachBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.coachText
          ]}
        >
          {message.text}
        </Text>
        
        {message.actionRequired && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionTitle}>Suggested Change:</Text>
            <Text style={styles.actionText}>
              {message.actionRequired.data?.suggested}
            </Text>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => handleApplySwap(message.actionRequired)}
            >
              <Text style={styles.applyButtonText}>Apply Change</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  )

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.coachMessage]}>
      <View style={[styles.messageBubble, styles.coachBubble]}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
          <Text style={styles.typingText}>Coach Glow is typing...</Text>
        </View>
      </View>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.coachAvatar}>
              <Text style={styles.coachAvatarText}>✨</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.coachName}>Coach Glow</Text>
              <Text style={styles.coachSubtitle}>Your AI Fitness Coach</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to Coach Glow! ✨</Text>
              <Text style={styles.welcomeText}>
                I'm here to help you with motivation, plan modifications, and fitness advice.
                What can I help you with today?
              </Text>
            </View>
          )}
          
          {messages.map(renderMessage)}
          {isTyping && renderTypingIndicator()}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Coach Glow anything..."
            multiline
            maxLength={500}
            editable={!coach.isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || coach.isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || coach.isLoading}
          >
            {coach.isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {coach.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{coach.error}</Text>
            <TouchableOpacity onPress={coach.clearError}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  coachAvatarText: {
    fontSize: 20
  },
  headerText: {
    flex: 1
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  coachSubtitle: {
    fontSize: 14,
    color: '#6B7280'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280'
  },
  messagesContainer: {
    flex: 1
  },
  messagesContent: {
    padding: 16
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24
  },
  messageContainer: {
    marginBottom: 16
  },
  userMessage: {
    alignItems: 'flex-end'
  },
  coachMessage: {
    alignItems: 'flex-start'
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 16
  },
  userBubble: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4
  },
  coachBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E1E5E9'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  userText: {
    color: '#FFFFFF'
  },
  coachText: {
    color: '#1A1A1A'
  },
  actionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4
  },
  actionText: {
    fontSize: 14,
    color: '#0369A1',
    marginBottom: 8
  },
  applyButton: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB'
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600'
  }
})
