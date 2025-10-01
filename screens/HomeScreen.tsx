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
  isOverLimit?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size, strokeWidth, isOverLimit = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background ring - very thin stroke, Ink at 18% opacity */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(27, 27, 31, 0.18)" // Ink at 18% opacity
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring - very thin stroke, Dark color for good contrast */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOverLimit ? "#FF3B30" : "#1B1B1F"} // Red when over limit, Ink color normally
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
  // State for loading management
  const [isLoadingMealData, setIsLoadingMealData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use instant data hooks for zero-delay updates
  const { profile: userProfile, loading: profileLoading } = useInstantUserProfile(user?.id || null);
  const { plan: userPlan, loading: planLoading } = useInstantUserPlan(user?.id || null);
  // Only wait for essential data for fast load - don't wait for meal data calculation
  const loading = profileLoading || planLoading;
  
  // Other state variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentDateString, setCurrentDateString] = useState<string>(new Date().toISOString().split('T')[0]);
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
      return null;
    }
    
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[today.getDay()];
    
    
    const foundDiet = userPlan.diet_plan.find((diet: DietPlan) => 
      diet.day.toLowerCase() === currentDayName.toLowerCase()
    );
    
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
    
    if (!currentDiet?.meals) {
      return 0;
    }
    
    const total = currentDiet.meals.reduce((total: number, meal: any) => {
      // Try to get calories from kcal field first, then from description
      let calories = meal.kcal || 0;
      if (calories === 0 && meal.description) {
        calories = extractCaloriesFromDescription(meal.description);
      }
      
      return total + calories;
    }, 0);
    
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
    (navigation as any).navigate('Plan', { initialTab: 'workouts' });
  };

  const navigateToMealsTab = () => {
    (navigation as any).navigate('Plan', { initialTab: 'meals' });
  };

  // Function to calculate consumed calories from completed meals AND food scanner
  const calculateConsumedCalories = async () => {
    if (!user?.id) {
      return 0;
    }
    
    try {
      // Calculate calories from completed planned meals
      let plannedMealCalories = 0;
      if (userPlan) {
        const currentDiet = getCurrentDayDiet();
        if (currentDiet?.meals) {
          const { getCompletedMeals } = await import('../utils/completionService');
          const completedMealsResult = await getCompletedMeals(user.id);
          
          if (completedMealsResult.success && completedMealsResult.data) {
            const completedIndices = new Set(completedMealsResult.data.map(completion => completion.meal_index));
            
            plannedMealCalories = currentDiet.meals
              .filter((_: any, index: number) => completedIndices.has(index))
              .reduce((total: number, meal: any) => {
                // Try to get calories from kcal field first, then from description
                let calories = meal.kcal || 0;
                if (calories === 0 && meal.description) {
                  calories = extractCaloriesFromDescription(meal.description);
                }
                
                return total + calories;
              }, 0);
          }
        }
      }
      
      // Calculate calories from food scanner entries
      let scannerCalories = 0;
      try {
        const { getDailyNutritionSummary } = await import('../utils/dailyFoodIntakeService');
        const scannerResult = await getDailyNutritionSummary(user.id);
        
        if (scannerResult.success && scannerResult.data) {
          scannerCalories = scannerResult.data.total_calories || 0;
        }
      } catch (scannerError) {
        console.log('Could not fetch scanner calories:', scannerError);
        // Continue without scanner calories if service fails
      }
      
      const totalCalories = plannedMealCalories + scannerCalories;
      console.log(`Total consumed calories: ${totalCalories} (Planned: ${plannedMealCalories}, Scanner: ${scannerCalories})`);
      
      return totalCalories;
    } catch (error) {
      console.error('Error calculating consumed calories:', error);
      return 0;
    }
  };

  // Function to refresh next uncompleted meal and consumed calories
  const refreshMealData = async () => {
    if (!user?.id || !userPlan) {
      setIsLoadingMealData(false);
      return;
    }
    
    try {
      setIsLoadingMealData(true);
      
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
      
      setNextUncompletedMeal(nextMeal);
      setConsumedCalories(consumed);
      setTotalCalories(total);
      setIsLoadingMealData(false);
      setIsInitialLoad(false);
    } catch (error) {
      setIsLoadingMealData(false);
      setIsInitialLoad(false);
    }
  };

  // Instant data is now handled by useInstantUserProfile and useInstantUserPlan hooks
  
  // Fetch meal data when plan changes
  useEffect(() => {
    if (userPlan) {
      refreshMealData();
    }
  }, [userPlan]);

  // Periodic date check for when app stays open overnight
  useEffect(() => {
    const checkDateChange = () => {
      const newDate = new Date().toISOString().split('T')[0];
      if (newDate !== currentDateString) {
        // Date has changed - reset calorie tracking for new day
        setCurrentDateString(newDate);
        setCurrentDate(new Date());
        setConsumedCalories(0);
        setHasLoggedMealToday(false);
        setHasLoggedWorkoutToday(false);
        setNextUncompletedMeal(null);
        // Refresh meal data for the new day
        if (user && userPlan) {
          refreshMealData();
        }
      }
    };

    // Check every minute for date changes
    const dateCheckInterval = setInterval(checkDateChange, 60000);
    
    return () => clearInterval(dateCheckInterval);
  }, [currentDateString, user, userPlan]);

  // Refresh data when app comes back into focus (handles meal completions from PlanScreen)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && userPlan) {
        // Check if the date has changed since last time
        const newDate = new Date().toISOString().split('T')[0];
        if (newDate !== currentDateString) {
          // Date has changed - reset calorie tracking for new day
          setCurrentDateString(newDate);
          setCurrentDate(new Date());
          setConsumedCalories(0);
          setHasLoggedMealToday(false);
          setHasLoggedWorkoutToday(false);
          setNextUncompletedMeal(null);
          // Refresh meal data for the new day
          setTimeout(() => {
            refreshMealData();
          }, 100);
        } else {
          // Same day - just refresh meal data
          refreshMealData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, userPlan, currentDateString]);

  // Refresh meal data when HomeScreen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user && userPlan) {
        refreshMealData();
      }
    }, [user, userPlan])
  );

  // Calculate calorie progress with overflow handling
  const caloriesLeft = totalCalories - consumedCalories;
  const hasExceededLimit = caloriesLeft < 0;
  const caloriesOver = hasExceededLimit ? Math.round(Math.abs(caloriesLeft)) : 0;
  const displayCaloriesLeft = Math.round(Math.max(0, caloriesLeft));
  
  // Progress calculation: cap at 100% but track if exceeded
  const rawProgress = totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0;
  const progress = Math.min(100, rawProgress);
  const isOverLimit = rawProgress > 100;
  
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
  

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F4C" />
          <Text style={styles.loadingText}>
            {planLoading ? 'Loading your personalized plan...' : 
             profileLoading ? 'Loading your profile...' :
             'Loading your data...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {planLoading ? 'Preparing your daily routine...' :
             profileLoading ? 'Getting your preferences...' :
             'Calculating your progress...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                  source={require('../assets/mascot/flex_aura_new_logo_no_bg_2.png')}
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

          {/* Calories Card - Stat Tile */}
          <View style={styles.caloriesCard}>
            <View style={styles.caloriesLabelContainer}>
              <Text style={styles.caloriesLabel}>
                {hasExceededLimit ? 'Calories over limit' : 'Calories left'}
              </Text>
              {isLoadingMealData && !isInitialLoad && (
                <ActivityIndicator size="small" color="#1B1B1F" style={styles.smallLoadingIndicator} />
              )}
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressRingWrapper}>
                <ProgressRing 
                  progress={progress} 
                  size={160} 
                  strokeWidth={6}
                  isOverLimit={isOverLimit}
                />
                <View style={styles.progressCenter}>
                  <Text style={[
                    styles.caloriesLeftNumber,
                    hasExceededLimit && styles.caloriesOverNumber
                  ]}>
                    {hasExceededLimit ? `+${caloriesOver}` : displayCaloriesLeft}
                  </Text>
                  <Text style={[
                    styles.caloriesLeftText,
                    hasExceededLimit && styles.caloriesOverText
                  ]}>
                    {hasExceededLimit ? 'over' : 'left'}
                  </Text>
                  <Text style={styles.caloriesSupportText}>
                    {Math.round(consumedCalories)} / {Math.round(totalCalories)} kcal
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Coach Glow Card */}
          <View style={styles.coachGlowCard}>
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
              style={styles.coachGlowButton}
              onPress={() => setIsCoachGlowVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.coachGlowButtonText}>
                Ask Coach Glow
              </Text>
            </TouchableOpacity>
          </View>

          {/* Workout Card */}
          <TouchableOpacity 
            style={styles.workoutCard}
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
            style={styles.mealsCard}
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
      </ScrollView>

      {/* Coach Glow Chat Modal */}
      <CoachGlowChat
        visible={isCoachGlowVisible}
        onClose={() => setIsCoachGlowVisible(false)}
        mode="general"
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EE', // Canvas - exact Cal AI
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
    paddingHorizontal: 20, // Screen side padding 16-20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24, // Vertical gap between blocks 20-24
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  mascotIcon: {
    width: 80,
    height: 80,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 16,
    paddingRight: 10,
  },
  greetingLine1: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F', // Ink - primary text
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  greetingLine2: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F', // Ink - primary text
    lineHeight: 24,
    letterSpacing: 0.2,
    marginTop: -2,
  },
  nameText: {
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F', // Ink
  },
  glowText: {
    fontFamily: 'Poppins-Bold',
    color: '#FF6F4C', // Coral accent
  },
  dateContainer: {
    position: 'absolute',
    top: 8,
    right: 4,
    backgroundColor: 'rgba(27, 27, 31, 0.06)', // Chip bg
    borderRadius: 16, // Chip corner radius
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A', // Ash - secondary text
    textAlign: 'right',
  },
  // A) Calories tile (Pastel Sun #F0BC2F) - exact Cal AI blueprint
  caloriesCard: {
    backgroundColor: '#F0BC2F', // Sun yellow
    borderRadius: 28, // Card corner radius
    padding: 24, // Card internal padding
    marginBottom: 24, // Vertical gap between blocks
    height: 260, // Extended height more to accommodate circle and text properly
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  caloriesLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  caloriesLabel: {
    fontSize: 14, // Increased size for better visibility
    fontFamily: 'Poppins-Bold', // Made bold for better contrast
    color: '#1B1B1F', // Ink color for better contrast against yellow
    textAlign: 'center', // Centered
  },
  smallLoadingIndicator: {
    marginLeft: 8,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center', // Center the circle
    marginBottom: 24, // More space below circle for support text
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
    fontSize: 32, // Big number at top
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F', // Ink
    lineHeight: 36,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  caloriesLeftText: {
    fontSize: 14, // "left" text below number
    fontFamily: 'Poppins-Regular',
    color: '#1B1B1F', // Ink
    textAlign: 'center',
    marginTop: 4,
  },
  caloriesSupportText: {
    fontSize: 12, // "Calories / 2520 kcal" text at bottom
    fontFamily: 'Poppins-Regular',
    color: '#1B1B1F', // Ink color for better contrast against yellow
    textAlign: 'center',
    marginTop: 4,
  },
  // Overflow styles for when user exceeds calorie limit
  caloriesOverNumber: {
    color: '#FF3B30', // Red color to indicate over limit
  },
  caloriesOverText: {
    color: '#FF3B30', // Red color to indicate over limit
  },
  // B) Coach Glow card (Neutral white) - exact Cal AI blueprint
  coachGlowCard: {
    backgroundColor: '#FFFFFF', // Neutral white
    borderRadius: 28, // Card corner radius
    padding: 24, // Card internal padding
    marginBottom: 24, // Vertical gap between blocks
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  coachGlowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Between title and body: 6-8
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
    fontSize: 20, // Title: 20/Bold/Ink
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F', // Ink
    marginBottom: 6, // Between title and body: 6-8
  },
  coachGlowSubtitle: {
    fontSize: 14, // Description: 14/Ash, max 2 lines
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A', // Ash
    lineHeight: 20,
  },
  coachGlowButton: {
    backgroundColor: '#FF6F4C', // Coral
    borderRadius: 18, // Button corner radius
    paddingVertical: 14, // Button vertical padding
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16, // Between body and CTA: 16
  },
  coachGlowButtonText: {
    fontSize: 16, // Button labels: Poppins SemiBold 16, white on Coral
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF', // White on Coral
  },
  // C) Workout tile (Pastel Mint) - exact Cal AI blueprint
  workoutCard: {
    backgroundColor: '#C9F3C5', // Mint tile
    borderRadius: 28, // Card corner radius
    padding: 24, // Card internal padding
    marginBottom: 24, // Vertical gap between blocks
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  // D) Meals tile (Pastel Sun) - exact Cal AI blueprint
  mealsCard: {
    backgroundColor: '#F0BC2F', // Sun tile
    borderRadius: 28, // Card corner radius
    padding: 24, // Card internal padding
    marginBottom: 24, // Vertical gap between blocks
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  planCardIcon: {
    width: 22,
    height: 22,
    marginBottom: 10,
  },
  planCardTitle: {
    fontSize: 20, // Title: 20/Bold/Ink
    fontFamily: 'Poppins-Bold',
    color: '#1B1B1F', // Ink - must be Ink on pastel
    marginBottom: 6, // Between title and subtitle: 6-8
  },
  planCardSubtitle: {
    fontSize: 14, // Subtitle: 14/Ash
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A', // Ash
    marginBottom: 4, // Between subtitle and meta: 4-6
    lineHeight: 20,
  },
  planCardDetails: {
    fontSize: 12, // Meta line: 12/Ash
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A', // Ash
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A', // Ash
    textAlign: 'center',
    marginTop: 16,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A6A6A', // Ash
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen;
