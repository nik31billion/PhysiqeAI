import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components/OnboardingErrorHandler';
import { getPlanGenerationStatus } from '../utils/planService';
import { useAuth } from '../utils/AuthContext';

const { width, height } = Dimensions.get('window');

const OnboardingScreen20: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { navigateToNextStep, isSaving, error, isGeneratingPlan, planGenerationStatus } = useOnboardingNavigation();
  
  // Local state for plan status checking
  const [actualPlanStatus, setActualPlanStatus] = useState<'generating' | 'completed' | 'failed' | 'not_started'>('not_started');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Dynamic content state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  
  // Animation values
  const ringRotation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const messageFadeAnimation = useRef(new Animated.Value(1)).current;
  const tipSlideAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  // Dynamic content arrays
  const motivationalMessages = [
    "Analyzing your fitness goals...",
    "Designing your perfect workout routine...",
    "Crafting your personalized meal plan...",
    "Calculating your optimal calorie targets...",
    "Creating your weekly schedule...",
    "Adding the final touches to your plan...",
    "Almost there! Your transformation journey awaits...",
    "Preparing your custom Vibe Plan..."
  ];

  const fitnessTips = [
    "💡 Consistency beats perfection every time!",
    "🏃‍♀️ Small steps lead to big transformations!",
    "💪 Your body can do amazing things - believe in it!",
    "🥗 Nutrition is 70% of your fitness journey!",
    "😴 Sleep is when your muscles grow and recover!",
    "🎯 Progress, not perfection, is the goal!",
    "🔥 Every expert was once a beginner!",
    "⭐ You're already one step closer to your goals!"
  ];

  const progressStages = [
    { stage: "Initializing", progress: 10, emoji: "🚀" },
    { stage: "Analyzing Goals", progress: 25, emoji: "🎯" },
    { stage: "Designing Workouts", progress: 40, emoji: "🏋️‍♂️" },
    { stage: "Creating Meal Plans", progress: 60, emoji: "🍽️" },
    { stage: "Optimizing Schedule", progress: 80, emoji: "📅" },
    { stage: "Finalizing Plan", progress: 95, emoji: "✨" },
    { stage: "Ready!", progress: 100, emoji: "🎉" }
  ];

  // Function to check plan generation status
  const checkPlanStatus = async () => {
    if (!user || isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      const status = await getPlanGenerationStatus(user.id);
      console.log('📊 Plan status check result:', status);
      setActualPlanStatus(status);
      
      // If plan is completed or failed, stop checking
      if ((status === 'completed' || status === 'failed') && statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    } catch (error) {
      console.error('❌ Error checking plan status:', error);
      setActualPlanStatus('failed');
      // Stop checking on persistent errors
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Start checking plan status when component mounts
  useEffect(() => {
    if (user) {
      // Initial check
      checkPlanStatus();
      
      // Set up polling every 3 seconds if plan is not completed
      const interval = setInterval(() => {
        if (actualPlanStatus !== 'completed') {
          checkPlanStatus();
        }
      }, 3000);
      
      setStatusCheckInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [user]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  useEffect(() => {
    // Ring rotation animation
    const ringLoop = Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    ringLoop.start();

    // Enhanced glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    // Sparkle animation
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(sparkleAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    sparkleLoop.start();

    // Pulse animation for the mascot
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Message cycling animation
    const messageLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(messageFadeAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(messageFadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    );

    // Tip sliding animation
    const tipLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tipSlideAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(tipSlideAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );

    // Start message and tip animations when generating
    if (actualPlanStatus === 'generating') {
      messageLoop.start();
      tipLoop.start();
    }

    return () => {
      ringLoop.stop();
      glowLoop.stop();
      sparkleLoop.stop();
      pulseLoop.stop();
      messageLoop.stop();
      tipLoop.stop();
    };
  }, [actualPlanStatus]);

  // Cycle through messages and tips during generation
  useEffect(() => {
    if (actualPlanStatus !== 'generating') return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
    }, 3000);

    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % fitnessTips.length);
    }, 4000);

    const progressInterval = setInterval(() => {
      setProgressStage((prev) => {
        const nextStage = (prev + 1) % progressStages.length;
        if (nextStage === 0 && actualPlanStatus === 'generating') {
          return prev; // Don't reset if still generating
        }
        return nextStage;
      });
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [actualPlanStatus, motivationalMessages.length, fitnessTips.length, progressStages.length]);

  const handleContinue = async () => {
    // If plan generation failed, retry plan generation
    if (actualPlanStatus === 'failed') {
      console.log('🔄 Retrying plan generation...');
      setActualPlanStatus('generating');
      
      try {
        // Import the plan generation function
        const { generatePlanViaEdgeFunction } = await import('../utils/planService');
        
        // Retry plan generation with regenerate flag
        const response = await generatePlanViaEdgeFunction({
          userId: user!.id,
          regenerate: true // Force regeneration
        });
        
        if (response.success) {
          console.log('✅ Plan generation retry successful');
          setActualPlanStatus('completed');
        } else {
          console.error('❌ Plan generation retry failed:', response.error);
          setActualPlanStatus('failed');
        }
      } catch (error) {
        console.error('❌ Error during plan generation retry:', error);
        setActualPlanStatus('failed');
      }
      return;
    }
    
    // If plan is completed, continue to next step
    if (actualPlanStatus === 'completed') {
      const success = await navigateToNextStep(20, {});
      if (!success) {
        console.error('Failed to save onboarding data');
      }
    }
  };

  const ringRotate = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  // Calculate progress based on actual plan status
  const getProgressWidth = () => {
    if (actualPlanStatus === 'completed') return '100%';
    if (actualPlanStatus === 'failed') return '0%';
    if (actualPlanStatus === 'generating') return '60%';
    return '20%'; // not_started or other states
  };

  const progressWidth = actualPlanStatus === 'completed' || actualPlanStatus === 'failed' 
    ? getProgressWidth() 
    : progressAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      });

  const mascotScale = pulseAnimation;

  // Get dynamic messaging based on actual plan generation status
  const getStatusMessage = () => {
    if (actualPlanStatus === 'completed') {
      return {
        title: "Your Plan is Ready!",
        subtitle: "Perfect! Your personalized plan has been crafted.",
        description: "Your custom workout & meal plan is ready to go!"
      };
    } else if (actualPlanStatus === 'generating') {
      return {
        title: "AI is Crafting Your Plan",
        subtitle: motivationalMessages[currentMessageIndex],
        description: progressStages[progressStage]?.stage || "Creating your perfect plan..."
      };
    } else if (actualPlanStatus === 'failed') {
      return {
        title: "Plan Generation Failed",
        subtitle: "Something went wrong...",
        description: "Don't worry! Tap 'Retry' to try again, or contact support if the issue persists."
      };
    } else {
      return {
        title: "Our AI is Crafting Your\nCustom Vibe Plan!",
        subtitle: "This might take a moment...",
        description: "Analyzing your fitness goals and creating your custom workout & meal plan..."
      };
    }
  };

  const statusMessage = getStatusMessage();
  
  // Allow continue when plan is completed, or retry when plan generation failed
  const canContinue = actualPlanStatus === 'completed' || actualPlanStatus === 'failed';

  // Animation interpolations
  const tipSlideTransform = tipSlideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const sparkleOpacity = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });


  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#D6F5EC', '#F8EFFF', '#FFEADB']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      

      {/* Main Content */}
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.heading}>
          {statusMessage.title}
        </Text>

        {/* Animated Circle / Progress Indicator */}
        <View style={styles.circleContainer}>
          {/* Ring Glow */}
          <Animated.View 
            style={[
              styles.ringGlow,
              {
                opacity: glowOpacity,
              }
            ]}
          />
          
          {/* Main Ring */}
          <Animated.View 
            style={[
              styles.ringContainer,
              {
                transform: [{ rotate: ringRotate }]
              }
            ]}
          >
            <LinearGradient
              colors={['#B7FCE7', '#B1D7FC', '#D2C2FF', '#FFD8B2', '#FFC1F6']}
              style={styles.ring}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {statusMessage.subtitle}
        </Text>

        {/* Enhanced Progress Bar */}
        <View style={styles.progressBarContainer}>
          {/* Progress Stage Indicator */}
          {actualPlanStatus === 'generating' && (
            <View style={styles.progressStageContainer}>
              <Text style={styles.progressStageEmoji}>
                {progressStages[progressStage]?.emoji || '🚀'}
              </Text>
              <Text style={styles.progressStageText}>
                {progressStages[progressStage]?.stage || 'Initializing'}
              </Text>
            </View>
          )}
          
          <View style={styles.progressBarBackground}>
            {actualPlanStatus === 'completed' || actualPlanStatus === 'failed' ? (
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: getProgressWidth(),
                    backgroundColor: actualPlanStatus === 'completed' ? '#10B981' : '#EF4444'
                  }
                ]}
              />
            ) : actualPlanStatus === 'generating' ? (
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${progressStages[progressStage]?.progress || 10}%`,
                    backgroundColor: '#B88CFF'
                  }
                ]}
              />
            ) : (
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { width: progressWidth }
                ]}
              />
            )}
          </View>
          
          <Text style={[
            styles.progressText,
            actualPlanStatus === 'completed' && { color: '#10B981' },
            actualPlanStatus === 'failed' && { color: '#EF4444' },
            actualPlanStatus === 'generating' && { color: '#B88CFF' }
          ]}>
            {actualPlanStatus === 'completed' ? '100%' : 
             actualPlanStatus === 'generating' ? `${progressStages[progressStage]?.progress || 10}%` : 
             actualPlanStatus === 'failed' ? 'Failed' : 'Preparing...'}
          </Text>
        </View>

        {/* Loading Text */}
        <Animated.Text 
          style={[
            styles.loadingText,
            { opacity: messageFadeAnimation }
          ]}
        >
          {statusMessage.description}
        </Animated.Text>

        {/* Interactive Fitness Tips */}
        {actualPlanStatus === 'generating' && (
          <Animated.View 
            style={[
              styles.tipsContainer,
              { 
                transform: [{ translateY: tipSlideTransform }],
                opacity: messageFadeAnimation
              }
            ]}
          >
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                {fitnessTips[currentTipIndex]}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Sparkle Effects */}
        {actualPlanStatus === 'generating' && (
          <View style={styles.sparkleContainer}>
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle1,
                { opacity: sparkleOpacity }
              ]}
            />
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle2,
                { opacity: sparkleOpacity }
              ]}
            />
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle3,
                { opacity: sparkleOpacity }
              ]}
            />
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          {/* Button Glow */}
          <Animated.View 
            style={[
              styles.buttonGlow,
              {
                opacity: glowOpacity,
              }
            ]}
          />
          
          <TouchableOpacity
            style={[
              styles.continueButtonWrapper,
              !canContinue && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            activeOpacity={canContinue ? 0.8 : 1}
            disabled={isSaving || !canContinue}
          >
            <LinearGradient
              colors={canContinue ? 
                (actualPlanStatus === 'failed' ? ['#FFE4E1', '#FFB3BA'] : ['#B7FCE7', '#C7F9F1']) : 
                ['#E5E7EB', '#D1D5DB']
              }
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[
                styles.continueButtonText,
                !canContinue && styles.continueButtonTextDisabled
              ]}>
                {actualPlanStatus === 'completed' ? 'Continue' : 
                 actualPlanStatus === 'generating' ? 'Generating...' : 
                 actualPlanStatus === 'failed' ? 'Retry' : 'Preparing...'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
          <Image
            source={require('../assets/mascot/working out no bg.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      </View>
    </OnboardingErrorHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: 'System',
    letterSpacing: -0.5,
    marginTop: 20,
  },
  circleContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(183, 252, 231, 0.1)',
  },
  ringContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 12,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 12,
    borderColor: 'transparent',
    borderTopColor: '#B7FCE7',
    borderRightColor: '#B1D7FC',
    borderBottomColor: '#D2C2FF',
    borderLeftColor: '#FFD8B2',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '600',
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '80%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 30,
  },
  continueButtonWrapper: {
    width: '100%',
    borderRadius: 35,
    zIndex: 10,
  },
  continueButton: {
    width: '100%',
    borderRadius: 35,
    paddingVertical: 20,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  buttonGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 40,
    backgroundColor: 'rgba(183, 252, 231, 0.1)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    right: 20,
    zIndex: 10,
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },

  // Enhanced Progress Styles
  progressStageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(184, 140, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 140, 255, 0.2)',
  },
  progressStageEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  progressStageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B88CFF',
    textAlign: 'center',
  },

  // Tips Container Styles
  tipsContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  tipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 140, 255, 0.2)',
    shadowColor: '#B88CFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: '90%',
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Sparkle Effects
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B88CFF',
  },
  sparkle1: {
    top: '15%',
    left: '20%',
  },
  sparkle2: {
    top: '25%',
    right: '25%',
  },
  sparkle3: {
    top: '35%',
    left: '60%',
  },
});

export default OnboardingScreen20;
