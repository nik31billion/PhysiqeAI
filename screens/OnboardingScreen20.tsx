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
  InteractionManager,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components/OnboardingErrorHandler';
import { getPlanGenerationStatus } from '../utils/planService';
import { useAuth } from '../utils/AuthContext';
import { calculateProgressEstimation, DEFAULT_PROGRESS_STAGES } from '../utils/progressEstimation';

const { width, height } = Dimensions.get('window');

const OnboardingScreen20: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { navigateToNextStep, isSaving, error, isGeneratingPlan, planGenerationStatus } = useOnboardingNavigation();
  
  // Local state for plan status checking
  const [actualPlanStatus, setActualPlanStatus] = useState<'generating' | 'completed' | 'failed' | 'not_started'>('not_started');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [planGenerationStartTime, setPlanGenerationStartTime] = useState<number | null>(null);
  const [estimatedProgress, setEstimatedProgress] = useState(0);
  const [progressUpdateInterval, setProgressUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Dynamic content state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  
  // Animation values
  const ringRotation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const messageFadeAnimation = useRef(new Animated.Value(1)).current;
  const tipSlideAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use the standardized progress stages
  const progressStages = DEFAULT_PROGRESS_STAGES;

  // Native-driven progress animation
  const progressAnimation = useRef(new Animated.Value(5)).current;
  const animationRef = useRef<number | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  
  // Enhanced progress estimation using the utility function
  const updateProgressEstimation = () => {
    if (!planGenerationStartTime) return;
    
    const { progress, stageIndex } = calculateProgressEstimation(planGenerationStartTime);
    const elapsedTime = Date.now() - planGenerationStartTime;
    
    console.log(`Progress update: ${elapsedTime}ms elapsed, ${progress}%, stage ${stageIndex}`);
    
    // CRITICAL FIX: Update state immediately without setTimeout
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      setEstimatedProgress(progress);
      if (stageIndex !== progressStage) {
        setProgressStage(stageIndex);
        setCurrentMessageIndex(stageIndex);
        setCurrentTipIndex(stageIndex);
      }
    });
    
    // Use native-driven animation for progress bar with immediate start
    progressAnimation.setValue(progress);
    
    // Update stage and messages with animation
    if (stageIndex !== progressStage) {
      // Animate message transition
      Animated.sequence([
        Animated.timing(messageFadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(messageFadeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };
  
  // Simplified progress update mechanism - single timer to prevent crashes
  const startProgressUpdatesWithTime = (startTime: number) => {
    console.log(`[Onboarding] Starting progress updates with startTime: ${startTime}`);
    
    // Clear any existing timers
    if (progressTimerRef.current) {
      console.log('[Onboarding] Clearing existing progress timer');
      clearTimeout(progressTimerRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // CRITICAL FIX: Use a recursive setTimeout instead of setInterval for more reliability
    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      let { progress, stageIndex } = calculateProgressEstimation(startTime);
      
      // CRITICAL FIX: Only apply backend completion logic if backend is actually completed
      // AND we're at a reasonable progress level (not jumping from 7% to 100%)
      if (actualPlanStatus === 'completed' && progress >= 90) {
        // Calculate how long since backend completed
        const timeSinceCompletion = elapsedTime - (planGenerationStartTime ? Date.now() - planGenerationStartTime : 0);
        
        // If backend completed and we're at 90%+, smoothly go to 100%
        if (progress >= 90) {
          // Smooth transition to 100% over 2-3 seconds
          const completionProgress = Math.min(90 + (timeSinceCompletion / 2000) * 10, 100);
          progress = Math.floor(completionProgress);
          stageIndex = progressStages.length - 1; // Final stage
        }
      }
      
      console.log(`[Onboarding] Progress update: ${elapsedTime}ms elapsed, ${progress}%, stage ${stageIndex}, current estimated: ${estimatedProgress}, backend status: ${actualPlanStatus}`);
      
      // CRITICAL FIX: Update state and animation immediately
      setEstimatedProgress(progress);
      if (stageIndex !== progressStage) {
        setProgressStage(stageIndex);
        setCurrentMessageIndex(stageIndex);
        setCurrentTipIndex(stageIndex);
      }
      
      // CRITICAL FIX: Use Animated.timing for smooth visual updates
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 200, // Smooth transition
        useNativeDriver: false, // Required for width animations
      }).start();
      
      // CRITICAL FIX: Always continue the timer unless we've reached 100% or failed
      if (actualPlanStatus === 'failed') {
        console.log('[Onboarding] Plan generation failed, stopping progress timer');
        progressTimerRef.current = null;
      } else if (actualPlanStatus === 'completed' && progress >= 100) {
        // Only stop when we've reached 100% naturally
        console.log('[Onboarding] Progress completed naturally at 100%, stopping timer');
        progressTimerRef.current = null;
        
        // Set final completion state
        setProgressStage(progressStages.length - 1);
        setCurrentMessageIndex(progressStages.length - 1);
        setCurrentTipIndex(progressStages.length - 1);
      } else {
        // Continue the timer for all other cases (generating, not_started, completed but < 100%)
        progressTimerRef.current = setTimeout(updateProgress, 250) as any;
        console.log(`[Onboarding] Continuing progress timer, next update in 250ms, ref: ${progressTimerRef.current}`);
      }
    };
    
    // Start the recursive timer
    console.log('[Onboarding] Starting recursive progress timer');
    
    // CRITICAL FIX: Call updateProgress immediately first, then start the timer
    console.log('[Onboarding] Calling updateProgress immediately...');
    updateProgress();
    
    // Then start the recursive timer
    progressTimerRef.current = setTimeout(updateProgress, 250) as any;
    console.log('[Onboarding] Progress timer started, ref:', progressTimerRef.current);
  };
  
  // App state change handler
  const handleAppStateChange = (nextAppState: string) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, restart progress updates
      if (actualPlanStatus === 'generating') {
        // Restart progress updates if needed
        if (planGenerationStartTime) {
          startProgressUpdatesWithTime(planGenerationStartTime);
        }
      }
    }
    appStateRef.current = nextAppState as any;
  };

  // Start progress system
  const startFakeProgress = () => {
    const startTime = Date.now();
    setActualPlanStatus('generating');
    setPlanGenerationStartTime(startTime);
    setEstimatedProgress(5);
    
    // CRITICAL FIX: Set initial progress animation value immediately with smooth animation
    Animated.timing(progressAnimation, {
      toValue: 5,
      duration: 100,
      useNativeDriver: false,
    }).start();
    
    // Start progress updates
    startProgressUpdatesWithTime(startTime);
  };

  // Function to check plan generation status (FIXED)
  const checkPlanStatus = async () => {
    if (!user || isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      const status = await getPlanGenerationStatus(user.id);
      
      // CRITICAL FIX: Only update status if it's actually different
      if (status !== actualPlanStatus) {
        console.log(`[Onboarding] Status changed from ${actualPlanStatus} to ${status}`);
        setActualPlanStatus(status);
      }
      
      // If we find a completed plan, finish the progress
      if (status === 'completed') {
        console.log('Plan generation completed!');
        
        // CRITICAL FIX: Don't jump to 100% immediately
        // Let the progress timer continue naturally until it reaches 100%
        // This prevents the jarring jump from 97% to 100%
        
        // Clear status check interval but keep progress timer running
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        // DON'T clear the progress timer - let it continue to 100% naturally
        // The progress timer will handle the smooth transition to 100%
        console.log('[Onboarding] Backend completed, but letting progress timer finish naturally');
        
      } else if (status === 'failed') {
        console.log('Plan generation failed');
        
        // Clear all intervals
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        if (progressTimerRef.current) {
          clearTimeout(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } else if (status === 'generating') {
        // CRITICAL FIX: Don't interfere with progress timer when backend is generating
        console.log('[Onboarding] Backend still generating, progress timer continues...');
      }
      // For any other status (not_started), keep the fake progress running
      
    } catch (error) {
      console.error('Error checking plan status:', error);
      // Don't stop fake progress on errors - keep it running
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Start checking plan status when component mounts
  useEffect(() => {
    if (user) {
      // NEW APPROACH: Start fake progress immediately, then check backend
      console.log('Component mounted - starting fake progress system');
      startFakeProgress();
      
      // Set up status polling every 1.5 seconds for responsive updates
      const statusInterval = setInterval(() => {
        if (actualPlanStatus !== 'completed' && actualPlanStatus !== 'failed') {
          checkPlanStatus();
        }
      }, 1500);
      
      // Set up message cycling every 3 seconds
      const messageInterval = setInterval(() => {
        if (actualPlanStatus === 'generating') {
          // Cycle through messages within the current stage
          const currentStage = progressStages[progressStage];
          if (currentStage) {
            Animated.sequence([
              Animated.timing(messageFadeAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(messageFadeAnimation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start();
          }
        }
      }, 3000);
      
      // Store intervals for cleanup
      setStatusCheckInterval(statusInterval);
      
      // Store message interval for cleanup
      messageIntervalRef.current = messageInterval;
      
      return () => {
        if (statusInterval) {
          clearInterval(statusInterval);
        }
        if (progressTimerRef.current) {
          clearTimeout(progressTimerRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
      };
    }
  }, [user]);

  // App state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [actualPlanStatus]);
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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

  // Initialize message and tip indices based on current progress stage
  useEffect(() => {
    if (actualPlanStatus === 'generating') {
      // Set initial indices based on current progress stage
      setCurrentMessageIndex(progressStage);
      setCurrentTipIndex(progressStage);
    } else if (actualPlanStatus === 'completed') {
      // Show completion stage
      setCurrentMessageIndex(progressStages.length - 1);
      setCurrentTipIndex(progressStages.length - 1);
    }
  }, [actualPlanStatus, progressStage]);

  const handleContinue = async () => {
    // If plan generation failed, retry plan generation
    if (actualPlanStatus === 'failed') {
      
      
      // Reset all progress indicators to start from 0%
      setActualPlanStatus('generating');
      setProgressStage(0);
      setCurrentMessageIndex(0);
      setCurrentTipIndex(0);
      setEstimatedProgress(0);
      setPlanGenerationStartTime(Date.now());
      
        // Restart the progress estimation interval
        if (progressUpdateInterval) {
          clearInterval(progressUpdateInterval);
        }
        const newProgressInterval = setInterval(() => {
          updateProgressEstimation();
        }, 500);
        setProgressUpdateInterval(newProgressInterval);
      
      try {
        // Import the plan generation function
        const { generatePlanViaEdgeFunction } = await import('../utils/planService');
        
        // Retry plan generation with regenerate flag
        const response = await generatePlanViaEdgeFunction({
          userId: user!.id,
          regenerate: true // Force regeneration
        });
        
        if (response.success) {
          
          setActualPlanStatus('completed');
        } else {
          
          setActualPlanStatus('failed');
        }
      } catch (error) {
        
        setActualPlanStatus('failed');
      }
      return;
    }
    
    // If plan is completed, continue to next step
    if (actualPlanStatus === 'completed') {
      const success = await navigateToNextStep(20, {});
      if (!success) {
        
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

  // Use animated progress width
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const mascotScale = pulseAnimation;

  // Get dynamic messaging based on actual plan generation status
  const getStatusMessage = () => {
    if (actualPlanStatus === 'completed') {
      const completionStage = progressStages[progressStages.length - 1];
      return {
        title: "Your Plan is Ready!",
        subtitle: completionStage.message,
        description: completionStage.stage
      };
    } else if (actualPlanStatus === 'generating') {
      const currentStage = progressStages[progressStage] || progressStages[0];
      return {
        title: "AI is Crafting Your Plan",
        subtitle: currentStage.message,
        description: currentStage.stage
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
        subtitle: "Initializing plan generation...",
        description: "Getting ready to analyze your fitness goals and create your custom workout & meal plan..."
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
            <Animated.View 
              style={[
                styles.progressBarFill,
                { 
                  width: progressWidth,
                  backgroundColor: actualPlanStatus === 'completed' ? '#10B981' : 
                                 actualPlanStatus === 'failed' ? '#EF4444' : '#B88CFF'
                }
              ]}
            />
          </View>
          
          <Text style={[
            styles.progressText,
            actualPlanStatus === 'completed' && { color: '#10B981' },
            actualPlanStatus === 'failed' && { color: '#EF4444' },
            actualPlanStatus === 'generating' && { color: '#B88CFF' }
          ]}>
            {actualPlanStatus === 'completed' ? '100%' : 
             actualPlanStatus === 'generating' ? `${estimatedProgress}%` : 
             actualPlanStatus === 'failed' ? 'Failed' : '5%'}
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
                {progressStages[currentTipIndex]?.tip || progressStages[0].tip}
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
    color: '#1B1B1F',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'System',
    fontWeight: '600',
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
