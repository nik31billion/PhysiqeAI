import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { invalidateCacheForAuth } from './universalCacheInvalidation';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { GOOGLE_AUTH_CONFIG } from './googleAuthConfig';
import * as AppleAuthentication from 'expo-apple-authentication';
import { captureException, addBreadcrumb, setSentryUser, clearSentryUser } from './sentryConfig';
import { useCaloriesStore } from './stores/caloriesStore';
import { useAuraStore } from './stores/auraStore';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = React.useRef<string | null>(null);

  // Configure Google Sign-In with error handling
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        // Add timeout to Google Sign-In configuration
        const configurePromise = GoogleSignin.configure({
          webClientId: GOOGLE_AUTH_CONFIG.webClientId,
          iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
          ...(Platform.OS === 'android' && { androidClientId: GOOGLE_AUTH_CONFIG.androidClientId }),
          offlineAccess: true,
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Google Sign-In configuration timeout')), 3000);
        });

        await Promise.race([configurePromise, timeoutPromise]);
        console.log('Google Sign-In configured successfully');
      } catch (error) {
        console.error('Failed to configure Google Sign-In:', error);
        // Don't crash the app if Google Sign-In configuration fails
      }
    };

    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        captureException(new Error(`Failed to get initial session: ${error.message}`), {
          auth: {
            operation: 'getSession',
            errorCode: error.status || 'unknown',
            errorMessage: error.message,
          },
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        auth: {
          operation: 'getSession',
          errorType: 'exception',
        },
      });
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      addBreadcrumb('Auth state changed', 'auth', { event, hasSession: !!session });
      
      const newUserId = session?.user?.id || null;
      const previousUserId = previousUserIdRef.current;
      
      // Reset stores when:
      // 1. User logs out (SIGNED_OUT event)
      // 2. New user logs in (SIGNED_IN event)
      // 3. User switches accounts (different userId)
      const shouldResetStores = 
        event === 'SIGNED_OUT' || 
        (event === 'SIGNED_IN' && newUserId) ||
        (previousUserId && newUserId && previousUserId !== newUserId);
      
      if (shouldResetStores) {
        try {
          useCaloriesStore.getState().reset();
          useAuraStore.getState().reset();
          console.log('Zustand stores reset on auth state change:', event, {
            previousUserId,
            newUserId,
            isUserSwitch: previousUserId && newUserId && previousUserId !== newUserId
          });
        } catch (storeError) {
          console.error('Error resetting stores on auth change:', storeError);
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      previousUserIdRef.current = newUserId;
      
      // Set Sentry user context when user logs in
      if (session?.user) {
        setSentryUser({
          id: session.user.id,
          email: session.user.email || null,
          subscriptionStatus: 'free', // TODO: Get actual subscription status if available
        });
      } else {
        // Clear Sentry user context when user logs out
        clearSentryUser();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      addBreadcrumb('User sign up attempt', 'auth', { email: email.substring(0, 5) + '...' });
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        captureException(new Error(`Sign up failed: ${error.message}`), {
          auth: {
            operation: 'signUp',
            errorCode: error.status || 'unknown',
            errorMessage: error.message,
          },
        });
      } else {
        addBreadcrumb('User sign up successful', 'auth');
      }
      
      return { error };
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        auth: {
          operation: 'signUp',
          errorType: 'exception',
        },
      });
      return { error: { message: 'An unexpected error occurred during sign up' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      addBreadcrumb('User sign in attempt', 'auth', { email: email.substring(0, 5) + '...' });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        captureException(new Error(`Sign in failed: ${error.message}`), {
          auth: {
            operation: 'signIn',
            errorCode: error.status || 'unknown',
            errorMessage: error.message,
          },
        });
      } else {
        addBreadcrumb('User sign in successful', 'auth');
      }
      
      // Invalidate cache after successful login
      if (!error && user?.id) {
        invalidateCacheForAuth(user.id, 'login');
      }
      
      return { error };
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        auth: {
          operation: 'signIn',
          errorType: 'exception',
        },
      });
      return { error: { message: 'An unexpected error occurred during sign in' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      addBreadcrumb('Google sign in attempt', 'auth');
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        const error = new Error('No ID token received from Google');
        captureException(error, {
          auth: {
            operation: 'signInWithGoogle',
            errorType: 'missing_token',
          },
        });
        throw error;
      }

      // Create a Google credential with the token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        captureException(new Error(`Google sign in failed: ${error.message}`), {
          auth: {
            operation: 'signInWithGoogle',
            errorCode: error.status || 'unknown',
            errorMessage: error.message,
          },
        });
      } else {
        addBreadcrumb('Google sign in successful', 'auth');
        // Set Sentry user context after successful sign in
        if (data?.user) {
          setSentryUser({
            id: data.user.id,
            email: data.user.email || null,
            subscriptionStatus: 'free', // TODO: Get actual subscription status if available
          });
        }
      }

      // Invalidate cache after successful login
      if (!error && data.user?.id) {
        invalidateCacheForAuth(data.user.id, 'login');
      }

      return { error };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        auth: {
          operation: 'signInWithGoogle',
          errorType: 'exception',
          errorMessage: error.message || 'Unknown error',
        },
      });
      return { error: { message: error.message || 'Google sign-in failed' } };
    }
  };

  const signInWithApple = async () => {
    try {
      // Platform check first
      if (Platform.OS !== 'ios') {
        console.error('🍎 Apple Sign-In Error: Not on iOS platform');
        return { error: { message: 'Apple Sign-In is only available on iOS devices' } };
      }

      // Check if Apple Sign-In is available
      let isAvailable = false;
      try {
        isAvailable = await AppleAuthentication.isAvailableAsync();
        console.log('🍎 Apple Sign-In availability check:', isAvailable);
      } catch (availabilityError: any) {
        console.error('🍎 Error checking Apple Sign-In availability:', availabilityError);
        return { 
          error: { 
            message: 'Unable to check Apple Sign-In availability. Please ensure you are signed in to iCloud on your device.' 
          } 
        };
      }

      if (!isAvailable) {
        console.error('🍎 Apple Sign-In not available on this device');
        return { 
          error: { 
            message: 'Apple Sign-In is not available on this device. Please ensure you are signed in to iCloud.' 
          } 
        };
      }

      console.log('🍎 Requesting Apple Sign-In credential...');
      // Request Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 Apple credential received:', {
        user: credential.user,
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode,
        email: credential.email,
        fullName: credential.fullName,
      });

      if (!credential.identityToken) {
        console.error('🍎 No identity token received from Apple');
        return { error: { message: 'No identity token received from Apple. Please try again.' } };
      }

      console.log('🍎 Authenticating with Supabase...');
      // Create an Apple credential with the token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('🍎 Supabase authentication error:', error);
        console.error('🍎 Full error object:', JSON.stringify(error, null, 2));
        console.error('🍎 Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          code: (error as any).code,
        });
        
        // Capture in Sentry with detailed context
        captureException(new Error(`Apple sign in failed: ${error.message}`), {
          auth: {
            operation: 'signInWithApple',
            errorCode: error.status || 'unknown',
            errorMessage: error.message,
            errorName: error.name,
            hasIdentityToken: !!credential.identityToken,
          },
        });
        
        // Log specific error types for debugging
        if (error.message?.includes('Invalid login credentials')) {
          console.error('🍎❌ INVALID CREDENTIALS - Check:');
          console.error('   1. Service ID in Supabase matches Apple Developer Console');
          console.error('   2. JWT token in Supabase is valid and not expired');
          console.error('   3. Key ID and Team ID are correct');
        }
        if (error.message?.includes('redirect_uri')) {
          console.error('🍎❌ REDIRECT URI MISMATCH - Check:');
          console.error('   1. Return URLs in Apple Developer Console');
          console.error('   2. Redirect URLs in Supabase Dashboard');
          console.error('   3. URLs must match exactly');
        }
      } else {
        console.log('🍎✅ Supabase authentication successful:', {
          userId: data.user?.id,
          email: data.user?.email,
          provider: data.user?.app_metadata?.provider,
        });
        addBreadcrumb('Apple sign in successful', 'auth');
        // Set Sentry user context after successful sign in
        if (data?.user) {
          setSentryUser({
            id: data.user.id,
            email: data.user.email || null,
            subscriptionStatus: 'free', // TODO: Get actual subscription status if available
          });
        }
      }

      // Invalidate cache after successful login
      if (!error && data.user?.id) {
        invalidateCacheForAuth(data.user.id, 'login');
      }

      return { error };
    } catch (error: any) {
      console.error('🍎 Apple Sign-In Exception:', error);
      console.error('🍎 Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      
      // Capture in Sentry (unless user cancelled)
      if (error.code !== 'ERR_REQUEST_CANCELED' && error.code !== 'ERR_CANCELED') {
        captureException(error instanceof Error ? error : new Error(String(error)), {
          auth: {
            operation: 'signInWithApple',
            errorCode: error.code,
            errorMessage: error.message,
            errorName: error.name,
          },
        });
      }
      
      // Handle specific error codes
      if (error.code === 'ERR_REQUEST_CANCELED' || error.code === 'ERR_CANCELED') {
        console.log('🍎 User cancelled Apple Sign-In');
        return { error: { message: 'Sign-in was cancelled' } };
      }
      
      if (error.code === 'ERR_INVALID_RESPONSE') {
        return { error: { message: 'Invalid response from Apple. Please try again.' } };
      }
      
      if (error.code === 'ERR_NOT_AVAILABLE') {
        return { error: { message: 'Apple Sign-In is not available on this device.' } };
      }
      
      // Handle Supabase-specific errors with detailed messages
      if (error.message && error.message.includes('Invalid login credentials')) {
        return { 
          error: { 
            message: 'Invalid login credentials. Please verify Apple Sign-In is properly configured in Supabase. Check Service ID, JWT token, and redirect URLs.',
            code: error.code || 'INVALID_CREDENTIALS',
            status: error.status || 400,
          } 
        };
      }
      
      if (error.message && error.message.includes('redirect_uri')) {
        return {
          error: {
            message: 'Redirect URL mismatch. Please verify return URLs in Apple Developer Console match Supabase configuration.',
            code: error.code || 'REDIRECT_URI_MISMATCH',
            status: error.status || 400,
          }
        };
      }
      
      if (error.message && error.message.includes('client_id')) {
        return {
          error: {
            message: 'Service ID mismatch. Please verify the Service ID in Supabase matches your Apple Developer Console configuration.',
            code: error.code || 'CLIENT_ID_MISMATCH',
            status: error.status || 400,
          }
        };
      }
      
      // Generic error message
      const errorMessage = error.message || error.toString() || 'Apple sign-in failed. Please try again.';
      console.error('🍎 Returning generic error:', errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      addBreadcrumb('User sign out attempt', 'auth');
      
      // Check if user is signed in with Google and sign out
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        console.log('User is signed in with Google, proceeding with logout...');
        // Revoke access to completely sign out from Google
        await GoogleSignin.revokeAccess();
        // Also call signOut for good measure
        await GoogleSignin.signOut();
        console.log('Successfully signed out from Google');
      } else {
        console.log('User is not signed in with Google');
      }
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        auth: {
          operation: 'signOut',
          errorType: 'google_signout',
        },
      });
      // Try to sign out anyway as a fallback
      try {
        await GoogleSignin.signOut();
        console.log('Fallback Google sign-out successful');
      } catch (fallbackError) {
        console.error('Fallback Google sign-out failed:', fallbackError);
      }
    }
    
    // Invalidate cache before signing out
    if (user?.id) {
      invalidateCacheForAuth(user.id, 'logout');
    }
    
    // Reset Zustand stores to clear user-specific data
    try {
      useCaloriesStore.getState().reset();
      useAuraStore.getState().reset();
      console.log('Zustand stores reset on logout');
    } catch (storeError) {
      console.error('Error resetting stores on logout:', storeError);
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign-out error:', error);
      captureException(new Error(`Sign out failed: ${error.message}`), {
        auth: {
          operation: 'signOut',
          errorCode: error.status || 'unknown',
          errorMessage: error.message,
        },
      });
    } else {
      console.log('Successfully signed out from Supabase');
      addBreadcrumb('User sign out successful', 'auth');
      // Clear Sentry user context on sign out
      clearSentryUser();
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
