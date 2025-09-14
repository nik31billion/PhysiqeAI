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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components/OnboardingErrorHandler';

const { width, height } = Dimensions.get('window');

const OnboardingScreen21: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
  
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


    return () => {
      glowLoop.stop();
    };
  }, []);

  const handleContinue = async () => {
    // Validation: A plan must be selected
    if (!selectedPlan) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    
    const stepData = {
      selected_plan: selectedPlan,
      coupon_code: couponCode || undefined,
    };

    const success = await navigateToNextStep(21, stepData);
    if (!success) {
      console.error('Failed to save onboarding data');
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
        <View style={styles.planOptionsContainer}>
          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Animated.View 
              style={[
                styles.planCardGlow,
                selectedPlan === 'monthly' && styles.planCardGlowSelected,
                { opacity: selectedPlan === 'monthly' ? glowOpacity : 0.3 }
              ]}
            />
            <Text style={styles.planPrice}>$14.99/month</Text>
            <Text style={styles.planSubtitle}>Pay monthly, cancel anytime</Text>
          </TouchableOpacity>

          {/* Annual Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <Animated.View 
              style={[
                styles.planCardGlow,
                selectedPlan === 'annual' && styles.planCardGlowSelected,
                { opacity: selectedPlan === 'annual' ? glowOpacity : 0.3 }
              ]}
            />
            <View style={styles.saveTag}>
              <Text style={styles.saveTagText}>Save 40%</Text>
            </View>
            <Text style={styles.planPrice}>$89.99/year</Text>
            <Text style={styles.planSubtitle}>Best value—unlock a full year comparison for less</Text>
          </TouchableOpacity>
        </View>

        {/* Coupon Code */}
        <View style={styles.couponContainer}>
          <Text style={styles.couponLabel}>Coupon Code</Text>
          <TextInput
            style={styles.couponInput}
            value={couponCode}
            onChangeText={setCouponCode}
            placeholder="Enter code"
            placeholderTextColor="#999"
          />
        </View>

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
            disabled={isSaving}
          >
            <LinearGradient
              colors={['#A3F7B5', '#D1F7FF']}
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Validation Error */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please select a plan before continuing
          </Text>
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
  couponContainer: {
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  couponLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 6,
  },
  couponInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
});

export default OnboardingScreen21;
