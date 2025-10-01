import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { invalidateCacheForAuth } from './universalCacheInvalidation';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { GOOGLE_AUTH_CONFIG } from './googleAuthConfig';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Invalidate cache after successful login
    if (!error && user?.id) {
      invalidateCacheForAuth(user.id, 'login');
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create a Google credential with the token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      // Invalidate cache after successful login
      if (!error && data.user?.id) {
        invalidateCacheForAuth(data.user.id, 'login');
      }

      return { error };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      return { error: { message: error.message || 'Google sign-in failed' } };
    }
  };

  const signOut = async () => {
    try {
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
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign-out error:', error);
    } else {
      console.log('Successfully signed out from Supabase');
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
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
