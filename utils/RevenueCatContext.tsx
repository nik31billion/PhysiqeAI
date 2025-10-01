import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isProUser: boolean;
  loading: boolean;
  restorePurchases: () => Promise<CustomerInfo | null>;
  offerings: any;
  fetchOfferings: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<any>(null);

  // Configure RevenueCat SDK with enhanced error handling
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Configure RevenueCat with platform-specific API key
        // Set log level to ERROR to avoid debug logging issues
        Purchases.setLogLevel(LOG_LEVEL.ERROR);
        
        // Select API key based on platform
        const apiKey = Platform.OS === 'ios' 
          ? 'appl_mbYWUpNYylmuxaUoskkidLitIre'  // Replace with your actual iOS API key from Revenue Cat
          : 'goog_GbSInxtARSeejPPTFnWzfQaGuIr';  // Your existing Android API key
        
        console.log(`🚀 Initializing RevenueCat for platform: ${Platform.OS}`);
        
        // Configure with timeout
        const configurePromise = Purchases.configure({
          apiKey: apiKey,
        });

        // Add timeout to configuration
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('RevenueCat configuration timeout')), 5000);
        });

        await Promise.race([configurePromise, timeoutPromise]);

        // Set up customer info listener
        Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
        });

        console.log('RevenueCat SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RevenueCat SDK:', error);
        // Don't let RevenueCat errors crash the app
        setCustomerInfo(null);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('RevenueCat initialization timeout');
        setLoading(false);
      }
    }, 8000); // 8 second timeout

    initializeRevenueCat();

    return () => clearTimeout(timeoutId);
  }, []);

  // Handle user authentication changes
  useEffect(() => {
    const handleAuthChange = async () => {
      // Only proceed if RevenueCat is initialized (not loading)
      if (loading) {
        console.log('RevenueCat still initializing, skipping auth change');
        return;
      }

      try {
        if (user) {
          // Log in user with Supabase user ID
          console.log('Logging in RevenueCat user with Supabase ID:', user.id);
          const { customerInfo } = await Purchases.logIn(user.id);
          setCustomerInfo(customerInfo);
          console.log('RevenueCat login successful, active entitlements:', Object.keys(customerInfo.entitlements.active));
        } else {
          // Log out user - no need to call logOut for anonymous users
          console.log('User logged out, RevenueCat will use anonymous ID');
          // Get current customer info for anonymous user
          const customerInfo = await Purchases.getCustomerInfo();
          setCustomerInfo(customerInfo);
        }
      } catch (error) {
        console.error('Error handling RevenueCat auth change:', error);
        // Try to get customer info anyway
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          setCustomerInfo(customerInfo);
        } catch (fallbackError) {
          console.error('Failed to get customer info as fallback:', fallbackError);
        }
      }
    };

    // Add a small delay to ensure RevenueCat is fully initialized
    const timeoutId = setTimeout(() => {
      handleAuthChange();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, loading]);

  // Fetch offerings
  const fetchOfferings = async () => {
    if (loading) {
      console.log('RevenueCat not initialized yet, cannot fetch offerings');
      return;
    }

    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
      console.log('Fetched RevenueCat offerings:', offerings);
    } catch (error) {
      console.error('Error fetching offerings:', error);
      throw error;
    }
  };

  // Restore purchases
  const restorePurchases = async (): Promise<CustomerInfo | null> => {
    if (loading) {
      console.log('RevenueCat not initialized yet, cannot restore purchases');
      return null;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      console.log('Purchases restored successfully, active entitlements:', Object.keys(customerInfo.entitlements.active));
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return null;
    }
  };

  // Refresh customer info
  const refreshCustomerInfo = async () => {
    if (loading) {
      console.log('RevenueCat not initialized yet, cannot refresh customer info');
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(customerInfo);
      console.log('Customer info refreshed successfully, active entitlements:', Object.keys(customerInfo.entitlements.active));
    } catch (error) {
      console.error('Error refreshing customer info:', error);
    }
  };

  // Check if user is pro (has active entitlement)
  const isProUser = customerInfo?.entitlements.active ? Object.keys(customerInfo.entitlements.active).length > 0 : false;

  const value = {
    customerInfo,
    isProUser,
    loading,
    restorePurchases,
    offerings,
    fetchOfferings,
    refreshCustomerInfo,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};
