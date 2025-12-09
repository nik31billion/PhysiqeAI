import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { initializeFirebase } from './firebaseConfig';
import { logAppOpen } from './analyticsService';

interface AnalyticsContextType {
  isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Firebase Analytics
    const init = async () => {
      try {
        console.log('🚀 Initializing Firebase Analytics...');
        const app = await initializeFirebase();
        
        if (app) {
          setIsReady(true);
          console.log('✅ Firebase Analytics ready!');
          
          // Log app open - fire and forget (no await)
          logAppOpen();
        } else {
          console.warn('⚠️ Firebase Analytics not initialized. Analytics will be disabled.');
          console.warn('⚠️ Make sure google-services.json (Android) or GoogleService-Info.plist (iOS) is in place.');
        }
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Analytics:', error);
      }
    };

    init();

    // Track app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active');
        // Fire and forget (no await)
        logAppOpen();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const value = {
    isReady,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

