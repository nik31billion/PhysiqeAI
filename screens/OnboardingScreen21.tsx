import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components/OnboardingErrorHandler';
import { useRevenueCat } from '../utils/RevenueCatContext';
import Purchases from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

const OnboardingScreen21: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const { offerings, fetchOfferings, loading: rcLoading, customerInfo } = useRevenueCat();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'yearly-auto'>('monthly');
  const [showValidationError, setShowValidationError] = useState(false);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  
  // Animation values
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    // Fetch RevenueCat offerings with enhanced iOS debugging
    const loadOfferings = async () => {
      try {
        setOfferingsError(null);
        console.log(`🔄 Loading offerings for platform: ${Platform.OS}`);
        await fetchOfferings();
      } catch (error: any) {
        console.error(`❌ Error fetching offerings on ${Platform.OS}:`, {
          message: error.message,
          code: error.code,
          platform: Platform.OS
        });
        
        // iOS-specific error messages
        if (Platform.OS === 'ios') {
          if (error.code === 'NETWORK_ERROR') {
            setOfferingsError('Network error loading subscription plans. Please check your internet connection and try again.');
          } else if (error.code === 'CONFIGURATION_ERROR') {
            setOfferingsError('Subscription configuration error. Please contact support if this persists.');
          } else if (error.message?.includes('API key')) {
            setOfferingsError('Subscription service configuration issue. Please contact support.');
          } else {
            setOfferingsError('Failed to load subscription plans on iOS. Please check your internet connection and try again.');
          }
        } else {
          setOfferingsError('Failed to load subscription plans. Please check your internet connection.');
        }
      }
    };

    loadOfferings();

    return () => {
      glowLoop.stop();
    };
  }, []);

  // Helper function to get monthly package from offerings
  const getMonthlyPackage = () => {
    if (!offerings?.current?.monthly) return null;
    return offerings.current.monthly;
  };

  // Helper function to get annual package from offerings
  const getAnnualPackage = () => {
    // Debug logging
    console.log('🔍 Checking for annual package...');
    console.log('offerings:', offerings);
    console.log('offerings.current:', offerings?.current);
    console.log('offerings.current.availablePackages:', offerings?.current?.availablePackages);
    
    if (!offerings?.current?.annual) {
      console.log('❌ No annual package found in offerings.current.annual');
      console.log('Available package identifiers:', 
        offerings?.current?.availablePackages?.map((pkg: any) => pkg.identifier)
      );
      return null;
    }
    console.log('✅ Annual package found:', offerings.current.annual);
    return offerings.current.annual;
  };

  // Helper function to get yearly package with free trial from offerings
  const getYearlyAutoPackage = () => {
    // Use the existing annual package which now has the free trial
    return getAnnualPackage();
  };

  // Helper function to format price
  const formatPrice = (packageItem: any) => {
    if (!packageItem?.product?.priceString) return 'Loading...';
    return packageItem.product.priceString;
  };

  // Helper function to get button text based on selected plan
  const getButtonText = () => {
    if (selectedPlan === 'yearly-auto') {
      return 'Get your 7-day free trial';
    } else if (selectedPlan === 'monthly') {
      return `Subscribe for ${getSelectedPackage() ? formatPrice(getSelectedPackage()) : '₹300.00'}`;
    } else if (selectedPlan === 'annual') {
      return `Subscribe for ${getSelectedPackage() ? formatPrice(getSelectedPackage()) : '₹2000.00'}`;
    }
    return 'Subscribe for ₹300.00';
  };

  // Helper function to get package identifier for selected plan
  const getSelectedPackage = () => {
    if (selectedPlan === 'monthly') return getMonthlyPackage();
    if (selectedPlan === 'annual') return getAnnualPackage();
    if (selectedPlan === 'yearly-auto') return getYearlyAutoPackage();
    return null;
  };

  const handleContinue = async () => {
    // Validation: A plan must be selected and package available
    const selectedPackage = getSelectedPackage();
    if (!selectedPlan || !selectedPackage) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    setPurchaseError(null);
    setPurchasing(true);

    try {
      console.log('🛒 Starting purchase for package:', selectedPackage.identifier);
      
      // Make the purchase using RevenueCat
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(selectedPackage);
      
      console.log('✅ Purchase successful!', {
        productIdentifier,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        originalAppUserId: customerInfo.originalAppUserId
      });

      // Check if user now has active entitlements
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (hasActiveSubscription) {
        console.log('🎉 User now has active subscription!');
        
        // Save the purchase info and continue onboarding
        const stepData = {
          selected_plan: selectedPlan,
          purchase_successful: true,
          product_identifier: productIdentifier,
          revenue_cat_user_id: customerInfo.originalAppUserId,
        };

        const success = await navigateToNextStep(21, stepData);
        if (!success) {
          console.error('Failed to save step data after successful purchase');
        }
      } else {
        // Purchase completed but no active entitlements
        setPurchaseError('Purchase completed but subscription is not active. Please contact support.');
      }

    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      // Handle different types of purchase errors
      if (error.userCancelled) {
        setPurchaseError('Purchase was cancelled. You can try again anytime.');
      } else if (error.code === 'PURCHASE_NOT_ALLOWED_ERROR') {
        setPurchaseError('Purchases are not allowed on this device. Please check your device settings.');
      } else if (error.code === 'PAYMENT_PENDING_ERROR') {
        setPurchaseError('Your payment is pending. You will receive your subscription once payment is confirmed.');
      } else if (error.code === 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR') {
        setPurchaseError('This subscription is not available for purchase. Please try again later.');
      } else {
        setPurchaseError(error.message || 'Purchase failed. Please check your payment method and try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };


  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
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
        colors={['#E9FBF1', '#F8EFFF', '#FFF2E9']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle glowing spots for depth */}
      <View style={styles.glowSpots}>
        <Animated.View 
          style={[
            styles.glowSpot,
            styles.glowSpot1,
            { opacity: glowOpacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.glowSpot,
            styles.glowSpot2,
            { opacity: glowOpacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.glowSpot,
            styles.glowSpot3,
            { opacity: glowOpacity }
          ]} 
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.heading}>
          Your custom Vibe Plan is ready!{'\n'}
          Unlock your journey and see yourself just like{'\n'}
          your idol.
        </Text>

        {/* Features Card */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="bulb" size={20} color="white" />
            </View>
            <Text style={styles.featureText}>Personalized plan: diet, workout, tips</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#00BCD4' }]}>
              <Ionicons name="trending-up" size={20} color="white" />
            </View>
            <Text style={styles.featureText}>Progress photo tool</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="radio" size={20} color="white" />
            </View>
            <Text style={styles.featureText}>Vibe & aura tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="chatbubble" size={20} color="white" />
            </View>
            <Text style={styles.featureText}>Daily motivation from your AI coach</Text>
          </View>
        </View>

        {/* Plan Options */}
        {rcLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading subscription plans...</Text>
          </View>
        ) : offeringsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{offeringsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={async () => {
                try {
                  setOfferingsError(null);
                  await fetchOfferings();
                } catch (error) {
                  setOfferingsError('Failed to load subscription plans. Please check your internet connection.');
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.planOptionsContainer}>
            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
                !getMonthlyPackage() && styles.planCardDisabled
              ]}
              onPress={() => getMonthlyPackage() && setSelectedPlan('monthly')}
              disabled={!getMonthlyPackage()}
            >
              <Animated.View 
                style={[
                  styles.planCardGlow,
                  selectedPlan === 'monthly' && styles.planCardGlowSelected,
                  { opacity: selectedPlan === 'monthly' ? glowOpacity : 0.3 }
                ]}
              />
              <Text style={styles.planPrice}>
                {getMonthlyPackage() ? formatPrice(getMonthlyPackage()) : 'Not Available'}
              </Text>
              <Text style={styles.planSubtitle}>Pay monthly, cancel anytime</Text>
            </TouchableOpacity>

            {/* Annual Plan with Free Trial */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly-auto' && styles.planCardSelected,
                !getYearlyAutoPackage() && styles.planCardDisabled
              ]}
              onPress={() => getYearlyAutoPackage() && setSelectedPlan('yearly-auto')}
              disabled={!getYearlyAutoPackage()}
            >
              <Animated.View 
                style={[
                  styles.planCardGlow,
                  selectedPlan === 'yearly-auto' && styles.planCardGlowSelected,
                  { opacity: selectedPlan === 'yearly-auto' ? glowOpacity : 0.3 }
                ]}
              />
              <View style={styles.saveTag}>
                <Text style={styles.saveTagText}>Best Value</Text>
              </View>
              <View style={styles.freeTrialBadge}>
                <Text style={styles.freeTrialText}>7-Day Free Trial</Text>
              </View>
              <Text style={styles.planPrice}>
                {getYearlyAutoPackage() ? formatPrice(getYearlyAutoPackage()) : 'Not Available'}
              </Text>
              <Text style={styles.planSubtitle}>Free for 7 days, then yearly billing</Text>
              <Text style={styles.trialNote}>Payment method required • No charge during trial</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <View style={styles.paymentIcon}>
            <Ionicons name="logo-apple" size={24} color="#666" />
          </View>
          <View style={styles.paymentIcon}>
            <Ionicons name="logo-google" size={24} color="#666" />
          </View>
          <View style={styles.paymentIcon}>
            <Ionicons name="card" size={24} color="#666" />
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          {/* Button Glow */}
          <Animated.View 
            style={[
              styles.buttonGlow,
              { opacity: glowOpacity }
            ]}
          />
          
          <TouchableOpacity
            style={styles.continueButtonWrapper}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isSaving || purchasing}
          >
            <LinearGradient
              colors={purchasing ? ['#FFA726', '#FF7043'] : ['#A3F7B5', '#D1F7FF']}
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {purchasing ? (
                <View style={styles.purchasingContainer}>
                  <ActivityIndicator size="small" color="#1a1a1a" />
                  <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>
                    Processing Purchase...
                  </Text>
                </View>
              ) : (
                <Text style={styles.continueButtonText}>
                  {getButtonText()}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Validation Error */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please select a plan before continuing
          </Text>
        )}

        {/* Purchase Error */}
        {purchaseError && (
          <View style={styles.purchaseErrorContainer}>
            <Text style={styles.purchaseErrorText}>{purchaseError}</Text>
            <TouchableOpacity
              style={styles.retryPurchaseButton}
              onPress={() => {
                setPurchaseError(null);
                handleContinue();
              }}
            >
              <Text style={styles.retryPurchaseButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Debug Info - Remove this in production */}
        {__DEV__ && offerings && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug - Offerings Structure:</Text>
            <Text style={styles.debugText}>
              {JSON.stringify(offerings, null, 2)}
            </Text>
          </View>
        )}

        {/* Footer Notes */}
        <View style={styles.footerNotes}>
          <Text style={styles.footerText}>
            Start your transformation today—thousands are glowing up with Flex Aura!
          </Text>
          <Text style={styles.footerText}>
            No refunds. Cancel anytime from settings.
          </Text>
        </View>
      </View>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/excited no bg.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
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
  glowSpots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowSpot: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#B7FCE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  glowSpot1: {
    top: height * 0.2,
    right: 50,
  },
  glowSpot2: {
    bottom: height * 0.3,
    left: 30,
  },
  glowSpot3: {
    top: height * 0.6,
    right: 20,
  },
  content: {
    flex: 1,
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'System',
    letterSpacing: -0.5,
    marginBottom: 20,
    marginTop: 10,
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  planOptionsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 15,
    gap: 10,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#B7FCE7',
  },
  planCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(183, 252, 231, 0.3)',
    shadowColor: '#B7FCE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 5,
  },
  planCardGlowSelected: {
    backgroundColor: 'rgba(183, 252, 231, 0.5)',
  },
  saveTag: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  freeTrialBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freeTrialText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    marginBottom: 3,
  },
  planSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  trialNote: {
    fontSize: 10,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  paymentIcon: {
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 15,
  },
  continueButtonWrapper: {
    width: '100%',
    borderRadius: 35,
    shadowColor: '#A3F7B5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 10,
  },
  continueButton: {
    width: '100%',
    borderRadius: 35,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  buttonGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 40,
    backgroundColor: 'rgba(163, 247, 181, 0.3)',
    shadowColor: '#A3F7B5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 1,
    zIndex: 1,
    pointerEvents: 'none',
  },
  footerNotes: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 3,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.05,
    right: 15,
    zIndex: 10,
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  validationError: {
    fontSize: 14,
    color: '#E53E3E',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  planCardDisabled: {
    opacity: 0.5,
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    maxHeight: 200,
    width: '100%',
  },
  debugTitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  debugText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Courier',
  },
  purchasingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseErrorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  purchaseErrorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  retryPurchaseButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryPurchaseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OnboardingScreen21;
