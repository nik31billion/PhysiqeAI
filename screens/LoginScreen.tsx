import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';

const { width, height } = Dimensions.get('window');

// iPad-specific responsive adjustments
const isTablet = width >= 768;
const responsiveWidth = isTablet ? Math.min(width * 0.4, 400) : width * 0.88;
const responsiveMargin = isTablet ? (width - responsiveWidth) / 2 : width * 0.06;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        // Navigation will be handled automatically by AppNavigator
        // based on user's authentication and onboarding status
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

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

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#B9F3E4', '#E0D9F7']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#937AFD" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <View style={styles.placeholder} />
          </View>

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
            Welcome back! Let's continue{'\n'}your transformation journey.
          </Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#937AFD" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#937AFD" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          {/* Login Button */}
          <LinearGradient
            colors={['#FFF9CA', '#F5C6EC']}
            style={styles.loginButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#2D2D2D" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In Buttons */}
          <View style={styles.socialButtonsContainer}>
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
                <Text style={styles.socialButtonText}>Continue with Google</Text>
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
          </View>

          {/* Sign Up Link */}
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
            <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignUpScreen' as never)}>
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Bottom-Right Mascot */}
      <View style={styles.bottomMascotContainer}>
        <Image
          source={require('../assets/mascot/mascot thumbs up no bg.png')}
          style={styles.bottomMascotImage}
          resizeMode="contain"
        />
      </View>
    </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  card: {
    marginHorizontal: responsiveMargin,
    width: responsiveWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
    paddingVertical: isTablet ? 40 : 30,
    paddingHorizontal: isTablet ? 35 : 25,
    minHeight: isTablet ? height * 0.75 : height * 0.85,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  placeholder: {
    width: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  logoImage: {
    width: isTablet ? 120 : 100,
    height: isTablet ? 120 : 100,
  },
  mainText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#A3FFC7',
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingVertical: isTablet ? 16 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    minHeight: isTablet ? 56 : 50, // Ensure minimum touch target size
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: isTablet ? 16 : 15,
    color: '#2D2D2D',
    fontWeight: '500',
    minHeight: isTablet ? 44 : 40, // Ensure minimum touch target size
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  loginButtonGradient: {
    width: '100%',
    borderRadius: 22,
    shadowColor: '#F5C6EC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 198, 236, 0.4)',
    marginBottom: 20,
  },
  loginButton: {
    paddingVertical: isTablet ? 18 : 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    minHeight: isTablet ? 56 : 50, // Ensure minimum touch target size
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.2,
  },
  signUpText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  signUpLink: {
    fontWeight: '700',
    color: '#937AFD',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E5E9',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  socialButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: isTablet ? 16 : 14,
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
    minHeight: isTablet ? 56 : 50,
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
    paddingVertical: isTablet ? 16 : 14,
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
  socialButtonText: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  appleButtonText: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
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
});

export default LoginScreen;
