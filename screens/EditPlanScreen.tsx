import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  InteractionManager,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useInstantStoredPlan, useInstantUserProfile } from '../utils/useInstantData';
import { generatePlanViaEdgeFunction, StoredPlan, getPlanGenerationStatus } from '../utils/planService';
import { calculateProgressEstimation, DEFAULT_PROGRESS_STAGES } from '../utils/progressEstimation';
import { getUserDisplayName } from '../utils/profileService';
import { invalidateCacheForProfile } from '../utils/universalCacheInvalidation';
import { updateStoredPlan } from '../utils/instantDataManager';

const { width: screenWidth } = Dimensions.get('window');

interface PlanRegenerationModalProps {
  visible: boolean;
  planType: 'workout' | 'diet' | 'both';
  onConfirm: () => void;
  onCancel: () => void;
  isGenerating: boolean;
  userId: string;
  onPlanStatusChange?: (status: 'generating' | 'completed' | 'failed' | 'not_started') => void;
}

const PlanRegenerationModal: React.FC<PlanRegenerationModalProps> = ({
  visible,
  planType,
  onConfirm,
  onCancel,
  isGenerating,
  userId,
  onPlanStatusChange,
}) => {
  // Animation values
  const ringRotation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const messageFadeAnimation = useRef(new Animated.Value(1)).current;
  const tipSlideAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;

  // Dynamic content state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  
  // Real-time progress tracking state
  const [actualPlanStatus, setActualPlanStatus] = useState<'generating' | 'completed' | 'failed' | 'not_started'>('not_started');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [progressUpdateInterval, setProgressUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [planGenerationStartTime, setPlanGenerationStartTime] = useState<number | null>(null);
  const [estimatedProgress, setEstimatedProgress] = useState(0);

  // Dynamic content arrays
  const getMotivationalMessages = () => {
    const baseMessages = [
      "Analyzing your current progress...",
      "Updating your fitness goals...",
      "Calculating optimal calorie targets...",
      "Creating your weekly schedule...",
      "Adding the final touches...",
      "Almost there! Your new plan awaits..."
    ];

    if (planType === 'workout') {
      return [
        "Analyzing your current progress...",
        "Designing your new workout routine...",
        "Selecting the perfect exercises...",
        "Creating your training schedule...",
        "Optimizing rest periods...",
        "Almost there! Your new workout awaits..."
      ];
    } else if (planType === 'diet') {
      return [
        "Analyzing your current progress...",
        "Recalculating your BMR and TDEE...",
        "Crafting your personalized meal plan...",
        "Selecting nutritious ingredients...",
        "Balancing your macros perfectly...",
        "Almost there! Your new diet awaits..."
      ];
    } else {
      return [
        "Analyzing your current progress...",
        "Designing your new workout routine...",
        "Crafting your personalized meal plan...",
        "Calculating optimal calorie targets...",
        "Creating your weekly schedule...",
        "Almost there! Your new plan awaits..."
      ];
    }
  };

  const motivationalMessages = getMotivationalMessages();

  const getFitnessTips = () => {
    const baseTips = [
      "💡 Consistency is the key to success!",
      "🎯 Small changes lead to big results!",
      "🔥 You're building habits that last a lifetime!",
      "⭐ Every expert was once a beginner!"
    ];

    if (planType === 'workout') {
      return [
        "💪 Your body adapts and grows stronger every day!",
        "🏃‍♀️ Every workout brings you closer to your goals!",
        "😴 Recovery is just as important as training!",
        "🏋️‍♂️ Progressive overload leads to muscle growth!",
        "💡 Consistency is the key to success!",
        "🎯 Small changes lead to big results!",
        "🔥 You're building habits that last a lifetime!",
        "⭐ Every expert was once a beginner!"
      ];
    } else if (planType === 'diet') {
      return [
        "🥗 Nutrition fuels your transformation!",
        "🍎 Whole foods provide the best nutrients!",
        "💧 Hydration is crucial for performance!",
        "⏰ Meal timing can optimize your results!",
        "💡 Consistency is the key to success!",
        "🎯 Small changes lead to big results!",
        "🔥 You're building habits that last a lifetime!",
        "⭐ Every expert was once a beginner!"
      ];
    } else {
      return [
        "💪 Your body adapts and grows stronger every day!",
        "🏃‍♀️ Every workout brings you closer to your goals!",
        "🥗 Nutrition fuels your transformation!",
        "😴 Recovery is just as important as training!",
        "💡 Consistency is the key to success!",
        "🎯 Small changes lead to big results!",
        "🔥 You're building habits that last a lifetime!",
        "⭐ Every expert was once a beginner!"
      ];
    }
  };

  const fitnessTips = getFitnessTips();

  // Use the standardized progress stages from the utility
  const progressStages = DEFAULT_PROGRESS_STAGES;

  // Native-driven progress animation
  const progressAnimation = useRef(new Animated.Value(5)).current;
  const animationRef = useRef<number | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  
  // Enhanced progress estimation system that smoothly progresses through stages
  const updateProgressEstimation = () => {
    if (!planGenerationStartTime) {
      return;
    }
    
    // Use the standardized progress estimation utility
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
  
  // BULLETPROOF progress update mechanism - multiple timers to ensure it works
  const startProgressUpdatesWithTime = (startTime: number) => {
    console.log(`[EditPlan] Starting progress updates with startTime: ${startTime}`);
    
    // Clear any existing timers
    if (progressTimerRef.current) {
      console.log('[EditPlan] Clearing existing progress timer');
      clearTimeout(progressTimerRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // CRITICAL FIX: Use a recursive setTimeout instead of setInterval for more reliability
    const updateProgress = () => {
      // Use the standardized progress estimation utility
      let { progress, stageIndex } = calculateProgressEstimation(startTime);
      const elapsedTime = Date.now() - startTime;
      
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
      
      console.log(`[EditPlan] Progress update: ${elapsedTime}ms elapsed, ${progress}%, stage ${stageIndex}, current estimated: ${estimatedProgress}, backend status: ${actualPlanStatus}`);
      
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
        console.log('[EditPlan] Plan generation failed, stopping progress timer');
        progressTimerRef.current = null;
      } else if (actualPlanStatus === 'completed' && progress >= 100) {
        // Only stop when we've reached 100% naturally
        console.log('[EditPlan] Progress completed naturally at 100%, stopping timer');
        progressTimerRef.current = null;
        
        // Set final completion state
        setProgressStage(progressStages.length - 1);
        setCurrentMessageIndex(progressStages.length - 1);
        setCurrentTipIndex(progressStages.length - 1);
      } else {
        // Continue the timer for all other cases (generating, not_started, completed but < 100%)
        progressTimerRef.current = setTimeout(updateProgress, 250) as any;
        console.log(`[EditPlan] Continuing progress timer, next update in 250ms, ref: ${progressTimerRef.current}`);
      }
    };
    
    // Start the recursive timer
    console.log('[EditPlan] Starting recursive progress timer');
    
    // CRITICAL FIX: Call updateProgress immediately first, then start the timer
    console.log('[EditPlan] Calling updateProgress immediately...');
    updateProgress();
    
    // Then start the recursive timer
    progressTimerRef.current = setTimeout(updateProgress, 250) as any;
    console.log('[EditPlan] Progress timer started, ref:', progressTimerRef.current);
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

  // Function to check plan generation status
  // COMPLETELY NEW APPROACH: Fake progress that actually works
  const startFakeProgress = () => {
    console.log('Starting FAKE progress system for plan regeneration - this will actually work!');
    const startTime = Date.now();
    console.log('Setting planGenerationStartTime to:', startTime);
    setActualPlanStatus('generating');
    setPlanGenerationStartTime(startTime);
    setEstimatedProgress(5);
    
    // CRITICAL FIX: Set initial progress animation value immediately with smooth animation
    Animated.timing(progressAnimation, {
      toValue: 5,
      duration: 100,
      useNativeDriver: false,
    }).start();
    
    // Start fake progress updates immediately with the start time
    console.log('Calling startProgressUpdates with startTime:', startTime);
    startProgressUpdatesWithTime(startTime);
    
    // Also start a backup timer to ensure progress updates
    setTimeout(() => {
      console.log('[EditPlan] Backup timer - checking if progress is updating...');
      if (estimatedProgress <= 5) {
        console.log('[EditPlan] Progress stuck at 5%, restarting timer...');
        startProgressUpdatesWithTime(startTime);
      }
    }, 2000);
  };

  const checkPlanStatus = async () => {
    if (!userId || isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      const status = await getPlanGenerationStatus(userId);
      console.log('Status check result:', status, 'current status:', actualPlanStatus);
      
      // CRITICAL FIX: Only update status if it's actually different
      if (status !== actualPlanStatus) {
        console.log(`[EditPlan] Status changed from ${actualPlanStatus} to ${status}`);
        setActualPlanStatus(status);
      }
      
      // If we find a completed plan, finish the progress
      if (status === 'completed') {
        console.log('Plan regeneration completed!');
        
        // DON'T jump to 100% immediately - let the progress timer continue naturally
        // The progress timer will handle the smooth transition to 100%
        
        // Clear status check interval but keep progress timer running
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        // DON'T clear the progress timer - let it continue to 100% naturally
      } else if (status === 'failed') {
        console.log('Plan regeneration failed');
        
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
        console.log('[EditPlan] Backend still generating, progress timer continues...');
      }
      // For any other status (not_started), keep the fake progress running
      
    } catch (error) {
      console.error('Error checking plan status:', error);
      // Don't stop fake progress on errors - keep it running
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getPlanTypeText = () => {
    switch (planType) {
      case 'workout':
        return 'workout plan';
      case 'diet':
        return 'diet plan';
      case 'both':
        return 'complete plan (workout + diet)';
      default:
        return 'plan';
    }
  };

  const getWarningMessage = () => {
    const planText = getPlanTypeText();
    return `Are you sure you want to regenerate your ${planText}? This will create a new personalized plan based on your current profile data and preferences. Your current plan will be replaced.`;
  };

  // Start checking plan status when generation begins
  useEffect(() => {
    if (isGenerating && userId) {
      // Reset all state when starting
      setActualPlanStatus('not_started');
      setEstimatedProgress(0);
      setProgressStage(0);
      
      // NEW APPROACH: Start fake progress immediately, then check backend
      console.log('Plan regeneration modal opened - starting fake progress system');
      startFakeProgress();
      
      // Set up status polling every 1.5 seconds for responsive updates
      const statusInterval = setInterval(() => {
        console.log(`[EditPlan] Status check - current actualPlanStatus: ${actualPlanStatus}`);
        if (actualPlanStatus !== 'completed' && actualPlanStatus !== 'failed') {
          checkPlanStatus();
        }
      }, 1500);
      
      // Progress updates are started in startFakeProgress()
      
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
      
      setStatusCheckInterval(statusInterval);
      
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
      };
    }
  }, [isGenerating, userId]);

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

  // Notify parent component when plan status changes
  useEffect(() => {
    if (onPlanStatusChange) {
      onPlanStatusChange(actualPlanStatus);
    }
  }, [actualPlanStatus, onPlanStatusChange]);

  // Animation effects
  useEffect(() => {
    if (!visible) return;

    // Scale in animation
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

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
    if (isGenerating) {
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
  }, [visible, isGenerating]);

  // Cycle through messages and tips during generation
  useEffect(() => {
    if (!isGenerating) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
    }, 3000);

    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % fitnessTips.length);
    }, 4000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(tipInterval);
    };
  }, [isGenerating, motivationalMessages.length, fitnessTips.length]);

  if (!visible) return null;

  const ringRotate = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const mascotScale = pulseAnimation;

  const tipSlideTransform = tipSlideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const sparkleOpacity = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  if (isGenerating) {
    return (
      <View style={styles.fullScreenOverlay}>
        <LinearGradient
          colors={['#D6F5EC', '#F8EFFF', '#FFEADB']}
          style={styles.fullScreenBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.fullScreenContent}>
          {/* Header */}
          <Text style={styles.fullScreenTitle}>
            Regenerating Your {getPlanTypeText().charAt(0).toUpperCase() + getPlanTypeText().slice(1)}
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

          {/* Progress Stage Indicator */}
          <View style={styles.progressStageContainer}>
            <Text style={styles.progressStageEmoji}>
              {progressStages[progressStage]?.emoji || '🚀'}
            </Text>
            <Text style={styles.progressStageText}>
              {progressStages[progressStage]?.stage || 'Initializing'}
            </Text>
          </View>

          {/* Enhanced Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: actualPlanStatus === 'completed' ? '#10B981' : 
                                   actualPlanStatus === 'failed' ? '#EF4444' : '#B88CFF'
                  }
                ]}
              />
            </View>
            
            <Text style={[
              styles.progressText,
              actualPlanStatus === 'completed' && { color: '#10B981' },
              actualPlanStatus === 'failed' && { color: '#EF4444' }
            ]}>
              {actualPlanStatus === 'completed' ? '100%' : 
               actualPlanStatus === 'failed' ? 'Failed' : `${estimatedProgress}%`}
            </Text>
          </View>

          {/* Dynamic Message */}
          <Animated.Text 
            style={[
              styles.dynamicMessage,
              { opacity: messageFadeAnimation }
            ]}
          >
            {motivationalMessages[currentMessageIndex]}
          </Animated.Text>

          {/* Interactive Fitness Tips */}
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

          {/* Sparkle Effects */}
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
    );
  }

  // Confirmation modal
  return (
    <Animated.View 
      style={[
        styles.modalOverlay,
        { transform: [{ scale: scaleAnimation }] }
      ]}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.warningIconContainer}>
            <Ionicons name="warning" size={32} color="#FF6B35" />
          </View>
          <Text style={styles.modalTitle}>Regenerate Plan</Text>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.warningText}>{getWarningMessage()}</Text>
          
          <View style={styles.warningDetails}>
            <Text style={styles.warningDetailsTitle}>⚠️ Important Notes:</Text>
            <Text style={styles.warningDetailsText}>
              • Your new plan will be tailored to your current weight and goals
            </Text>
            <Text style={styles.warningDetailsText}>
              • All your progress and completion history will be preserved
            </Text>
            <Text style={styles.warningDetailsText}>
              • This action cannot be undone
            </Text>
          </View>
        </View>
        
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onCancel}
            disabled={isGenerating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalButton, styles.confirmButton, isGenerating && styles.disabledButton]}
            onPress={onConfirm}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Regenerate Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const EditPlanScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // Use instant data hooks for zero-delay updates
  const { plan, loading: planLoading } = useInstantStoredPlan(user?.id || null);
  const { profile: userProfile } = useInstantUserProfile(user?.id || null);
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'workout' | 'diet' | 'both'>('both');
  const [modalActualPlanStatus, setModalActualPlanStatus] = useState<'generating' | 'completed' | 'failed' | 'not_started'>('not_started');

  const handleRegeneratePlan = (planType: 'workout' | 'diet' | 'both') => {
    setSelectedPlanType(planType);
    setShowRegenerationModal(true);
  };

  // Handle plan generation completion
  useEffect(() => {
    if (modalActualPlanStatus === 'completed' && isRegenerating) {
      const refreshPlanData = async () => {
        if (!user?.id) return;
        
        try {
          // First, clear all plan-related caches
          const { invalidateCacheForAnyUserAction } = await import('../utils/universalCacheInvalidation');
          invalidateCacheForAnyUserAction(user.id, 'plan_regeneration');
          
          // Force a delay to ensure database commit is complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Force fetch the latest plan from database
          const { getUserActivePlan } = await import('../utils/planService');
          const freshPlan = await getUserActivePlan(user.id);
          
          console.log('Fetched fresh plan from database:', freshPlan ? 'Found' : 'Not found');
          
          if (freshPlan) {
            console.log('Fresh plan from DB - workout days:', freshPlan.workout_plan?.length || 0);
            console.log('Fresh plan from DB - diet days:', freshPlan.diet_plan?.length || 0);
            
            // Update global state with fresh data 
            updateStoredPlan(user.id, freshPlan);
            
            // Also update user plan if needed
            const { updateUserPlan } = await import('../utils/instantDataManager');
            updateUserPlan(user.id, freshPlan);
            
            console.log('Plan data refreshed successfully after regeneration');
          } else {
            console.warn('No plan found after regeneration - trying to reload user data');
            // Fallback - force reload user data to refresh cache
            const { loadUserData } = await import('../utils/instantDataManager');
            await loadUserData(user.id);
          }
        } catch (error) {
          console.error('Error refreshing plan data:', error);
          // Fallback - force reload user data
          try {
            const { loadUserData } = await import('../utils/instantDataManager');
            await loadUserData(user.id);
          } catch (fallbackError) {
            console.error('Fallback reload also failed:', fallbackError);
          }
        }
      };
      
      // Start refresh process
      refreshPlanData();
      
          // Close modal and show success after a brief delay to ensure data is refreshed
      setTimeout(() => {
        setShowRegenerationModal(false);
        setIsRegenerating(false);
        
        Alert.alert(
          'Plan Regenerated! 🎉',
          `Your new ${selectedPlanType === 'both' ? 'workout and diet' : selectedPlanType} plan has been generated successfully!`,
          [
            {
              text: 'View Plan',
              onPress: () => {
                // Force reload the plan just to be sure
                const { loadUserData } = require('../utils/instantDataManager');
                loadUserData(user?.id || '').catch(console.error);
                navigation.goBack();
              }
            },
            {
              text: 'Stay Here',
              style: 'cancel'
            }
          ]
        );
      }, 1500); // Give 1.5 seconds for data refresh to complete
    } else if (modalActualPlanStatus === 'failed' && isRegenerating) {
      setShowRegenerationModal(false);
      setIsRegenerating(false);
      Alert.alert(
        'Regeneration Failed',
        'Something went wrong while generating your plan. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [modalActualPlanStatus, isRegenerating, user?.id, selectedPlanType, navigation]);

  const confirmRegeneration = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    setIsRegenerating(true);
    // Don't close the modal yet - let the animation show!

    try {
      console.log('Starting plan regeneration for planType:', selectedPlanType);
      
      // Call the edge function to regenerate the plan
      const response = await generatePlanViaEdgeFunction({
        userId: user.id,
        regenerate: true,
        planType: selectedPlanType
      });
      
      console.log('Edge function response:', response);

      if (response.success) {
        console.log('Edge function call successful - plan generation started in background');
        // Don't close modal immediately - let the real-time progress tracking handle completion
        // The modal will close automatically when actualPlanStatus becomes 'completed'
      } else {
        console.error('Edge function returned unsuccessful:', response.error);
        setShowRegenerationModal(false);
        setIsRegenerating(false);
        throw new Error(response.error || 'Failed to regenerate plan');
      }
    } catch (error) {
      setShowRegenerationModal(false);
      setIsRegenerating(false);
      Alert.alert(
        'Regeneration Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getPlanSummary = () => {
    if (!plan) return null;

    const workoutDays = plan.workout_plan?.length || 0;
    const dietDays = plan.diet_plan?.length || 0;
    const totalWorkouts = plan.workout_plan?.reduce((total: number, day: any) => total + (day?.routine?.length || 0), 0) || 0;
    const totalMeals = plan.diet_plan?.reduce((total: number, day: any) => total + (day?.meals?.length || 0), 0) || 0;

    return {
      workoutDays,
      dietDays,
      totalWorkouts,
      totalMeals,
      generatedAt: new Date(plan.generated_at).toLocaleDateString(),
      planVersion: plan.plan_version
    };
  };

  const renderPlanCard = (title: string, type: 'workout' | 'diet', icon: string, color: string) => {
    const summary = getPlanSummary();
    if (!summary) return null;

    const isWorkout = type === 'workout';
    const dayCount = isWorkout ? summary.workoutDays : summary.dietDays;
    const itemCount = isWorkout ? summary.totalWorkouts : summary.totalMeals;
    const itemLabel = isWorkout ? 'exercises' : 'meals';

    return (
      <View style={[styles.planCard, { borderLeftColor: color }]}>
        <View style={styles.planCardHeader}>
          <View style={styles.planCardIconContainer}>
            <Text style={styles.planCardIcon}>{icon}</Text>
          </View>
          <View style={styles.planCardTitleContainer}>
            <Text style={styles.planCardTitle}>{title}</Text>
            <Text style={styles.planCardSubtitle}>
              {dayCount} days • {itemCount} {itemLabel}
            </Text>
          </View>
        </View>
        
        <View style={styles.planCardContent}>
          <View style={styles.planCardStats}>
            <View style={styles.planCardStat}>
              <Text style={styles.planCardStatValue}>{dayCount}</Text>
              <Text style={styles.planCardStatLabel}>Days</Text>
            </View>
            <View style={styles.planCardStat}>
              <Text style={styles.planCardStatValue}>{itemCount}</Text>
              <Text style={styles.planCardStatLabel}>{itemLabel}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.regenerateButton, { backgroundColor: color }]}
            onPress={() => handleRegeneratePlan(type)}
            disabled={isRegenerating}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.regenerateButtonText}>Regenerate {title}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUserInfo = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.userInfoCard}>
        <View style={styles.userInfoHeader}>
          <Image
            source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')}
            style={styles.userInfoAvatar}
          />
          <View style={styles.userInfoText}>
            <Text style={styles.userInfoName}>
              {getUserDisplayName(userProfile)}
            </Text>
            <Text style={styles.userInfoGoal}>
              Goal: {userProfile.fitness_goal?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Not set'}
            </Text>
          </View>
        </View>
        
        <View style={styles.userInfoStats}>
          <View style={styles.userInfoStat}>
            <Text style={styles.userInfoStatValue}>{userProfile.age || 'N/A'}</Text>
            <Text style={styles.userInfoStatLabel}>Age</Text>
          </View>
          <View style={styles.userInfoStat}>
            <Text style={styles.userInfoStatValue}>
              {userProfile.weight_kg ? `${userProfile.weight_kg}kg` : 'N/A'}
            </Text>
            <Text style={styles.userInfoStatLabel}>Weight</Text>
          </View>
          <View style={styles.userInfoStat}>
            <Text style={styles.userInfoStatValue}>
              {userProfile.target_calories || 'N/A'}
            </Text>
            <Text style={styles.userInfoStatLabel}>Daily Calories</Text>
          </View>
        </View>
      </View>
    );
  };

  if (planLoading) {
    return (
      <LinearGradient
        colors={['#e9f7fa', '#f7e8fa']}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b88cff" />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!plan) {
    return (
      <LinearGradient
        colors={['#e9f7fa', '#f7e8fa']}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.noPlanContainer}>
          <Image
            source={require('../assets/mascot/thinking no bg.png')}
            style={styles.noPlanImage}
            resizeMode="contain"
          />
          <Text style={styles.noPlanTitle}>No Plan Found</Text>
          <Text style={styles.noPlanText}>
            You don't have an active plan yet. Complete your onboarding to generate your first personalized plan.
          </Text>
          <TouchableOpacity
            style={styles.createPlanButton}
            onPress={() => navigation.navigate('OnboardingScreen1' as never)}
          >
            <Text style={styles.createPlanButtonText}>Complete Onboarding</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const summary = getPlanSummary();

  return (
    <LinearGradient
      colors={['#e9f7fa', '#f7e8fa']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Plan</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* User Info Card */}
        {renderUserInfo()}

        {/* Current Plan Info */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <View style={styles.planVersionBadge}>
              <Text style={styles.planVersionText}>v{summary?.planVersion || 1}</Text>
            </View>
          </View>
          <Text style={styles.currentPlanSubtitle}>
            Generated on {summary?.generatedAt || 'Unknown date'}
          </Text>
        </View>

        {/* Plan Cards */}
        <View style={styles.planCardsContainer}>
          {renderPlanCard('Workout Plan', 'workout', '💪', '#4CAF50')}
          {renderPlanCard('Diet Plan', 'diet', '🍽️', '#FF9800')}
        </View>

        {/* Regenerate Complete Plan */}
        <View style={styles.completePlanCard}>
          <View style={styles.completePlanHeader}>
            <Text style={styles.completePlanTitle}>Complete Plan Regeneration</Text>
            <Text style={styles.completePlanSubtitle}>
              Generate a completely new workout and diet plan
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.regenerateCompleteButton, isRegenerating && styles.disabledButton]}
            onPress={() => handleRegeneratePlan('both')}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.regenerateCompleteButtonText}>Regenerate Complete Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <Ionicons name="help-circle" size={20} color="#666" />
            <Text style={styles.helpTitle}>Need Help?</Text>
          </View>
          <Text style={styles.helpText}>
            Your new plan will be generated based on your current profile data, including your weight, goals, and preferences. 
            All your progress and completion history will be preserved.
          </Text>
        </View>
      </ScrollView>

      {/* Regeneration Confirmation Modal */}
      <PlanRegenerationModal
        visible={showRegenerationModal}
        planType={selectedPlanType}
        onConfirm={confirmRegeneration}
        onCancel={() => setShowRegenerationModal(false)}
        isGenerating={isRegenerating}
        userId={user?.id || ''}
        onPlanStatusChange={setModalActualPlanStatus}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // No Plan
  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noPlanImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  noPlanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noPlanText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createPlanButton: {
    backgroundColor: '#b88cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // User Info Card
  userInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfoAvatar: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  userInfoText: {
    flex: 1,
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userInfoGoal: {
    fontSize: 14,
    color: '#666',
  },
  userInfoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userInfoStat: {
    alignItems: 'center',
  },
  userInfoStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfoStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Current Plan Card
  currentPlanCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planVersionBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planVersionText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  currentPlanSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Plan Cards Container
  planCardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Plan Card
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planCardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planCardIcon: {
    fontSize: 24,
  },
  planCardTitleContainer: {
    flex: 1,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  planCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardStats: {
    flexDirection: 'row',
    gap: 20,
  },
  planCardStat: {
    alignItems: 'center',
  },
  planCardStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  planCardStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Complete Plan Card
  completePlanCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completePlanHeader: {
    marginBottom: 16,
  },
  completePlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  completePlanSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  regenerateCompleteButton: {
    backgroundColor: '#b88cff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  regenerateCompleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Help Card
  helpCard: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Full Screen Animation
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  fullScreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullScreenContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullScreenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
  },
  circleContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(183, 252, 231, 0.1)',
  },
  ringContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 10,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 10,
    borderColor: 'transparent',
    borderTopColor: '#B7FCE7',
    borderRightColor: '#B1D7FC',
    borderBottomColor: '#D2C2FF',
    borderLeftColor: '#FFD8B2',
  },
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
    fontSize: 18,
    marginRight: 8,
  },
  progressStageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B88CFF',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 20,
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
    backgroundColor: '#B88CFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#B88CFF',
    fontWeight: '600',
  },
  dynamicMessage: {
    fontSize: 16,
    color: '#1B1B1F',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  tipsContainer: {
    marginTop: 10,
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
    width: 6,
    height: 6,
    borderRadius: 3,
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
  mascotContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 10,
  },
  mascotImage: {
    width: 80,
    height: 80,
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 24,
  },
  warningText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  warningDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  warningDetailsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditPlanScreen;
