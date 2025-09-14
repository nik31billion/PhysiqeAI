import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Alert,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

const OnboardingScreen18: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [motivationLevel, setMotivationLevel] = useState<number>(0);
  const [isSliderActive, setIsSliderActive] = useState<boolean>(false);
  const [showValidationError, setShowValidationError] = useState(false);
  
  // Animation values
  const glowAnimation = new Animated.Value(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsSliderActive(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        const currentPosition = (motivationLevel / 100) * (sliderWidth - knobSize);
        const newPosition = Math.max(0, Math.min(sliderWidth - knobSize, currentPosition + dx));
        const newValue = (newPosition / (sliderWidth - knobSize)) * 100;
        setMotivationLevel(newValue);
        setShowValidationError(false);
      },
      onPanResponderRelease: () => {
        setIsSliderActive(false);
      },
    })
  ).current;

  const sliderWidth = width * 0.75;
  const knobSize = 36;
  const knobPosition = (motivationLevel / 100) * (sliderWidth - knobSize);

  useEffect(() => {
    // Continuous glow animation
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


    return () => {
      glowLoop.stop();
    };
  }, []);

  const handleSliderPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newValue = Math.max(0, Math.min(100, (locationX / sliderWidth) * 100));
    setMotivationLevel(newValue);
    setIsSliderActive(true);
    setShowValidationError(false);
  };


  const handleContinue = async () => {
    if (motivationLevel === 0) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    
    // Convert slider value (0-100) to motivation level (1-10)
    const motivationLevelScaled = Math.round((motivationLevel / 100) * 9) + 1;
    
    console.log('Motivation Level - Slider Value:', motivationLevel);
    console.log('Motivation Level - Scaled Value:', motivationLevelScaled);
    
    const success = await navigateToNextStep(18, {
      motivation_level: motivationLevelScaled,
    });
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };


  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
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
          colors={['#E8FDF5', '#F7EDFF', '#FFF8D1']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      

      {/* Main Card */}
      <View style={styles.card}>
        {/* Frosted glass effect */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.cardGradient}
        />
        {/* Heading */}
        <Text style={styles.heading}>
          How motivated are you{'\n'}to transform?
        </Text>

        {/* Motivation Slider */}
        <View style={styles.sliderContainer}>
          {/* Slider Labels */}
          <View style={styles.sliderLabels}>
            <Text style={styles.leftLabel}>Just curious</Text>
            <Text style={[
              styles.rightLabel,
              motivationLevel > 50 && styles.rightLabelGlow
            ]}>
              All in!
            </Text>
          </View>

          {/* Slider Aura/Glow */}
          <Animated.View 
            style={[
              styles.sliderAura,
              {
                opacity: glowOpacity,
                transform: [{
                  scale: glowAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  })
                }]
              }
            ]}
          />

          {/* Slider Track */}
          <View style={styles.sliderTrack}>
            <TouchableOpacity
              style={styles.sliderTrackTouchable}
              onPress={handleSliderPress}
              activeOpacity={1}
            >
              <LinearGradient
                colors={['#B7FCE7', '#FFF8D1', '#FFD1DC']}
                style={styles.sliderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.sliderInnerOverlay} />
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Slider Knob */}
            <Animated.View
              style={[
                styles.sliderKnob,
                {
                  left: knobPosition,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.knobInner} />
              <View style={styles.knobGlow} />
            </Animated.View>
          </View>

          {/* Instructional Text */}
          <Text style={styles.instructionText}>
            Your vibe sets your journey. Slide to choose your starting energy!
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.simpleButton}
          onPress={() => {
            navigation.navigate('OnboardingScreen19' as never);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.simpleButtonText}>Continue</Text>
        </TouchableOpacity>


        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <TouchableOpacity activeOpacity={1}>
            <Image
              source={require('../assets/mascot/motivating no bg.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
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
  card: {
    position: 'absolute',
    top: height * 0.08,
    left: width * 0.04,
    right: width * 0.04,
    bottom: height * 0.08,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 40,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 36,
    paddingHorizontal: 20,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  sliderLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  leftLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    fontFamily: 'System',
  },
  rightLabel: {
    fontSize: 18,
    color: '#FF63A6',
    fontWeight: '800',
    fontFamily: 'System',
    textShadowColor: 'rgba(255, 99, 166, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rightLabelGlow: {
    textShadowColor: 'rgba(255, 99, 166, 0.6)',
    textShadowRadius: 8,
  },
  sliderAura: {
    position: 'absolute',
    width: width * 0.85,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(183, 252, 231, 0.2)',
    top: -10,
  },
  sliderTrack: {
    width: width * 0.75,
    height: 24,
    borderRadius: 12,
    position: 'relative',
  },
  sliderTrackTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  sliderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'relative',
  },
  sliderInnerOverlay: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 9,
  },
  sliderKnob: {
    position: 'absolute',
    top: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFE066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE066',
  },
  knobGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 224, 102, 0.1)',
    top: -7,
    left: -7,
  },
  instructionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 25,
    lineHeight: 24,
    paddingHorizontal: 25,
    fontFamily: 'System',
    fontWeight: '500',
  },
  simpleButton: {
    width: '100%',
    backgroundColor: '#B7FCE7',
    borderRadius: 35,
    paddingVertical: 20,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  simpleButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  mascotImage: {
    width: 120,
    height: 120,
  },
  buttonTextDisabled: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9CA3AF',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  validationError: {
    fontSize: 14,
    color: '#E53E3E',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default OnboardingScreen18;
