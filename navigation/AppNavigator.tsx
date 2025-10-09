import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useOnboarding } from '../utils/OnboardingContext';
import { loadUserData } from '../utils/instantDataManager';
import { HomeScreen, PlanScreen, ProgressScreen, ProfileScreen, EditPlanScreen, OnboardingScreen1, OnboardingScreen2, OnboardingScreen4, OnboardingScreen5, OnboardingScreen6, OnboardingScreen7, OnboardingScreen8, OnboardingScreen9, OnboardingScreen10, OnboardingScreen11, OnboardingScreen12, OnboardingScreen13, OnboardingScreen14, OnboardingScreen15, OnboardingScreen16, OnboardingScreen17, OnboardingScreen18, SignUpScreen, LoginScreen, SettingsScreen, AboutCoachGlowScreen, PrivacyPolicyScreen, TermsAndConditionsScreen, SubscriptionScreen } from '../screens';
import FoodScannerScreen from '../screens/FoodScannerScreen';
import FloatingCameraButton from '../components/FloatingCameraButton';
import OnboardingScreen19 from '../screens/OnboardingScreen19';
import OnboardingScreen20 from '../screens/OnboardingScreen20';
import OnboardingScreen21 from '../screens/OnboardingScreen21';
import OnboardingScreen22 from '../screens/OnboardingScreen22';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        switch (route.name) {
          case 'Home':
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'Plan':
            iconName = isFocused ? 'calendar' : 'calendar-outline';
            break;
          case 'Progress':
            iconName = isFocused ? 'bar-chart' : 'bar-chart-outline';
            break;
          case 'Profile':
            iconName = isFocused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={iconName as any}
              size={24}
              color={isFocused ? '#FF6F4C' : '#A9A9A9'}
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? '#FF6F4C' : '#A9A9A9' }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabs: React.FC = () => {
  const navigation = useNavigation();

  const handleScanFood = () => {
    navigation.navigate('FoodScannerScreen', { scanMode: 'food' });
  };

  const handleScanBarcode = () => {
    navigation.navigate('FoodScannerScreen', { scanMode: 'barcode' });
  };

  const handleScanFoodLabel = () => {
    navigation.navigate('FoodScannerScreen', { scanMode: 'label' });
  };

  const handleOpenLibrary = () => {
    navigation.navigate('FoodScannerScreen', { scanMode: 'library' });
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Plan" component={PlanScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      
      <FloatingCameraButton
        onScanFood={handleScanFood}
        onScanBarcode={handleScanBarcode}
        onScanFoodLabel={handleScanFoodLabel}
        onOpenLibrary={handleOpenLibrary}
      />
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isOnboardingComplete, loading: onboardingLoading, currentStep } = useOnboarding();

  // Load user data for instant access when authenticated and onboarding is complete
  React.useEffect(() => {
    if (user && isOnboardingComplete) {
      
      loadUserData(user.id);
    }
  }, [user, isOnboardingComplete]);

  // Show loading while checking auth and onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#937AFD" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Determine initial route based on auth and onboarding status
  const getInitialRoute = () => {
    if (!user) {
      return "OnboardingScreen1"; // Not authenticated
    }
    
    if (isOnboardingComplete) {
      return "MainTabs"; // Authenticated and onboarding complete
    }
    
    // Authenticated but onboarding not complete - start from OnboardingScreen1
    // The onboarding flow will handle navigation to the correct step
    return "OnboardingScreen1";
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Unauthenticated screens */}
        <Stack.Screen name="OnboardingScreen1" component={OnboardingScreen1} />
        <Stack.Screen name="OnboardingScreen2" component={OnboardingScreen2} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        
        {/* Authenticated screens - only accessible when user is logged in */}
        {user && (
          <>
            <Stack.Screen name="OnboardingScreen4" component={OnboardingScreen4} />
            <Stack.Screen name="OnboardingScreen5" component={OnboardingScreen5} />
            <Stack.Screen name="OnboardingScreen6" component={OnboardingScreen6} />
            <Stack.Screen name="OnboardingScreen7" component={OnboardingScreen7} />
            <Stack.Screen name="OnboardingScreen8" component={OnboardingScreen8} />
            <Stack.Screen name="OnboardingScreen9" component={OnboardingScreen9} />
            <Stack.Screen name="OnboardingScreen10" component={OnboardingScreen10} />
            <Stack.Screen name="OnboardingScreen11" component={OnboardingScreen11} />
            <Stack.Screen name="OnboardingScreen12" component={OnboardingScreen12} />
            <Stack.Screen name="OnboardingScreen13" component={OnboardingScreen13} />
            <Stack.Screen name="OnboardingScreen14" component={OnboardingScreen14} />
            <Stack.Screen name="OnboardingScreen15" component={OnboardingScreen15} />
            <Stack.Screen name="OnboardingScreen16" component={OnboardingScreen16} />
            <Stack.Screen name="OnboardingScreen17" component={OnboardingScreen17} />
            <Stack.Screen name="OnboardingScreen18" component={OnboardingScreen18} />
            <Stack.Screen name="OnboardingScreen19" component={OnboardingScreen19} />
            <Stack.Screen name="OnboardingScreen20" component={OnboardingScreen20} />
            <Stack.Screen name="OnboardingScreen21" component={OnboardingScreen21} />
            <Stack.Screen name="OnboardingScreen22" component={OnboardingScreen22} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="EditPlanScreen" component={EditPlanScreen} />
            <Stack.Screen name="FoodScannerScreen" component={FoodScannerScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="AboutCoachGlowScreen" component={AboutCoachGlowScreen} />
            <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsAndConditionsScreen" component={TermsAndConditionsScreen} />
            <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B9F3E4',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#937AFD',
    fontWeight: '600',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#141416', // Dark dock background
    paddingVertical: 16, // Increased vertical padding for pill-like feel
    paddingHorizontal: 20,
    paddingBottom: 34, // Extra bottom padding for safe area
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44, // Minimum tap target height
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-SemiBold', // Button labels: Poppins SemiBold
  },
});

export default AppNavigator;
