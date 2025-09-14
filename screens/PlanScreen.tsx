import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import {
  WorkoutPlan,
  DietPlan,
  StoredPlan
} from '../utils/planService';
// Import Coach Glow components
import { CoachGlowChat, CoachGlowPlanSwapButton } from '../components';
// Real-time hooks handle data fetching
import {
  handleMealCompletion as instantMealCompletion,
  handleExerciseCompletion as instantExerciseCompletion,
  handleBulkMealCompletion as instantBulkMealCompletion,
  handleBulkExerciseCompletion as instantBulkExerciseCompletion,
  handleDayCompletion as instantDayCompletion
} from '../utils/instantDataManager';
import { useInstantStoredPlan, useInstantCompletionStats } from '../utils/useInstantData';
import { supabase } from '../utils/supabase';
import {
  markMealAsCompleted,
  markExerciseAsCompleted,
  markAllMealsAsCompleted,
  markAllExercisesAsCompleted,
  getCompletedMeals,
  getCompletedExercises,
  isMealCompleted,
  isExerciseCompleted,
  MealCompletion,
  ExerciseCompletion
} from '../utils/completionService';
import { useRoute } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const PlanScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute();
  const initialTab = (route.params as any)?.initialTab || 'workouts';
  console.log('📋 PlanScreen: Initializing with initialTab:', initialTab);
  const [activeTab, setActiveTab] = useState<'workouts' | 'meals'>(initialTab);
  // Use instant data hooks for zero-delay updates
  const { plan, loading: planLoading } = useInstantStoredPlan(user?.id || null);
  const { stats } = useInstantCompletionStats(user?.id || null);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<number>>(new Set());
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [isCompletingMeal, setIsCompletingMeal] = useState<number | null>(null);
  const [isCompletingExercise, setIsCompletingExercise] = useState<number | null>(null);
  const [isCompletingAllMeals, setIsCompletingAllMeals] = useState(false);
  const [isCompletingAllExercises, setIsCompletingAllExercises] = useState(false);
  const [isCoachGlowVisible, setIsCoachGlowVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(''); // Empty means current day

  // Update active tab when route params change
  useEffect(() => {
    const newInitialTab = (route.params as any)?.initialTab || 'workouts';
    console.log('📋 PlanScreen: Route params changed, initialTab:', newInitialTab, 'current activeTab:', activeTab);
    if (newInitialTab !== activeTab) {
      console.log('📋 PlanScreen: Updating activeTab to:', newInitialTab);
      setActiveTab(newInitialTab);
    }
  }, [route.params]);

  // Real-time data is now handled by hooks
  useEffect(() => {
    if (user) {
      fetchCompletedDays();
      fetchIndividualCompletions();
    }
  }, [user]);

  // Check for automatic day completion when data loads
  useEffect(() => {
    if (user && plan && completedMeals.size > 0 && completedExercises.size > 0) {
      // Small delay to ensure all state is updated
      setTimeout(() => {
        checkAndCompleteDay();
      }, 500);
    }
  }, [user, plan, completedMeals, completedExercises]);

  // Refresh data when app comes back into focus (handles day changes)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user) {
        console.log('🔄 App became active, refreshing plan data...');
        fetchCompletedDays();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);

  // fetchUserPlan is now handled by useRealTimeStoredPlan hook


  const fetchCompletedDays = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('day_completions')
        .select('completed_date')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching completed days:', error);
        return;
      }

      const completedDates = new Set(data?.map(item => item.completed_date) || []);
      setCompletedDays(completedDates);
      console.log('✅ Fetched completed days:', completedDates);
    } catch (error) {
      console.error('Error fetching completed days:', error);
    }
  };

  const fetchIndividualCompletions = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch completed meals and exercises for today
      const [mealsResult, exercisesResult] = await Promise.all([
        getCompletedMeals(user.id, today),
        getCompletedExercises(user.id, today)
      ]);

      if (mealsResult.success && mealsResult.data) {
        const mealIndices = new Set(mealsResult.data.map(completion => completion.meal_index));
        setCompletedMeals(mealIndices);
      }

      if (exercisesResult.success && exercisesResult.data) {
        const exerciseIndices = new Set(exercisesResult.data.map(completion => completion.exercise_index));
        setCompletedExercises(exerciseIndices);
      }

      console.log('✅ Fetched individual completions');
    } catch (error) {
      console.error('Error fetching individual completions:', error);
    }
  };

  // Automatic day completion when all meals and workouts are done
  const checkAndCompleteDay = async () => {
    if (!user || !plan || isTodayCompleted) return;

    const allMealsDone = areAllMealsCompleted();
    const allExercisesDone = areAllExercisesCompleted();
    
    // Only complete day if both meals and workouts are done
    if (allMealsDone && allExercisesDone) {
      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Check if already completed today
        if (completedDays.has(today)) {
          console.log('Day already completed, skipping duplicate completion');
          return; // Already completed, no need to show alert
        }

        // Double-check with database to prevent race conditions
        const { data: existingCompletion } = await supabase
          .from('day_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed_date', today)
          .eq('is_active', true)
          .single();

        if (existingCompletion) {
          console.log('Day already completed in database, skipping duplicate completion');
          // Update local state to reflect the existing completion
          setCompletedDays(prev => new Set([...prev, today]));
          return;
        }

        // Insert completion record (with conflict handling)
        const { error } = await supabase
          .from('day_completions')
          .upsert({
            user_id: user.id,
            plan_id: plan.id,
            completed_date: today,
            completed_at: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'user_id,completed_date'
          });

        if (error) {
          // Handle specific error cases
          if (error.code === '23505') {
            console.log('Day completion already exists, updating local state');
            // Update local state even if database insert failed due to duplicate
            setCompletedDays(prev => new Set([...prev, today]));
            return;
          } else {
            console.error('Error marking day as completed:', error);
            return;
          }
        }

        // Update local state
        setCompletedDays(prev => new Set([...prev, today]));
        
        // Update instant state immediately - zero delays!
        instantDayCompletion(user.id, plan.id);
        
        Alert.alert(
          'Day Completed! 🎉', 
          'Congratulations! You\'ve completed all your tasks for today!',
          [{ text: 'Awesome!', style: 'default' }]
        );

        console.log('✅ Day automatically completed:', today);
      } catch (error) {
        console.error('Error in automatic day completion:', error);
      }
    }
  };

  const handleMealCompletion = async (mealIndex: number, mealName: string) => {
    if (!user || !plan || isCompletingMeal !== null) return;

    try {
      setIsCompletingMeal(mealIndex);
      
      const result = await markMealAsCompleted(
        user.id,
        plan.id,
        mealIndex,
        mealName
      );

      if (result.success) {
        setCompletedMeals(prev => new Set([...prev, mealIndex]));
        // Update instant state immediately - zero delays!
        instantMealCompletion(user.id, plan.id, mealIndex, mealName);
        Alert.alert('Meal Completed! 🍽️', `${mealName} marked as completed!`);
        
        // Check if day should be automatically completed
        setTimeout(() => {
          checkAndCompleteDay();
        }, 100);
      } else {
        Alert.alert('Error', result.error || 'Failed to mark meal as completed');
      }
    } catch (error) {
      console.error('Error completing meal:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsCompletingMeal(null);
    }
  };

  const handleExerciseCompletion = async (exerciseIndex: number, exerciseName: string) => {
    if (!user || !plan || isCompletingExercise !== null) return;

    try {
      setIsCompletingExercise(exerciseIndex);
      
      const result = await markExerciseAsCompleted(
        user.id,
        plan.id,
        exerciseIndex,
        exerciseName
      );

      if (result.success) {
        setCompletedExercises(prev => new Set([...prev, exerciseIndex]));
        // Update instant state immediately - zero delays!
        instantExerciseCompletion(user.id, plan.id, exerciseIndex, exerciseName);
        Alert.alert('Exercise Completed! 💪', `${exerciseName} marked as completed!`);
        
        // Check if day should be automatically completed
        setTimeout(() => {
          checkAndCompleteDay();
        }, 100);
      } else {
        Alert.alert('Error', result.error || 'Failed to mark exercise as completed');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsCompletingExercise(null);
    }
  };

  const handleAllMealsCompletion = async () => {
    if (!user || !plan || isCompletingAllMeals) return;

    // Check if all meals are already completed
    const allMealIndices = new Set<number>(meals.map((_: any, index: number) => index));
    const allMealsCompleted = allMealIndices.size > 0 && [...allMealIndices].every(index => completedMeals.has(index));
    
    if (allMealsCompleted) {
      Alert.alert('Already Completed! ✅', 'All your meals are already completed for today!');
      return;
    }

    try {
      setIsCompletingAllMeals(true);
      
      // INSTANT UI UPDATE - Update state immediately for zero delays!
      setCompletedMeals(allMealIndices);
      
      // Update instant state immediately - zero delays!
      instantBulkMealCompletion(user.id, plan.id, meals.length);
      
      // Show success message immediately
      Alert.alert('All Meals Completed! 🎉', 'Great job completing all your meals for today!');
      
      // Check if day should be automatically completed
      setTimeout(() => {
        checkAndCompleteDay();
      }, 100);
      
      // Handle database operations in background (non-blocking)
      setTimeout(async () => {
        try {
          const result = await markAllMealsAsCompleted(
            user.id,
            plan.id,
            meals
          );
          
          if (!result.success) {
            console.error('Background meal completion failed:', result.error);
            // Optionally show a subtle error message or retry
          }
        } catch (error) {
          console.error('Background meal completion error:', error);
        }
      }, 0);
      
    } catch (error) {
      console.error('Error completing all meals:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsCompletingAllMeals(false);
    }
  };

  const handleAllExercisesCompletion = async () => {
    if (!user || !plan || isCompletingAllExercises) return;

    // Check if all exercises are already completed
    const allExerciseIndices = new Set<number>(workouts.map((_: any, index: number) => index));
    const allExercisesCompleted = allExerciseIndices.size > 0 && [...allExerciseIndices].every(index => completedExercises.has(index));
    
    if (allExercisesCompleted) {
      Alert.alert('Already Completed! ✅', 'All your exercises are already completed for today!');
      return;
    }

    try {
      setIsCompletingAllExercises(true);
      
      // INSTANT UI UPDATE - Update state immediately for zero delays!
      setCompletedExercises(allExerciseIndices);
      
      // Update instant state immediately - zero delays!
      instantBulkExerciseCompletion(user.id, plan.id, workouts.length);
      
      // Show success message immediately
      Alert.alert('All Exercises Completed! 🎉', 'Amazing work completing your entire workout!');
      
      // Check if day should be automatically completed
      setTimeout(() => {
        checkAndCompleteDay();
      }, 100);
      
      // Handle database operations in background (non-blocking)
      setTimeout(async () => {
        try {
          const result = await markAllExercisesAsCompleted(
            user.id,
            plan.id,
            workouts
          );
          
          if (!result.success) {
            console.error('Background exercise completion failed:', result.error);
            // Optionally show a subtle error message or retry
          }
        } catch (error) {
          console.error('Background exercise completion error:', error);
        }
      }, 0);
      
    } catch (error) {
      console.error('Error completing all exercises:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsCompletingAllExercises(false);
    }
  };

  // Helper function to check if today is a rest day
  const checkIsRestDay = (workoutDay: WorkoutPlan | undefined, meals: any[]) => {
    // A day is considered a rest day if:
    // 1. No workout day exists for today, OR
    // 2. Workout day exists but has empty routine, OR  
    // 3. Workout day exists but routine is null/undefined
    const hasWorkoutDay = workoutDay && workoutDay.routine && workoutDay.routine.length > 0;
    
    // If there's a workout day entry but no exercises, it's likely a planned rest day
    // If there's no workout day entry at all, it could be a missing plan or rest day
    // We'll assume it's a rest day if there are meals but no workouts
    return !hasWorkoutDay && meals.length > 0;
  };

  // Get plan data for selected day (or current day if no selection)
  const getTodaysData = () => {
    if (!plan) return { workouts: [], meals: [], currentDay: 0, dayName: 'Monday', isRestDay: false };

    // Get the actual current day of the week (not based on plan generation date)
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[today.getDay()];
    
    // Map day names to day numbers for display (Monday = 1, Tuesday = 2, etc.)
    const dayNameToNumber: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    
    // Use selected day or current day
    const targetDayName = selectedDay || currentDayName;
    const isCurrentDay = !selectedDay || selectedDay === currentDayName;
    const currentDayNumber = dayNameToNumber[currentDayName];
    const targetDayNumber = dayNameToNumber[targetDayName];
    
    console.log(`📅 Today is: ${today.toDateString()}`);
    console.log(`📅 Current day name: ${currentDayName}`);
    console.log(`📅 Selected day name: ${targetDayName}`);
    console.log(`📅 Is viewing current day: ${isCurrentDay}`);

    // Find the workout and diet for the target day
    const workoutDay = plan.workout_plan.find((w: WorkoutPlan) =>
      w.day.toLowerCase().includes(targetDayName.toLowerCase())
    );
    const dietDay = plan.diet_plan.find((d: DietPlan) =>
      d.day.toLowerCase().includes(targetDayName.toLowerCase())
    );

    console.log(`💪 Found workout for ${targetDayName}:`, workoutDay ? 'Yes' : 'No');
    console.log(`🍽️ Found diet for ${targetDayName}:`, dietDay ? 'Yes' : 'No');

    const workouts = workoutDay?.routine || [];
    const meals = dietDay?.meals || [];
    const restDay = checkIsRestDay(workoutDay, meals);

    return {
      workouts,
      meals,
      currentDay: targetDayNumber,
      dayName: targetDayName,
      daysSinceStart: 0, // Not used anymore, but keeping for compatibility
      isRestDay: restDay,
      isCurrentDay
    };
  };

  const { workouts, meals, currentDay, dayName, daysSinceStart, isRestDay, isCurrentDay } = getTodaysData();
  const today = new Date().toISOString().split('T')[0];
  const isTodayCompleted = completedDays.has(today);

  // Helper functions to check if all items are completed
  const areAllMealsCompleted = () => {
    if (meals.length === 0) return false;
    const allMealIndices = new Set<number>(meals.map((_: any, index: number) => index));
    return [...allMealIndices].every(index => completedMeals.has(index));
  };

  const areAllExercisesCompleted = () => {
    if (workouts.length === 0) return false;
    const allExerciseIndices = new Set<number>(workouts.map((_: any, index: number) => index));
    return [...allExerciseIndices].every(index => completedExercises.has(index));
  };

  // Get meal details from LLM-generated data
  const getMealDetails = (meal: any) => {
    return {
      ingredients: meal.ingredients || ['Ingredients not available'],
      instructions: meal.instructions || ['Instructions not available'],
      cooking_time: meal.cooking_time || 'Not specified',
      serving_size: meal.serving_size || '1 serving'
    };
  };

  const renderTabButton = (tab: 'workouts' | 'meals', label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab ? styles.activeTabButton : styles.inactiveTabButton,
      ]}
      onPress={() => {
        setActiveTab(tab);
        setExpandedMeal(null); // Close any expanded meals when switching tabs
      }}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab ? styles.activeTabText : styles.inactiveTabText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderWorkoutCard = (workout: any, index: number) => {
    const getWorkoutIcon = (exercise: string) => {
      const exerciseLower = exercise.toLowerCase();
      if (exerciseLower.includes('push') || exerciseLower.includes('chest')) return '🏋️‍♂️';
      if (exerciseLower.includes('pull') || exerciseLower.includes('back')) return '🏋️‍♀️';
      if (exerciseLower.includes('squat') || exerciseLower.includes('leg')) return '🦵';
      if (exerciseLower.includes('cardio') || exerciseLower.includes('run')) return '🏃‍♂️';
      if (exerciseLower.includes('plank') || exerciseLower.includes('core')) return '🧘‍♂️';
      return '💪';
    };

    const formatWorkoutDetails = (workout: any) => {
      const parts = [];
      if (workout.sets && workout.reps) {
        parts.push(`${workout.reps} reps, ${workout.sets} sets`);
      } else if (workout.duration) {
        parts.push(workout.duration);
      } else if (workout.reps) {
        parts.push(`${workout.reps} reps`);
      }
      return parts.join(' | ');
    };

    const isCompleted = completedExercises.has(index);
    const isCompleting = isCompletingExercise === index;

    return (
      <View key={index} style={[styles.workoutCard, isCompleted && styles.completedCard]}>
        <View style={styles.workoutCardLeft}>
          <View style={[styles.workoutIconContainer, isCompleted && styles.completedIconContainer]}>
            <Text style={styles.workoutIcon}>{getWorkoutIcon(workout.exercise || '')}</Text>
            {isCompleted && (
              <View style={styles.completionCheckmark}>
                <Ionicons name="checkmark" size={12} color="#4CAF50" />
              </View>
            )}
          </View>
          <View style={styles.workoutDetails}>
            <Text style={[styles.workoutName, isCompleted && styles.completedText]}>
              {workout.exercise || 'Exercise'}
            </Text>
            <Text style={[styles.workoutDetailsText, isCompleted && styles.completedText]}>
              {formatWorkoutDetails(workout) || 'Details not available'}
            </Text>
          </View>
        </View>
        <View style={styles.workoutCardRight}>
          {!isCompleted ? (
            <TouchableOpacity 
              style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]}
              onPress={() => handleExerciseCompletion(index, workout.exercise || 'Exercise')}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.completedButton}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedButtonText}>Done</Text>
            </View>
          )}
          <TouchableOpacity style={styles.swapButton}>
            <Ionicons name="refresh-outline" size={16} color="#b88cff" />
            <Text style={styles.swapButtonText}>Swap</Text>
          </TouchableOpacity>
        </View>
        {/* Coach Glow Mascot - appears next to second workout card */}
        {index === 1 && (
          <View style={styles.floatingMascot}>
            <Image
              source={require('../assets/mascot/mascot thumbs up no bg.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    );
  };

  const renderMealCard = (meal: any, index: number) => {
    const isExpanded = expandedMeal === index;
    const mealDetails = getMealDetails(meal);
    const isCompleted = completedMeals.has(index);
    const isCompleting = isCompletingMeal === index;

    const getMealIcon = (mealType: string) => {
      const typeLower = mealType.toLowerCase();
      if (typeLower.includes('breakfast')) return '🥣';
      if (typeLower.includes('lunch')) return '🥗';
      if (typeLower.includes('dinner')) return '🍽️';
      if (typeLower.includes('snack')) return '🍎';
      return '🍽️';
    };

    const formatMealDetails = (meal: any) => {
      const parts = [];
      if (meal.description) {
        parts.push(meal.description);
      }
      if (meal.kcal) {
        parts.push(`${meal.kcal} kcal`);
      }
      if (meal.protein_g && meal.carbs_g && meal.fat_g) {
        parts.push(`P:${meal.protein_g}g C:${meal.carbs_g}g F:${meal.fat_g}g`);
      }
      return parts.join(' | ');
    };

    return (
      <View key={index} style={[styles.mealCard, isCompleted && styles.completedCard]}>
        <TouchableOpacity 
          style={styles.mealCardContent}
          onPress={() => setExpandedMeal(isExpanded ? null : index)}
          activeOpacity={0.7}
        >
          <View style={styles.mealCardLeft}>
            <View style={[styles.mealIconContainer, isCompleted && styles.completedIconContainer]}>
              <Text style={styles.mealIcon}>{getMealIcon(meal.meal || '')}</Text>
              {isCompleted && (
                <View style={styles.completionCheckmark}>
                  <Ionicons name="checkmark" size={12} color="#4CAF50" />
                </View>
              )}
            </View>
            <View style={styles.mealDetails}>
              <Text style={[styles.mealName, isCompleted && styles.completedText]}>
                {meal.meal || 'Meal'}
              </Text>
              <Text style={[styles.mealDetailsText, isCompleted && styles.completedText]}>
                {formatMealDetails(meal) || 'Details not available'}
              </Text>
            </View>
          </View>
          <View style={styles.mealCardRight}>
            {!isCompleted ? (
              <TouchableOpacity 
                style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]}
                onPress={() => handleMealCompletion(index, meal.meal || 'Meal')}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-outline" size={16} color="#fff" />
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.completedButton}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.completedButtonText}>Done</Text>
              </View>
            )}
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#b88cff" 
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.mealExpandedContent}>
            {/* Nutritional Info */}
            <View style={styles.nutritionSection}>
              <Text style={styles.nutritionTitle}>Nutritional Info</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.kcal || 0}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.protein_g || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.carbs_g || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.fat_g || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
            </View>

            {/* Meal Info */}
            <View style={styles.mealInfoSection}>
              <View style={styles.mealInfoItem}>
                <Text style={styles.mealInfoLabel}>Cooking Time:</Text>
                <Text style={styles.mealInfoValue}>{mealDetails.cooking_time}</Text>
              </View>
              <View style={styles.mealInfoItem}>
                <Text style={styles.mealInfoLabel}>Serving Size:</Text>
                <Text style={styles.mealInfoValue}>{mealDetails.serving_size}</Text>
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.ingredientsSection}>
              <Text style={styles.ingredientsTitle}>Ingredients</Text>
              {mealDetails.ingredients.map((ingredient: string, idx: number) => (
                <Text key={idx} style={styles.ingredientItem}>• {ingredient}</Text>
              ))}
            </View>

            {/* Instructions */}
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>How to Prepare</Text>
              {mealDetails.instructions.map((instruction: string, idx: number) => (
                <Text key={idx} style={styles.instructionItem}>{instruction}</Text>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.mealActions}>
              <TouchableOpacity style={styles.swapButton}>
                <Ionicons name="refresh-outline" size={16} color="#b88cff" />
                <Text style={styles.swapButtonText}>Swap Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={16} color="#ff6b6b" />
                <Text style={styles.favoriteButtonText}>Save Recipe</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Show loading spinner while fetching plan
  if (planLoading) {
    return (
      <LinearGradient
        colors={['#e9f7fa', '#f7e8fa']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b88cff" />
          <Text style={styles.loadingText}>
            Loading your personalized plan...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e9f7fa', '#f7e8fa']}
      style={styles.container}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content Card */}
        <View style={styles.mainCard}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                Hey {user?.email?.split('@')[0] || 'User'}! 👋
              </Text>
              <Text style={styles.planTitle}>
                Here's your custom plan
              </Text>
            </View>


            {/* Tab Switch */}
            <View style={styles.tabContainer}>
              {renderTabButton('workouts', 'Workouts')}
              {renderTabButton('meals', 'Meals')}
            </View>
          </View>

          {/* No Plan State */}
          {!plan ? (
            <View style={styles.noPlanContainer}>
              <Image
                source={require('../assets/mascot/thinking no bg.png')}
                style={styles.noPlanImage}
                resizeMode="contain"
              />
              <Text style={styles.noPlanTitle}>No Plan Yet!</Text>
              <Text style={styles.noPlanText}>
                Complete your onboarding to get a personalized workout and meal plan tailored just for you.
              </Text>
              <Text style={styles.noPlanSubtext}>
                Once you complete onboarding, your plan will be automatically generated and ready to use!
              </Text>
            </View>
          ) : (
            <>
              {/* Today's Plan Summary */}
              <View style={styles.planSummarySection}>
                <View style={styles.dayHeaderContainer}>
                  <Text style={styles.planSummaryTitle}>
                    Day {currentDay} - {dayName}
                  </Text>
                  {!isCurrentDay && (
                    <TouchableOpacity 
                      style={styles.backToTodayButton}
                      onPress={() => setSelectedDay('')}
                    >
                      <Ionicons name="today-outline" size={16} color="#b88cff" />
                      <Text style={styles.backToTodayText}>Today</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Day Selector */}
                <View style={styles.daySelectorContainer}>
                  <Text style={styles.daySelectorLabel}>View other days:</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.daySelectorScroll}
                    contentContainerStyle={styles.daySelectorContent}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          selectedDay === day && styles.dayButtonSelected,
                          !isCurrentDay && day === selectedDay && styles.dayButtonActive
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          selectedDay === day && styles.dayButtonTextSelected
                        ]}>
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <Text style={styles.planSummaryText}>
                  {activeTab === 'workouts'
                    ? isRestDay 
                      ? 'Rest day - Recovery time'
                      : (() => {
                          const workoutDay = plan?.workout_plan?.find((w: WorkoutPlan) =>
                            w.day.toLowerCase().includes(dayName.toLowerCase())
                          );
                          const workoutType = workoutDay?.type || 'Workout';
                          return `${workoutType} - ${workouts.length} exercises planned`;
                        })()
                    : `${meals.reduce((total: number, meal: any) => total + (meal.kcal || 0), 0)} kcal planned`
                  }
                </Text>
                <Text style={styles.planSummarySubtext}>
                  {daysSinceStart === 0 ? 'Plan starts today!' : `${daysSinceStart} days into your plan`}
                </Text>
                {isTodayCompleted && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.completedText}>Completed today!</Text>
                  </View>
                )}
              </View>

              {/* Content Cards */}
              <View style={styles.contentSection}>
                {activeTab === 'workouts'
                  ? workouts.map((workout: any, index: number) => renderWorkoutCard(workout, index))
                  : meals.map((meal: any, index: number) => renderMealCard(meal, index))
                }

                {/* Show rest day message for workouts or no data message */}
                {activeTab === 'workouts' && workouts.length === 0 ? (
                  isRestDay ? (
                    <View style={styles.restDayContainer}>
                      <View style={styles.restDayIconContainer}>
                        <Text style={styles.restDayIcon}>🧘‍♀️</Text>
                      </View>
                      <Text style={styles.restDayTitle}>Rest Day - {dayName}</Text>
                      <Text style={styles.restDaySubtitle}>Take time to recover your body</Text>
                      <Text style={styles.restDayDescription}>
                        Today is your scheduled rest day! This is an important part of your fitness journey. 
                        Use this time to relax, recover, and let your muscles heal. You can still stay active 
                        with light activities like walking, stretching, or yoga.
                      </Text>
                      <View style={styles.restDayTips}>
                        <Text style={styles.restDayTipsTitle}>💡 Recovery Tips:</Text>
                        <Text style={styles.restDayTip}>• Get plenty of sleep (7-9 hours)</Text>
                        <Text style={styles.restDayTip}>• Stay hydrated throughout the day</Text>
                        <Text style={styles.restDayTip}>• Try gentle stretching or yoga</Text>
                        <Text style={styles.restDayTip}>• Focus on nutritious meals</Text>
                        <Text style={styles.restDayTip}>• Take a relaxing walk if you feel like it</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>
                        No workout plan available for today.
                      </Text>
                    </View>
                  )
                ) : activeTab === 'meals' && meals.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      No meal plan available for today.
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Bulk Completion Buttons */}
              {activeTab === 'workouts' && workouts.length > 0 && (
                <View style={styles.bulkCompletionSection}>
                  <TouchableOpacity
                    style={[
                      styles.bulkCompleteButton, 
                      (isCompletingAllExercises || areAllExercisesCompleted()) && styles.bulkCompleteButtonDisabled,
                      areAllExercisesCompleted() && styles.bulkCompleteButtonCompleted
                    ]}
                    onPress={handleAllExercisesCompletion}
                    disabled={isCompletingAllExercises || areAllExercisesCompleted()}
                  >
                    {isCompletingAllExercises ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : areAllExercisesCompleted() ? (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.bulkCompleteButtonText}>All Exercises Completed! ✅</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.bulkCompleteButtonText}>Complete All Exercises</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'meals' && meals.length > 0 && (
                <View style={styles.bulkCompletionSection}>
                  <TouchableOpacity
                    style={[
                      styles.bulkCompleteButton, 
                      (isCompletingAllMeals || areAllMealsCompleted()) && styles.bulkCompleteButtonDisabled,
                      areAllMealsCompleted() && styles.bulkCompleteButtonCompleted
                    ]}
                    onPress={handleAllMealsCompletion}
                    disabled={isCompletingAllMeals || areAllMealsCompleted()}
                  >
                    {isCompletingAllMeals ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : areAllMealsCompleted() ? (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.bulkCompleteButtonText}>All Meals Completed! ✅</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.bulkCompleteButtonText}>Complete All Meals</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Workout Progress Bar (only show for workouts) */}
              {activeTab === 'workouts' && workouts.length > 0 && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressTitle}>Workout Progress</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${(completedExercises.size / workouts.length) * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.progressText}>
                    {completedExercises.size} of {workouts.length} exercises completed
                  </Text>
                </View>
              )}

            </>
          )}

          {/* Ask Coach Glow Input Bar */}
          <View style={styles.coachGlowSection}>
            <TouchableOpacity 
              style={styles.coachInputSection}
              onPress={() => setIsCoachGlowVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.coachInputBar}>
                <Image
                  source={require('../assets/mascot/mascot normal no bg.png')}
                  style={styles.coachInputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.coachInput}
                  placeholder="Ask Coach Glow anything about your plan..."
                  placeholderTextColor="#a0a0a0"
                  editable={false}
                />
                <Ionicons name="send-outline" size={20} color="#a0a0a0" />
              </View>
            </TouchableOpacity>
            
            {/* Helpful Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Try asking about:</Text>
              <View style={styles.suggestionsGrid}>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setIsCoachGlowVisible(true)}
                >
                  <Text style={styles.suggestionText}>🔄 Plan adjustments</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setIsCoachGlowVisible(true)}
                >
                  <Text style={styles.suggestionText}>💪 Workout tips</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setIsCoachGlowVisible(true)}
                >
                  <Text style={styles.suggestionText}>🍽️ Nutrition advice</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionChip}
                  onPress={() => setIsCoachGlowVisible(true)}
                >
                  <Text style={styles.suggestionText}>🎯 Motivation</Text>
                </TouchableOpacity>
              </View>
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
    paddingBottom: 120, // Space for bottom nav
    paddingHorizontal: 16,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  
  // Header Section
  headerSection: {
    marginBottom: 28,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    lineHeight: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  tabButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#d2f7ea',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  inactiveTabButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#2E7D32',
  },
  inactiveTabText: {
    color: '#666',
  },

  // Plan Summary Section
  planSummarySection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dayHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  planSummaryTitle: {
    fontSize: 20,
    color: '#222',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  backToTodayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  backToTodayText: {
    fontSize: 12,
    color: '#b88cff',
    fontWeight: '600',
  },
  daySelectorContainer: {
    width: '100%',
    marginBottom: 16,
  },
  daySelectorLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  daySelectorScroll: {
    maxHeight: 40,
  },
  daySelectorContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#b88cff',
    borderColor: '#b88cff',
  },
  dayButtonActive: {
    backgroundColor: '#a077ff',
    borderColor: '#a077ff',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
  planSummaryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  planSummarySubtext: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
    textAlign: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  // Content Section
  contentSection: {
    gap: 16,
    marginBottom: 24,
  },

  // Workout Cards
  workoutCard: {
    backgroundColor: '#d6fce6',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 80,
  },
  workoutCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutIcon: {
    fontSize: 20,
  },
  workoutDetails: {
    flex: 1,
    minWidth: 0, // Allows text to wrap properly
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  workoutDetailsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },

  // Meal Cards
  mealCard: {
    backgroundColor: '#fff8cd',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
    minHeight: 80,
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  mealCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  mealCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealDetails: {
    flex: 1,
    minWidth: 0, // Allows text to wrap properly
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  mealDetailsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },

  // Expanded Meal Content
  mealExpandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nutritionSection: {
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mealInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  mealInfoItem: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  mealInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  mealInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  instructionsSection: {
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 20,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  favoriteButtonText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },

  // Swap Button
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#b88cff',
    borderRadius: 16,
    gap: 3,
    minWidth: 60,
  },
  swapButtonText: {
    fontSize: 12,
    color: '#b88cff',
    fontWeight: '500',
  },

  // Floating Mascot
  floatingMascot: {
    position: 'absolute',
    right: -20,
    top: -10,
    zIndex: 10,
  },
  mascotImage: {
    width: 40,
    height: 40,
  },

  // Progress Section
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#232323',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '25%',
    backgroundColor: '#b88cff',
    borderRadius: 5,
  },


  // Coach Glow Section
  coachGlowSection: {
    marginTop: 8,
  },
  coachInputSection: {
    marginBottom: 16,
  },
  coachInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cfcaff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  coachInputIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  coachInput: {
    flex: 1,
    fontSize: 15,
    color: '#a0a0a0',
  },
  suggestionsContainer: {
    paddingHorizontal: 4,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
  },
  suggestionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // Loading and No Plan Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },


  noPlanContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPlanImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  noPlanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  noPlanText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  noPlanSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Completion Styles
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#f0f8f0',
  },
  completedIconContainer: {
    backgroundColor: '#e8f5e8',
  },
  completionCheckmark: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
    fontWeight: '600',
  },
  workoutCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0, // Prevents buttons from shrinking
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 3,
    minWidth: 80,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 3,
    minWidth: 60,
  },
  completedButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  bulkCompletionSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  bulkCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b88cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#b88cff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  bulkCompleteButtonDisabled: {
    opacity: 0.6,
  },
  bulkCompleteButtonCompleted: {
    backgroundColor: '#4CAF50', // Green color for completed state
    opacity: 0.8,
  },
  bulkCompleteButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },

  // Rest Day Styles
  restDayContainer: {
    backgroundColor: '#f8f9ff',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8ff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  restDayIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  restDayIcon: {
    fontSize: 40,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
    textAlign: 'center',
  },
  restDaySubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#718096',
    marginBottom: 16,
    textAlign: 'center',
  },
  restDayDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  restDayTips: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  restDayTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  restDayTip: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 6,
  },
});

export default PlanScreen;
