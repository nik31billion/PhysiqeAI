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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components/OnboardingErrorHandler';
import { useAuth } from '../utils/AuthContext';

const { width, height } = Dimensions.get('window');

const OnboardingScreen22: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    navigateToNextStep,
    isSaving,
    error,
    isGeneratingPlan,
    planGenerationStatus,
    planGenerationError
  } = useOnboardingNavigation();

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Animation values
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const mascotAnimation = useRef(new Animated.Value(0)).current;

  // Fun messages to show while generating plan
  const generationMessages = [
    "Analyzing your goals and preferences...",
    "Designing your perfect workout routine...",
    "Crafting your personalized meal plan...",
    "Fine-tuning your transformation journey...",
    "Almost there! Your plan is coming together...",
    "Adding the final touches to your Vibe Plan..."
  ];

  useEffect(() => {
    // Glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    // Mascot bounce animation
    const mascotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(mascotAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    mascotLoop.start();


    // Cycle through messages while generating
    let messageInterval: NodeJS.Timeout;
    if (planGenerationStatus === 'generating') {
      messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % generationMessages.length);
      }, 2500);
    }

    return () => {
      glowLoop.stop();
      mascotLoop.stop();
      if (messageInterval) {
        clearInterval(messageInterval);
      }
    };
  }, [planGenerationStatus, generationMessages.length]);

  const handleGoToDashboard = async () => {
    console.log('🚀 handleGoToDashboard called - marking onboarding as complete');
    // This is the final screen, so we mark onboarding as complete
    console.log('📡 Calling navigateToNextStep(22, {})');
    const success = await navigateToNextStep(22, {});
    console.log('📥 navigateToNextStep(22) result:', success);
    if (!success) {
      console.error('❌ Failed to save onboarding data');
    } else {
      console.log('✅ Onboarding completion initiated successfully');
    }
  };


  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const mascotScale = mascotAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });


  const getMascotImage = () => {
    switch (planGenerationStatus) {
      case 'generating':
        return require('../assets/mascot/thinking no bg.png');
      case 'completed':
        return require('../assets/mascot/excited no bg.png');
      case 'failed':
        return require('../assets/mascot/mascot normal no bg.png');
      default:
        return require('../assets/mascot/crown no bg.png');
    }
  };

  const getHeadingText = () => {
    const userName = user?.email?.split('@')[0] || 'there';

    switch (planGenerationStatus) {
      case 'generating':
        return `Hi ${userName}, we're crafting your perfect plan!`;
      case 'completed':
        return `Congrats ${userName}, your Vibe Plan is ready!`;
      case 'failed':
        return `Hi ${userName}, let's get you set up!`;
      default:
        return `Hi ${userName}, welcome to Flex Aura!`;
    }
  };

  const getSubHeadingText = () => {
    switch (planGenerationStatus) {
      case 'generating':
        return generationMessages[currentMessageIndex];
      case 'completed':
        return "Your personalized journey starts now!";
      case 'failed':
        return planGenerationError || "Something went wrong, but don't worry!";
      default:
        return "Your transformation journey begins here!";
    }
  };

  // Enable the dashboard button when plan generation is completed, failed, or when onboarding is ready to complete
  const isDashboardButtonEnabled = planGenerationStatus === 'completed' || planGenerationStatus === 'failed' || planGenerationStatus === 'idle';

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleGoToDashboard()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#E9FBF1', '#F8EFFF', '#FFF2E9']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle glowing spots for depth */}
      <View style={styles.glowSpots}>
        <Animated.View 
          style={[
            styles.glowSpot,
            styles.glowSpot1,
            { opacity: glowOpacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.glowSpot,
            styles.glowSpot2,
            { opacity: glowOpacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.glowSpot,
            styles.glowSpot3,
            { opacity: glowOpacity }
          ]} 
        />
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        {/* Heading */}
        <Text style={styles.heading}>
          <Text style={styles.congratsText}>
            {planGenerationStatus === 'completed' ? 'Congrats' :
             planGenerationStatus === 'generating' ? 'Almost there' :
             planGenerationStatus === 'failed' ? 'Let\'s try again' :
             'Welcome'}
          </Text>{'\n'}
          {getHeadingText().split(',')[1] || 'to Flex Aura!'}{'\n'}
          <Text style={styles.glowingText}>
            {planGenerationStatus === 'completed' ? "Let's get glowing!" :
             planGenerationStatus === 'generating' ? "Your plan is coming..." :
             planGenerationStatus === 'failed' ? "Let's get you set up!" :
             "Your journey begins!"}
          </Text>
        </Text>

        {/* Status Message */}
        {planGenerationStatus === 'generating' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#b88cff" />
            <Text style={styles.statusText}>
              {getSubHeadingText()}
            </Text>
          </View>
        )}

        {planGenerationStatus === 'failed' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {getSubHeadingText()}
            </Text>
            <Text style={styles.errorSubtext}>
              Don't worry! You can still access all features and generate your plan from the dashboard.
            </Text>
          </View>
        )}

        {/* Mascot Container */}
        <View style={styles.mascotContainer}>
          <Animated.View
            style={[
              styles.mascotWrapper,
              { transform: [{ scale: mascotScale }] }
            ]}
          >
            {/* Mascot Image */}
            <Image
              source={getMascotImage()}
              style={styles.mascotImage}
              resizeMode="contain"
            />

            {/* Sparkles for completed status */}
          </Animated.View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.dashboardButtonWrapper,
              !isDashboardButtonEnabled && styles.dashboardButtonDisabled
            ]}
            onPress={handleGoToDashboard}
            activeOpacity={isDashboardButtonEnabled ? 0.8 : 1}
            disabled={!isDashboardButtonEnabled || isSaving}
          >
            <LinearGradient
              colors={
                isDashboardButtonEnabled
                  ? ['#A3F7B5', '#D1F7FF']
                  : ['#ccc', '#ddd']
              }
              style={styles.dashboardButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.dashboardButtonText,
                    !isDashboardButtonEnabled && styles.dashboardButtonTextDisabled
                  ]}
                  numberOfLines={1}
                >
                  {planGenerationStatus === 'failed' ? 'Continue Anyway' : 
                   planGenerationStatus === 'generating' ? 'Generating Plan...' : 
                   'Go to Dashboard'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          {planGenerationStatus === 'completed'
            ? "Your personalized journey starts now—track your progress, unlock aura, and celebrate every win!"
            : planGenerationStatus === 'generating'
            ? "We're working our magic to create your perfect transformation plan..."
            : planGenerationStatus === 'failed'
            ? "You can generate your personalized plan anytime from your dashboard settings."
            : "Your transformation journey begins here!"
          }
        </Text>
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
  glowSpots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowSpot: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#B7FCE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  glowSpot1: {
    top: height * 0.15,
    right: 50,
  },
  glowSpot2: {
    bottom: height * 0.25,
    left: 30,
  },
  glowSpot3: {
    top: height * 0.5,
    right: 20,
  },
  contentCard: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: height * 0.08,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: 'System',
    letterSpacing: -0.5,
    marginTop: 20,
  },
  congratsText: {
    fontWeight: '900',
    color: '#1a1a1a',
  },
  glowingText: {
    fontWeight: '900',
    color: '#1a1a1a',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  mascotImage: {
    width: 220,
    height: 220,
  },
  buttonContainer: {
    width: '75%',
    position: 'relative',
    marginVertical: 20,
  },
  dashboardButtonWrapper: {
    width: '100%',
    borderRadius: 35,
    shadowColor: '#A3F7B5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 10,
  },
  dashboardButton: {
    width: '100%',
    borderRadius: 35,
    paddingVertical: 18,
    paddingHorizontal: 35,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 55,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  // Plan Generation Status Styles
  statusContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
    lineHeight: 22,
  },

  errorContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },

  mascotWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },


  dashboardButtonDisabled: {
    opacity: 0.6,
  },
  dashboardButtonTextDisabled: {
    color: '#999',
  },

});

export default OnboardingScreen22;