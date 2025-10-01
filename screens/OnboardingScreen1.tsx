import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../utils/AuthContext';
import { useOnboarding } from '../utils/OnboardingContext';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';

const { width, height } = Dimensions.get('window');

const OnboardingScreen1: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { currentStep, isOnboardingComplete } = useOnboarding();
  const { goToStep } = useOnboardingNavigation();

  // Redirect authenticated users to the correct screen
  useEffect(() => {
    if (user) {
      if (isOnboardingComplete) {
        navigation.navigate('MainTabs' as never);
        return;
      }
      
      // If user is authenticated but not on step 1, redirect to their current step
      if (currentStep > 1) {
        goToStep(currentStep);
        return;
      }
    }
  }, [user, currentStep, isOnboardingComplete, navigation, goToStep]);

  const handleGetStarted = () => {
    navigation.navigate('OnboardingScreen2' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Full Screen Warm Gradient Background with Vignette */}
      <LinearGradient
        colors={['#C8F5E8', '#E1D6FB']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.vignette} />

      {/* Main Card */}
      <View style={styles.card}>
        {/* Central Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>World's First Aura-Based Fitness App</Text>

        {/* Large Get Started Button */}
        <LinearGradient
          colors={['#FFE8AD', '#FFCFB5']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 80,
    borderRadius: 0,
  },
  card: {
    position: 'absolute',
    top: height * 0.12,
    left: width * 0.08,
    right: width * 0.08,
    bottom: height * 0.15,
    backgroundColor: '#FBF8FF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 25,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 240,
    height: 240,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B5A95',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  buttonGradient: {
    borderRadius: 35,
    shadowColor: '#FFB887',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  button: {
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen1;
