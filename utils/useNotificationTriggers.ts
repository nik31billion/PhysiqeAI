import { useEffect, useRef } from 'react';
import { notificationService } from './notificationService';
import { useAuth } from './AuthContext';
import { showToast, showMilestone } from '../components/NotificationManager';

interface UseNotificationTriggersProps {
  // Aura and streak data
  currentAura?: number;
  streakDays?: number;
  lastWorkoutDate?: Date;
  lastMealDate?: Date;
  
  // User preferences
  preferredWorkoutTime?: string;
  preferredMealTime?: string;
  
  // Activity tracking
  hasLoggedWorkoutToday?: boolean;
  hasLoggedMealToday?: boolean;
}

export const useNotificationTriggers = ({
  currentAura = 0,
  streakDays = 0,
  lastWorkoutDate,
  lastMealDate,
  preferredWorkoutTime = '08:00',
  preferredMealTime = '12:00',
  hasLoggedWorkoutToday = false,
  hasLoggedMealToday = false,
}: UseNotificationTriggersProps) => {
  const { user } = useAuth();
  const lastAuraRef = useRef(currentAura);
  const lastStreakRef = useRef(streakDays);
  const missedWorkoutCheckRef = useRef<NodeJS.Timeout | null>(null);
  const missedMealCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Check for aura milestones
  useEffect(() => {
    if (currentAura > lastAuraRef.current) {
      const auraIncrease = currentAura - lastAuraRef.current;
      
      // Trigger aura milestone celebration
      if (auraIncrease >= 10) {
        showMilestone('aura_milestone');
        showToast(
          'Aura Milestone! ✨',
          `Your aura increased by ${auraIncrease} points!`,
          'celebration'
        );
      }
    }
    lastAuraRef.current = currentAura;
  }, [currentAura]);

  // Check for streak milestones
  useEffect(() => {
    if (streakDays > lastStreakRef.current) {
      // 7-day streak milestone
      if (streakDays === 7) {
        showMilestone('7_day_streak', streakDays);
        showToast(
          '7-Day Streak! 🔥',
          'Amazing work! Your consistency is paying off!',
          'celebration'
        );
      }
      // Other streak milestones
      else if (streakDays > 0 && streakDays % 7 === 0) {
        showMilestone('streak_milestone', streakDays);
        showToast(
          'Streak Milestone! 🎉',
          `${streakDays} days strong! Keep it up!`,
          'celebration'
        );
      }
    }
    lastStreakRef.current = streakDays;
  }, [streakDays]);

  // Check for missed activities
  useEffect(() => {
    if (!user?.id) return;

    const checkMissedActivities = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const [workoutHour] = preferredWorkoutTime.split(':').map(Number);
      const [mealHour] = preferredMealTime.split(':').map(Number);

      // Check for missed workout (after preferred time + 1 hour)
      if (currentHour >= workoutHour + 1 && !hasLoggedWorkoutToday) {
        notificationService.sendMissedActivityReminder('workout', preferredWorkoutTime);
        showToast(
          'Missed your workout? No worries! 💪',
          'It\'s not too late to get moving and boost your aura!',
          'warning'
        );
      }

      // Check for missed meal (after preferred time + 1 hour)
      if (currentHour >= mealHour + 1 && !hasLoggedMealToday) {
        notificationService.sendMissedActivityReminder('meal', preferredMealTime);
        showToast(
          'Forgot to log your meal? 🍽️',
          'Don\'t let your streak break - log it now!',
          'warning'
        );
      }
    };

    // Clear existing timers
    if (missedWorkoutCheckRef.current) {
      clearTimeout(missedWorkoutCheckRef.current);
    }
    if (missedMealCheckRef.current) {
      clearTimeout(missedMealCheckRef.current);
    }

    // Set up checks for missed activities
    const [workoutHour] = preferredWorkoutTime.split(':').map(Number);
    const [mealHour] = preferredMealTime.split(':').map(Number);
    const now = new Date();
    const currentHour = now.getHours();

    // Schedule workout check
    if (currentHour < workoutHour + 1) {
      const workoutCheckTime = new Date();
      workoutCheckTime.setHours(workoutHour + 1, 0, 0, 0);
      const workoutDelay = workoutCheckTime.getTime() - now.getTime();
      
      missedWorkoutCheckRef.current = setTimeout(() => {
        if (!hasLoggedWorkoutToday) {
          checkMissedActivities();
        }
      }, workoutDelay);
    }

    // Schedule meal check
    if (currentHour < mealHour + 1) {
      const mealCheckTime = new Date();
      mealCheckTime.setHours(mealHour + 1, 0, 0, 0);
      const mealDelay = mealCheckTime.getTime() - now.getTime();
      
      missedMealCheckRef.current = setTimeout(() => {
        if (!hasLoggedMealToday) {
          checkMissedActivities();
        }
      }, mealDelay);
    }

    return () => {
      if (missedWorkoutCheckRef.current) {
        clearTimeout(missedWorkoutCheckRef.current);
      }
      if (missedMealCheckRef.current) {
        clearTimeout(missedMealCheckRef.current);
      }
    };
  }, [user?.id, preferredWorkoutTime, preferredMealTime, hasLoggedWorkoutToday, hasLoggedMealToday]);

  // Coach Glow motivational messages based on aura drops
  useEffect(() => {
    if (currentAura < 50 && currentAura > 0) {
      const motivationalMessages = [
        "Low vibe? No worries! I'm here to help you glow again—check your plan and let's get moving!",
        "Your aura needs a boost! Let's get back on track with a quick workout or meal log!",
        "Don't let a low aura get you down! Every small step counts towards your goals!",
        "Time to recharge your aura! A little effort goes a long way!",
      ];
      
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      
      // Only show if aura is significantly low and we haven't shown a message recently
      if (currentAura < 30) {
        showToast(
          'Coach Glow says:',
          randomMessage,
          'info'
        );
      }
    }
  }, [currentAura]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (missedWorkoutCheckRef.current) {
        clearTimeout(missedWorkoutCheckRef.current);
      }
      if (missedMealCheckRef.current) {
        clearTimeout(missedMealCheckRef.current);
      }
    };
  }, []);

  return {
    // Expose methods for manual triggering
    triggerWorkoutReminder: () => {
      showToast(
        'Ready to crush your workout and boost your aura? Let\'s go! 💪',
        'Time to flex your aura and get those gains!',
        'info'
      );
    },
    triggerMealReminder: () => {
      showToast(
        'Don\'t forget to check your meal plan and log your food for max aura! 🍽️',
        'Fuel your body right and keep that aura glowing!',
        'info'
      );
    },
    triggerStreakReminder: () => {
      showToast(
        'Streak at risk! Log today\'s workout or meal to keep your aura glowing.',
        'Don\'t let your streak break! Your aura depends on it! ✨',
        'warning'
      );
    },
  };
};
