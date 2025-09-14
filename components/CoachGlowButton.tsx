import React, { useState } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native'
import CoachGlowChat from './CoachGlowChat'

interface CoachGlowButtonProps {
  mode?: 'general' | 'motivation' | 'plan_swap'
  context?: {
    currentDay?: string
    mealType?: string
    workoutType?: string
  }
  initialMessage?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'above-nav'
  size?: 'small' | 'medium' | 'large'
  variant?: 'floating' | 'inline'
}

const { width, height } = Dimensions.get('window')

export default function CoachGlowButton({
  mode = 'general',
  context,
  initialMessage = '',
  position = 'bottom-right',
  size = 'medium',
  variant = 'floating'
}: CoachGlowButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [pulseAnim] = useState(new Animated.Value(1))

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start()
  }

  const stopPulse = () => {
    pulseAnim.stopAnimation()
    pulseAnim.setValue(1)
  }

  const getButtonStyle = () => {
    const baseStyle = [styles.button]
    
    // Size variations
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall)
        break
      case 'large':
        baseStyle.push(styles.buttonLarge)
        break
      default:
        baseStyle.push(styles.buttonMedium)
    }

    // Position variations
    if (variant === 'floating') {
      baseStyle.push(styles.floating)
      switch (position) {
        case 'bottom-left':
          baseStyle.push(styles.bottomLeft)
          break
        case 'top-right':
          baseStyle.push(styles.topRight)
          break
        case 'top-left':
          baseStyle.push(styles.topLeft)
          break
        case 'above-nav':
          baseStyle.push(styles.aboveNav)
          break
        default:
          baseStyle.push(styles.bottomRight)
      }
    } else {
      baseStyle.push(styles.inline)
    }

    return baseStyle
  }

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16
      case 'large':
        return 24
      default:
        return 20
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12
      case 'large':
        return 16
      default:
        return 14
    }
  }

  const handlePress = () => {
    setIsVisible(true)
    stopPulse()
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <>
      <Animated.View
        style={[
          getButtonStyle(),
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <TouchableOpacity
          style={styles.buttonContent}
          onPress={handlePress}
          onPressIn={startPulse}
          onPressOut={stopPulse}
          activeOpacity={0.8}
        >
          <Text style={[styles.icon, { fontSize: getIconSize() }]}>✨</Text>
          {variant === 'inline' && (
            <Text style={[styles.text, { fontSize: getTextSize() }]}>
              Ask Coach Glow
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <CoachGlowChat
        visible={isVisible}
        onClose={handleClose}
        initialMessage={initialMessage}
        context={context}
        mode={mode}
      />
    </>
  )
}

// Preset configurations for common use cases
export const CoachGlowMotivationButton = (props: Omit<CoachGlowButtonProps, 'mode'>) => (
  <CoachGlowButton {...props} mode="motivation" />
)

export const CoachGlowPlanSwapButton = (props: Omit<CoachGlowButtonProps, 'mode'>) => (
  <CoachGlowButton {...props} mode="plan_swap" />
)

export const CoachGlowFloatingButton = (props: Omit<CoachGlowButtonProps, 'variant'>) => (
  <CoachGlowButton {...props} variant="floating" />
)

export const CoachGlowInlineButton = (props: Omit<CoachGlowButtonProps, 'variant'>) => (
  <CoachGlowButton {...props} variant="inline" />
)

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  buttonSmall: {
    width: 48,
    height: 48
  },
  buttonMedium: {
    width: 56,
    height: 56
  },
  buttonLarge: {
    width: 64,
    height: 64
  },
  floating: {
    position: 'absolute',
    zIndex: 1000
  },
  bottomRight: {
    bottom: 100, // Increased to be above navigation bar
    right: 20
  },
  bottomLeft: {
    bottom: 100, // Increased to be above navigation bar
    left: 20
  },
  topRight: {
    top: 20,
    right: 20
  },
  topLeft: {
    top: 20,
    left: 20
  },
  aboveNav: {
    bottom: 100, // Positioned above navigation bar
    right: 20
  },
  inline: {
    alignSelf: 'center',
    marginVertical: 8
  },
  buttonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12
  },
  icon: {
    color: '#FFFFFF'
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8
  }
})
