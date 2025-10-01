import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface FoodAnalysisLoadingScreenProps {
  capturedImageUri?: string;
  scanMode: 'food' | 'barcode' | 'label' | 'library';
  onComplete?: () => void;
}

const FoodAnalysisLoadingScreen: React.FC<FoodAnalysisLoadingScreenProps> = ({
  capturedImageUri,
  scanMode,
  onComplete,
}) => {
  // Progress and message state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  const [estimatedProgress, setEstimatedProgress] = useState(0);

  // Animation values
  const ringRotation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const messageFadeAnimation = useRef(new Animated.Value(1)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const mascotAnimation = useRef(new Animated.Value(0)).current;

  // Progressive content based on scan mode
  const getScanModeContent = () => {
    switch (scanMode) {
      case 'food':
        return {
          title: 'Analyzing your food...',
          subtitle: 'AI is identifying ingredients and calculating nutrition',
          stages: [
            { 
              stage: "Processing Image", 
              progress: 15, 
              emoji: "📸",
              message: "Analyzing the captured image...",
              tip: "🔍 AI vision is scanning your food!"
            },
            { 
              stage: "Identifying Food Items", 
              progress: 35, 
              emoji: "🍽️",
              message: "Recognizing ingredients and dishes...",
              tip: "🧠 Smart recognition of Indian and international cuisines!"
            },
            { 
              stage: "Calculating Nutrition", 
              progress: 60, 
              emoji: "📊",
              message: "Computing calories and macronutrients...",
              tip: "⚡ Precision nutrition analysis in progress!"
            },
            { 
              stage: "Finalizing Results", 
              progress: 85, 
              emoji: "✨",
              message: "Preparing your detailed nutrition breakdown...",
              tip: "🎯 Almost ready with your food analysis!"
            },
            { 
              stage: "Analysis Complete!", 
              progress: 100, 
              emoji: "✅",
              message: "Your food analysis is ready!",
              tip: "🚀 Time to track your nutrition!"
            }
          ]
        };
      case 'barcode':
        return {
          title: 'Scanning barcode...',
          subtitle: 'Reading product information and nutrition facts',
          stages: [
            { 
              stage: "Reading Barcode", 
              progress: 20, 
              emoji: "🔍",
              message: "Scanning barcode data...",
              tip: "📱 Advanced barcode recognition!"
            },
            { 
              stage: "Finding Product", 
              progress: 50, 
              emoji: "🛍️",
              message: "Looking up product database...",
              tip: "🌐 Accessing millions of products!"
            },
            { 
              stage: "Getting Nutrition", 
              progress: 80, 
              emoji: "📋",
              message: "Retrieving nutrition information...",
              tip: "🎯 Accurate product nutrition data!"
            },
            { 
              stage: "Scan Complete!", 
              progress: 100, 
              emoji: "✅",
              message: "Product information ready!",
              tip: "🚀 Easy nutrition tracking!"
            }
          ]
        };
      case 'label':
        return {
          title: 'Reading nutrition label...',
          subtitle: 'Extracting detailed nutrition information',
          stages: [
            { 
              stage: "Processing Label", 
              progress: 25, 
              emoji: "📄",
              message: "Reading nutrition facts label...",
              tip: "👁️ OCR technology at work!"
            },
            { 
              stage: "Extracting Data", 
              progress: 60, 
              emoji: "🔢",
              message: "Parsing nutrition values...",
              tip: "🎯 Precise data extraction!"
            },
            { 
              stage: "Validating Info", 
              progress: 85, 
              emoji: "✔️",
              message: "Verifying nutrition information...",
              tip: "🔍 Ensuring accuracy!"
            },
            { 
              stage: "Label Read!", 
              progress: 100, 
              emoji: "✅",
              message: "Nutrition label processed!",
              tip: "🚀 Ready for tracking!"
            }
          ]
        };
      default:
        return {
          title: 'Processing image...',
          subtitle: 'Analyzing your selected photo',
          stages: [
            { 
              stage: "Loading Image", 
              progress: 30, 
              emoji: "🖼️",
              message: "Processing selected image...",
              tip: "📸 Gallery photo analysis!"
            },
            { 
              stage: "Analyzing Content", 
              progress: 70, 
              emoji: "🔍",
              message: "Identifying food items...",
              tip: "🧠 AI vision processing!"
            },
            { 
              stage: "Analysis Complete!", 
              progress: 100, 
              emoji: "✅",
              message: "Image analysis finished!",
              tip: "🚀 Results ready!"
            }
          ]
        };
    }
  };

  const scanContent = getScanModeContent();
  const progressStages = scanContent.stages;

  // Animation setup
  useEffect(() => {
    // Ring rotation animation
    const ringLoop = Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    );
    ringLoop.start();

    // Glow animation
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

    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    pulseLoop.start();

    // Sparkle animation
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(sparkleAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    sparkleLoop.start();

    // Mascot bounce animation
    const mascotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotAnimation, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(mascotAnimation, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ])
    );
    mascotLoop.start();

    return () => {
      ringLoop.stop();
      glowLoop.stop();
      pulseLoop.stop();
      sparkleLoop.stop();
      mascotLoop.stop();
    };
  }, []);

  // Progress simulation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setEstimatedProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15 + 5, 95);
        
        // Update progress stage based on progress
        const newStage = progressStages.findIndex(stage => newProgress < stage.progress);
        setProgressStage(newStage === -1 ? progressStages.length - 1 : Math.max(0, newStage - 1));
        
        return newProgress;
      });
    }, 800);

    // Message cycling
    const messageInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(messageFadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(messageFadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      
      setCurrentMessageIndex(prev => (prev + 1) % 3);
    }, 3000);

    // Auto complete after realistic time
    const completeTimeout = setTimeout(() => {
      setEstimatedProgress(100);
      setProgressStage(progressStages.length - 1);
      setTimeout(() => {
        onComplete?.();
      }, 1000);
    }, 8000); // 8 seconds total

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(completeTimeout);
    };
  }, [progressStages.length, onComplete]);

  // Animation interpolations
  const ringRotate = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const sparkleOpacity = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const mascotScale = mascotAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const progressWidth = Animated.add(
    new Animated.Value(Math.max(5, estimatedProgress)),
    new Animated.Value(0)
  ).interpolate({
    inputRange: [0, 100],
    outputRange: ['5%', '100%'],
    extrapolate: 'clamp',
  });

  const currentStageData = progressStages[progressStage] || progressStages[0];

  return (
    <View style={styles.container}>
      {/* Background with captured image if available */}
      {capturedImageUri ? (
        <ImageBackground
          source={{ uri: capturedImageUri }}
          style={styles.backgroundImage}
          blurRadius={20}
        >
          <View style={styles.overlay} />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.gradientBackground}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Animated Ring with Food Icon */}
        <View style={styles.ringContainer}>
          {/* Glow Effect */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowOpacity,
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          />
          
          {/* Rotating Ring */}
          <Animated.View
            style={[
              styles.progressRing,
              {
                transform: [{ rotate: ringRotate }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FF6F4C', '#FF9F80', '#FFB3A0']}
              style={styles.ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Center Icon */}
          <View style={styles.centerIcon}>
            <Animated.Text style={[styles.centerEmoji, { opacity: sparkleOpacity }]}>
              {currentStageData.emoji}
            </Animated.Text>
          </View>

          {/* Sparkles */}
          <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>⭐</Text>
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle3, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>💫</Text>
          </Animated.View>
        </View>

        {/* Title and Subtitle */}
        <Text style={styles.title}>{scanContent.title}</Text>
        <Text style={styles.subtitle}>{scanContent.subtitle}</Text>

        {/* Progress Stage Indicator */}
        <View style={styles.progressStageContainer}>
          <Text style={styles.progressStageEmoji}>
            {currentStageData.emoji}
          </Text>
          <Text style={styles.progressStageText}>
            {currentStageData.stage}
          </Text>
        </View>

        {/* Enhanced Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                { width: progressWidth }
              ]}
            />
          </View>
          
          <Text style={styles.progressText}>
            {Math.max(5, Math.max(currentStageData.progress || 5, estimatedProgress)).toFixed(0)}%
          </Text>
        </View>

        {/* Loading Message */}
        <Animated.Text 
          style={[
            styles.loadingText,
            { opacity: messageFadeAnimation }
          ]}
        >
          {currentStageData.message}
        </Animated.Text>

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            {currentStageData.tip}
          </Text>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
  },
  gradientBackground: {
    position: 'absolute',
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 100,
  },
  ringContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FF6F4C',
    shadowColor: '#FF6F4C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  progressRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 8,
  },
  ringGradient: {
    flex: 1,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  centerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerEmoji: {
    fontSize: 50,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 20,
    left: 30,
  },
  sparkle2: {
    top: 40,
    right: 20,
  },
  sparkle3: {
    bottom: 30,
    left: 40,
  },
  sparkleText: {
    fontSize: 20,
    color: '#FFD700',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0C0',
    textAlign: 'center',
    marginBottom: 40,
  },
  progressStageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressStageEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  progressStageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B88CFF',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  progressBarBackground: {
    width: '85%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6F4C',
    borderRadius: 4,
    shadowColor: '#FF6F4C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6F4C',
  },
  loadingText: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  tipContainer: {
    backgroundColor: 'rgba(184, 140, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 140, 255, 0.3)',
  },
  tipText: {
    fontSize: 14,
    color: '#B88CFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    width: 100,
    height: 100,
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
});

export default FoodAnalysisLoadingScreen;
