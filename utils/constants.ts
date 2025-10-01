// Aura event types
export const AURA_EVENT_TYPES = {
  MEAL_COMPLETION: 'meal_completion',
  EXERCISE_COMPLETION: 'exercise_completion',
  ALL_MEALS_DAY: 'all_meals_day',
  DAILY_WORKOUT: 'daily_workout',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock'
} as const;

// Aura points for different events
export const AURA_POINTS = {
  MEAL_COMPLETION: 3,
  EXERCISE_COMPLETION: 10,
  ALL_MEALS_BONUS: 5,
  DAILY_WORKOUT_BONUS: 15,
  STREAK_MILESTONE: 20,
  ACHIEVEMENT_UNLOCK: 25
} as const;
