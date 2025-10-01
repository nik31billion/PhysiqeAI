import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';

const { width, height } = Dimensions.get('window');

const OnboardingScreen2: React.FC = () => {
  const navigation = useNavigation();
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        Alert.alert('Sign In Failed', error.message || 'Google sign-in failed. Please try again.');
      } else {
        // Navigation will be handled automatically by AppNavigator
        // based on user's authentication and onboarding status
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    navigation.navigate('SignUpScreen' as never);
  };

  const handleLogin = () => {
    navigation.navigate('LoginScreen' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#B9F3E4', '#E0D9F7']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Main Card */}
      <View style={styles.card}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Main Text */}
        <Text style={styles.mainText}>
          Transform your body, your{'\n'}vibe, and your confidence{'\n'}and increase your aura.
        </Text>

        {/* Buttons Container */}
        <View style={styles.buttonsContainer}>
          {/* Google Button */}
          <TouchableOpacity 
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]} 
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIcon}>G</Text>
            </View>
            {googleLoading ? (
              <ActivityIndicator size="small" color="#2D2D2D" />
            ) : (
              <Text style={styles.buttonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          {/* Email Sign Up Button */}
          <TouchableOpacity style={styles.emailButton} onPress={handleEmailSignUp}>
            <Ionicons name="mail" size={20} color="#000000" style={styles.iconStyle} />
            <Text style={styles.buttonText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Ionicons name="log-in-outline" size={20} color="#937AFD" style={styles.loginIconStyle} />
            <Text style={styles.loginButtonText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom-Right Mascot */}
      <View style={styles.bottomMascotContainer}>
        <Image
          source={require('../assets/mascot/mascot thumbs up no bg.png')}
          style={styles.bottomMascotImage}
          resizeMode="contain"
        />
      </View>
    </View>
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
    top: height * 0.1,
    left: width * 0.06,
    right: width * 0.06,
    bottom: height * 0.08,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  mainText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 25,
    paddingHorizontal: 15,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    flex: 1,
    justifyContent: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#A3FFC7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#C2B4FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#937AFD',
  },
  googleIconContainer: {
    backgroundColor: '#4285F4',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  iconStyle: {
    marginRight: 12,
  },
  loginIconStyle: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#937AFD',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  bottomMascotContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    right: width * 0.05,
    zIndex: 5,
  },
  bottomMascotImage: {
    width: 64,
    height: 64,
    zIndex: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default OnboardingScreen2;
