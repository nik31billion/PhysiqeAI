import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';

const { width, height } = Dimensions.get('window');

const OnboardingScreen2: React.FC = () => {
  const navigation = useNavigation();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  // Check if Apple Sign-In is available (iOS only)
  useEffect(() => {
    const checkAppleAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleAvailable(available);
          console.log('🍎 Apple Sign-In available:', available);
        } catch (error) {
          console.error('🍎 Error checking Apple Sign-In availability:', error);
          setIsAppleAvailable(false);
        }
      } else {
        setIsAppleAvailable(false);
      }
    };

    checkAppleAvailability();
  }, []);

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

  const handleAppleSignIn = async () => {
    // Double-check availability before proceeding
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
      return;
    }

    setAppleLoading(true);
    try {
      console.log('🍎 Starting Apple Sign-In...');
      const { error } = await signInWithApple();
      
      if (error) {
        console.error('🍎 Apple Sign-In error:', error);
        console.error('🍎 Full error object:', JSON.stringify(error, null, 2));
        
        // Build detailed error message
        let errorMessage = error.message || 'Apple sign-in failed. Please try again.';
        let errorTitle = 'Sign In Failed';
        
        // Add more context based on error type
        if (error.message) {
          if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_grant')) {
            errorTitle = 'Configuration Error';
            errorMessage = 'Apple Sign-In is not properly configured. Please contact support.\n\nError: ' + error.message;
          } else if (error.message.includes('redirect_uri_mismatch')) {
            errorTitle = 'Configuration Error';
            errorMessage = 'Redirect URL mismatch. Please verify Apple Developer Console and Supabase configuration.\n\nError: ' + error.message;
          } else if (error.message.includes('client_id')) {
            errorTitle = 'Configuration Error';
            errorMessage = 'Service ID mismatch. Please verify Supabase Apple provider configuration.\n\nError: ' + error.message;
          }
        }
        
        // Don't show alert for user cancellation
        if (error.message && !error.message.includes('cancelled') && !error.message.includes('canceled')) {
          Alert.alert(
            errorTitle,
            errorMessage,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'View Details', 
                style: 'default',
                onPress: () => {
                  Alert.alert(
                    'Error Details',
                    `Message: ${error.message}\n\nCode: ${error.code || 'N/A'}\n\nStatus: ${error.status || 'N/A'}`,
                    [{ text: 'OK' }]
                  );
                }
              }
            ]
          );
        }
      } else {
        console.log('🍎 Apple Sign-In successful!');
        // Navigation will be handled automatically by AppNavigator
        // based on user's authentication and onboarding status
      }
    } catch (err: any) {
      console.error('🍎 Apple Sign-In exception:', err);
      console.error('🍎 Exception details:', {
        message: err?.message,
        code: err?.code,
        name: err?.name,
        stack: err?.stack,
      });
      
      // Show detailed error
      Alert.alert(
        'Sign-In Error',
        `An error occurred during Apple Sign-In.\n\n${err?.message || 'Unknown error'}\n\nPlease check:\n1. You are signed into iCloud\n2. Apple Sign-In is configured in Supabase\n3. Your device supports Apple Sign-In`,
        [
          { text: 'OK' },
          {
            text: 'Details',
            onPress: () => {
              Alert.alert(
                'Error Details',
                `Message: ${err?.message || 'N/A'}\n\nCode: ${err?.code || 'N/A'}\n\nName: ${err?.name || 'N/A'}`,
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } finally {
      setAppleLoading(false);
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

          {/* Apple Button - Only show on iOS when available */}
          {Platform.OS === 'ios' && isAppleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={22}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          ) : Platform.OS === 'ios' && !isAppleAvailable ? (
            // Fallback button for iOS when Apple Sign-In is not available
            <TouchableOpacity
              style={[styles.appleButtonFallback, appleLoading && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={appleLoading}
            >
              {appleLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.iconStyle} />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

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
  appleButton: {
    width: '100%',
    height: 50,
  },
  appleButtonFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 50,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
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
