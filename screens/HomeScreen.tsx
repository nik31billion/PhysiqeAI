import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  AppState,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../utils/AuthContext';
import { fetchUserProfile, getUserDisplayName } from '../utils/profileService';
import { getUserActivePlan, WorkoutPlan, DietPlan } from '../utils/planService';
import { useInstantUserProfile, useInstantUserPlan } from '../utils/useInstantData';
import { getNextUncompletedMeal } from '../utils/completionService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useNotificationTriggers } from '../utils/useNotificationTriggers';
// Import Coach Glow components
import { CoachGlowChat, CoachGlowMotivationButton, CoachGlowPlanSwapButton } from '../components';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffe8a3" />
            <Stop offset="100%" stopColor="#ffd86b" />
          </SvgLinearGradient>
        </Defs>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  // Use instant data hooks for zero-delay updates
  const { profile: userProfile, loading: profileLoading } = useInstantUserProfile(user?.id || null);
  const { plan: userPlan, loading: planLoading } = useInstantUserPlan(user?.id || null);
  const loading = profileLoading || planLoading;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [nextUncompletedMeal, setNextUncompletedMeal] = useState<any>(null);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [isCoachGlowVisible, setIsCoachGlowVisible] = useState(false);
  const [hasLoggedWorkoutToday, setHasLoggedWorkoutToday] = useState(false);
  const [hasLoggedMealToday, setHasLoggedMealToday] = useState(false);

  // Get current day name and formatted date
  const getCurrentDayAndDate = () => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = dayNames[today.getDay()];
    const monthName = monthNames[today.getMonth()];
    const date = today.getDate();
    
    return `${dayName}, ${monthName} ${date}`;
  };

  // Get current day workout from plan
  const getCurrentDayWorkout = () => {
    if (!userPlan?.workout_plan) return null;
    
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[today.getDay()];
    
    return userPlan.workout_plan.find((workout: WorkoutPlan) => 
      workout.day.toLowerCase() === currentDayName.toLowerCase()
    );
  };

  // Get current day diet from plan
  const getCurrentDayDiet = () => {
    if (!userPlan?.diet_plan) {
      console.log('🍽️ getCurrentDayDiet - no userPlan or diet_plan');
      return null;
    }
    
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[today.getDay()];
    
    console.log('🍽️ getCurrentDayDiet - currentDayName:', currentDayName);
    console.log('🍽️ getCurrentDayDiet - available diet days:', userPlan.diet_plan.map((d: any) => d.day));
    
    const foundDiet = userPlan.diet_plan.find((diet: DietPlan) => 
      diet.day.toLowerCase() === currentDayName.toLowerCase()
    );
    
    console.log('🍽️ getCurrentDayDiet - found diet:', foundDiet);
    return foundDiet;
  };

  // Get next uncompleted meal
  const getNextUncompletedMealForToday = async () => {
    const currentDiet = getCurrentDayDiet();
    if (!currentDiet?.meals || !user?.id) return null;
    
    try {
      const nextMeal = await getNextUncompletedMeal(user.id, currentDiet.meals);
      return nextMeal;
    } catch (error) {
      console.error('Error getting next uncompleted meal:', error);
      return currentDiet.meals[0]; // Fallback to first meal
    }
  };

  // Extract calories from meal description
  const extractCaloriesFromDescription = (description: string): number => {
    const match = description.match(/\((\d+)\s*kcal\)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Calculate total calories for the day
  const getTotalCalories = () => {
    const currentDiet = getCurrentDayDiet();
    console.log('🍽️ getTotalCalories - currentDiet:', currentDiet);
    
    if (!currentDiet?.meals) {
      console.log('🍽️ getTotalCalories - no meals found, returning 0');
      return 0;
    }
    
    const total = currentDiet.meals.reduce((total: number, meal: any) => {
      // Try to get calories from kcal field first, then from description
      let calories = meal.kcal || 0;
      if (calories === 0 && meal.description) {
        calories = extractCaloriesFromDescription(meal.description);
      }
      
      console.log('🍽️ getTotalCalories - meal:', meal.meal, 'kcal field:', meal.kcal, 'extracted from description:', calories);
      return total + calories;
    }, 0);
    
    console.log('🍽️ getTotalCalories - total calculated:', total);
    return total;
  };

  // Format workout time based on user preference
  const formatWorkoutTime = () => {
    if (!userProfile?.preferred_workout_time) return '7 PM';
    
    const timePreference = userProfile.preferred_workout_time.toLowerCase();
    if (timePreference.includes('morning')) {
      return '6 AM';
    } else if (timePreference.includes('afternoon')) {
      return '2 PM';
    } else if (timePreference.includes('evening')) {
      return '6 PM';
    }
    
    return '7 PM'; // default
  };

  // Calculate workout duration
  const getWorkoutDuration = () => {
    const currentWorkout = getCurrentDayWorkout();
    if (!currentWorkout?.routine) return '30 min';
    
    // Estimate duration based on number of exercises
    const exerciseCount = currentWorkout.routine.length;
    const estimatedMinutes = Math.max(30, exerciseCount * 5); // 5 minutes per exercise minimum
    
    return `${estimatedMinutes} min`;
  };

  // Navigation functions
  const navigateToWorkoutTab = () => {
    console.log('🏋️ Navigating to workout tab');
    (navigation as any).navigate('Plan', { initialTab: 'workouts' });
  };

  const navigateToMealsTab = () => {
    console.log('🍽️ Navigating to meals tab');
    (navigation as any).navigate('Plan', { initialTab: 'meals' });
  };

  // Function to calculate consumed calories from completed meals
  const calculateConsumedCalories = async () => {
    if (!user?.id || !userPlan) {
      console.log('🍽️ calculateConsumedCalories - no user or userPlan');
      return 0;
    }
    
    try {
      const currentDiet = getCurrentDayDiet();
      if (!currentDiet?.meals) {
        console.log('🍽️ calculateConsumedCalories - no current diet meals');
        return 0;
      }
      
      const { getCompletedMeals } = await import('../utils/completionService');
      const completedMealsResult = await getCompletedMeals(user.id);
      
      console.log('🍽️ calculateConsumedCalories - completedMealsResult:', completedMealsResult);
      
      if (!completedMealsResult.success || !completedMealsResult.data) {
        console.log('🍽️ calculateConsumedCalories - no completed meals data');
        return 0;
      }
      
      const completedIndices = new Set(completedMealsResult.data.map(completion => completion.meal_index));
      console.log('🍽️ calculateConsumedCalories - completedIndices:', Array.from(completedIndices));
      
      const consumed = currentDiet.meals
        .filter((_: any, index: number) => completedIndices.has(index))
        .reduce((total: number, meal: any) => {
          // Try to get calories from kcal field first, then from description
          let calories = meal.kcal || 0;
          if (calories === 0 && meal.description) {
            calories = extractCaloriesFromDescription(meal.description);
          }
          
          console.log('🍽️ calculateConsumedCalories - consumed meal:', meal.meal, 'kcal field:', meal.kcal, 'extracted from description:', calories);
          return total + calories;
        }, 0);
      
      console.log('🍽️ calculateConsumedCalories - total consumed:', consumed);
      return consumed;
    } catch (error) {
      console.error('Error calculating consumed calories:', error);
      return 0;
    }
  };

  // Function to refresh next uncompleted meal and consumed calories
  const refreshMealData = async () => {
    if (!user?.id || !userPlan) return;
    
    try {
      const [nextMeal, consumed] = await Promise.all([
        getNextUncompletedMealForToday(),
        calculateConsumedCalories()
      ]);
      
      const total = getTotalCalories();
      
      // Check if user has logged activities today
      const hasMeals = consumed > 0;
      setHasLoggedMealToday(hasMeals);
      
      // TODO: Add workout completion check when workout service is available
      setHasLoggedWorkoutToday(false);
      
      console.log('🍽️ refreshMealData - total calories:', total, 'consumed:', consumed, 'hasLoggedMealToday:', hasMeals);
      
      setNextUncompletedMeal(nextMeal);
      setConsumedCalories(consumed);
      setTotalCalories(total);
    } catch (error) {
      console.error('Error refreshing meal data:', error);
    }
  };

  // Instant data is now handled by useInstantUserProfile and useInstantUserPlan hooks
  
  // Fetch meal data when plan changes
  useEffect(() => {
    if (userPlan) {
      refreshMealData();
    }
  }, [userPlan]);

  // Refresh data when app comes back into focus (handles meal completions from PlanScreen)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && userPlan) {
        console.log('🔄 HomeScreen: App became active, refreshing meal data...');
        refreshMealData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, userPlan]);

  // Refresh meal data when HomeScreen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user && userPlan) {
        console.log('🔄 HomeScreen: Screen focused, refreshing meal data...');
        refreshMealData();
      }
    }, [user, userPlan])
  );

  // Calculate calorie progress
  const caloriesLeft = Math.max(0, totalCalories - consumedCalories);
  const progress = totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0;
  
  // Notification triggers
  useNotificationTriggers({
    currentAura: 48, // This should come from aura service
    streakDays: 3, // This should come from streak service
    lastWorkoutDate: hasLoggedWorkoutToday ? new Date() : undefined,
    lastMealDate: hasLoggedMealToday ? new Date() : undefined,
    preferredWorkoutTime: userProfile?.preferred_workout_time === 'morning' ? '08:00' : 
                         userProfile?.preferred_workout_time === 'afternoon' ? '14:00' : '18:00',
    preferredMealTime: '12:00', // Default meal time
    hasLoggedWorkoutToday,
    hasLoggedMealToday,
  });
  
  console.log('🍽️ HomeScreen render - totalCalories:', totalCalories, 'consumedCalories:', consumedCalories, 'caloriesLeft:', caloriesLeft, 'progress:', progress);

  if (loading) {
    return (
      <LinearGradient
        colors={['#e9f7fa', '#ffe8db']}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffbb5b" />
          <Text style={styles.loadingText}>
            {planLoading ? 'Loading your personalized plan...' : 'Loading your profile...'}
          </Text>
          {planLoading && (
            <Text style={styles.loadingSubtext}>
              Preparing your daily routine...
            </Text>
          )}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e9f7fa', '#ffe8db']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.mascotContainer}>
                <Image
                  source={require('../assets/mascot/mascot normal no bg.png')}
                  style={styles.mascotIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingLine1}>
                  Hey <Text style={styles.nameText}>{getUserDisplayName(userProfile)}</Text>,
                </Text>
                <Text style={styles.greetingLine2}>
                  your glow is <Text style={styles.glowText}>Radiant</Text> ✨
                </Text>
              </View>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{getCurrentDayAndDate()}</Text>
            </View>
          </View>

          {/* Main Card Container */}
          <View style={styles.cardContainer}>
            {/* Calorie Progress Ring */}
            <View style={styles.progressContainer}>
              <View style={styles.progressRingWrapper}>
                <ProgressRing progress={progress} size={200} strokeWidth={12} />
                <View style={styles.progressCenter}>
                  <Text style={styles.caloriesLeftNumber}>{caloriesLeft}</Text>
                  <Text style={styles.leftText}>left</Text>
                  <Text style={styles.goalText}>Calories / {totalCalories} kcal</Text>
                </View>
              </View>
            </View>

            {/* Aura Points */}
            <View style={styles.auraPointsContainer}>
              <View style={styles.auraPointsBadge}>
                <Image
                  source={require('../assets/mascot/mascot thumbs up no bg.png')}
                  style={styles.auraPointsIcon}
                  resizeMode="contain"
                />
                <Text style={styles.auraPointsText}>
                  Aura Points: <Text style={styles.auraPointsNumber}>+48</Text>
                </Text>
              </View>
            </View>

            {/* Coach Glow Section */}
            <View style={styles.coachGlowSection}>
              <View style={styles.coachGlowHeader}>
                <Image
                  source={require('../assets/mascot/excited no bg.png')}
                  style={styles.coachGlowIcon}
                  resizeMode="contain"
                />
                <View style={styles.coachGlowTextContainer}>
                  <Text style={styles.coachGlowTitle}>Coach Glow ✨</Text>
                  <Text style={styles.coachGlowSubtitle}>
                    Ask for motivation, plan swaps, or fitness advice
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.coachGlowInputBox}
                onPress={() => setIsCoachGlowVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.coachGlowPlaceholder}>
                  Ask Coach Glow anything...
                </Text>
              </TouchableOpacity>
            </View>

            {/* Plan Summary Cards */}
            <View style={styles.planCardsContainer}>
              {/* Workout Card */}
              <TouchableOpacity 
                style={[styles.planCard, styles.workoutCard]}
                onPress={navigateToWorkoutTab}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../assets/mascot/mascot muscular no bg.png')}
                  style={styles.planCardIcon}
                  resizeMode="contain"
                />
                <Text style={styles.planCardTitle}>Workout</Text>
                <Text style={styles.planCardSubtitle}>
                  {getCurrentDayWorkout()?.routine && getCurrentDayWorkout()?.routine.length > 0 ? 
                    (() => {
                      const workout = getCurrentDayWorkout();
                      if (workout?.routine?.[0]?.exercise === 'Rest') {
                        return 'Rest Day';
                      }
                      // Get the primary workout type from the first exercise
                      const primaryType = workout?.routine?.[0]?.type;
                      return primaryType ? `${primaryType.charAt(0).toUpperCase() + primaryType.slice(1)} Day` : 'Workout Day';
                    })() : 
                    'Rest Day'
                  }
                </Text>
                <Text style={styles.planCardDetails}>
                  {getCurrentDayWorkout() ? 
                    `${getWorkoutDuration()} / ${formatWorkoutTime()}` : 
                    'No workout scheduled'
                  }
                </Text>
              </TouchableOpacity>

              {/* Meals Card */}
              <TouchableOpacity 
                style={[styles.planCard, styles.mealsCard]}
                onPress={navigateToMealsTab}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../assets/mascot/mascot relaxed no bg.png')}
                  style={styles.planCardIcon}
                  resizeMode="contain"
                />
                <Text style={styles.planCardTitle}>Meals</Text>
                <Text style={styles.planCardSubtitle}>
                  {nextUncompletedMeal ? 
                    `${nextUncompletedMeal?.meal}: ${nextUncompletedMeal?.description}` : 
                    'No meals scheduled'
                  }
                </Text>
                <Text style={styles.planCardDetails}>
                  {nextUncompletedMeal ? 
                    `${nextUncompletedMeal?.kcal} kcal` : 
                    '0 kcal'
                  }
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Coach Glow Chat Modal */}
      <CoachGlowChat
        visible={isCoachGlowVisible}
        onClose={() => setIsCoachGlowVisible(false)}
        mode="general"
      />

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
    paddingBottom: 100,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 16,
    paddingHorizontal: 4,
    minHeight: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 12,
  },
  mascotContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#ffd86b',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mascotIcon: {
    width: 28,
    height: 28,
  },
  greetingContainer: {
    flex: 1,
    paddingTop: 4,
  },
  greetingLine1: {
    fontSize: 24,
    color: '#1a202c',
    lineHeight: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
  },
  greetingLine2: {
    fontSize: 24,
    color: '#1a202c',
    lineHeight: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.3,
    marginTop: -2,
  },
  nameText: {
    fontWeight: '900',
    color: '#2d3748',
    textShadowColor: 'rgba(255, 255, 255, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  glowText: {
    fontWeight: '900',
    color: '#ffd86b',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  dateContainer: {
    position: 'absolute',
    top: 20,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.1,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressRingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesLeftNumber: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 60,
  },
  leftText: {
    fontSize: 18,
    color: '#888',
    marginTop: -6,
  },
  goalText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  auraPointsContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  auraPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe9',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#ffd86b',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  auraPointsIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  auraPointsText: {
    fontSize: 15,
    color: '#888',
  },
  auraPointsNumber: {
    fontWeight: 'bold',
    color: '#6f62ff',
  },
  planCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 14,
  },
  planCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  workoutCard: {
    backgroundColor: '#c8f5e8',
  },
  mealsCard: {
    backgroundColor: '#fff8cd',
  },
  planCardIcon: {
    width: 22,
    height: 22,
    marginBottom: 10,
  },
  planCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 6,
  },
  planCardSubtitle: {
    fontSize: 15,
    color: '#232323',
    marginBottom: 8,
    lineHeight: 20,
  },
  planCardDetails: {
    fontSize: 13,
    color: '#8d9bab',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  coachGlowSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  coachGlowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachGlowIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  coachGlowTextContainer: {
    flex: 1,
  },
  coachGlowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  coachGlowSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  coachGlowInputBox: {
    marginTop: 12,
    backgroundColor: '#F8F9FA',
    borderColor: '#E1E5E9',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  coachGlowPlaceholder: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default HomeScreen;
