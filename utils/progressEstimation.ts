/**
 * Utility for realistic progress estimation during plan generation
 */

export interface ProgressEstimationResult {
  progress: number;
  stageIndex: number;
}

export interface ProgressStage {
  stage: string;
  progress: number;
  emoji: string;
  message?: string;
  tip?: string;
}

/**
 * Calculates realistic progress estimation based on elapsed time
 * Uses logarithmic-style progression that feels natural and incremental
 * FIXED: Now handles 50-120+ second generation times with smooth progression
 * 
 * @param startTime - When the generation started (timestamp)
 * @param currentTime - Current timestamp (optional, defaults to Date.now())
 * @returns Progress percentage (0-100) and stage index
 */
export function calculateProgressEstimation(
  startTime: number,
  currentTime: number = Date.now()
): ProgressEstimationResult {
  const elapsedTime = currentTime - startTime;
  
  let progress = 0;
  let stageIndex = 0;
  
  // CRITICAL FIX: Simplified and more reliable progress calculation
  if (elapsedTime < 100) { // 0-0.1s: Start immediately at 5%
    progress = 5;
    stageIndex = 0;
  } else if (elapsedTime < 2000) { // 0.1-2s: 5% → 10% (Stage 1)
    progress = 5 + Math.floor(((elapsedTime - 100) / 1900) * 5); // 5-10%
    stageIndex = 0;
  } else if (elapsedTime < 5000) { // 2-5s: 10% → 20% (Stage 2)
    progress = 10 + Math.floor(((elapsedTime - 2000) / 3000) * 10); // 10-20%
    stageIndex = 1;
  } else if (elapsedTime < 10000) { // 5-10s: 20% → 35% (Stage 3)
    progress = 20 + Math.floor(((elapsedTime - 5000) / 5000) * 15); // 20-35%
    stageIndex = 2;
  } else if (elapsedTime < 20000) { // 10-20s: 35% → 55% (Stage 4)
    progress = 35 + Math.floor(((elapsedTime - 10000) / 10000) * 20); // 35-55%
    stageIndex = 3;
  } else if (elapsedTime < 35000) { // 20-35s: 55% → 75% (Stage 5)
    progress = 55 + Math.floor(((elapsedTime - 20000) / 15000) * 20); // 55-75%
    stageIndex = 4;
  } else if (elapsedTime < 50000) { // 35-50s: 75% → 85% (Stage 6)
    progress = 75 + Math.floor(((elapsedTime - 35000) / 15000) * 10); // 75-85%
    stageIndex = 5;
  } else if (elapsedTime < 70000) { // 50-70s: 85% → 92% (Stage 7)
    progress = 85 + Math.floor(((elapsedTime - 50000) / 20000) * 7); // 85-92%
    stageIndex = 6;
  } else if (elapsedTime < 90000) { // 70-90s: 92% → 95% (Stage 8)
    progress = 92 + Math.floor(((elapsedTime - 70000) / 20000) * 3); // 92-95%
    stageIndex = 7;
  } else if (elapsedTime < 120000) { // 90-120s: 95% → 97% (Stage 9)
    progress = 95 + Math.floor(((elapsedTime - 90000) / 30000) * 2); // 95-97%
    stageIndex = 8;
  } else { // After 120s: Stay at 97% until backend completes (Stage 10)
    progress = 97;
    stageIndex = 9;
  }
  
  return { progress, stageIndex };
}

/**
 * Standard progress stages for plan generation
 * FIXED: Updated with more stages to handle 50-120+ second generation times
 */
export const DEFAULT_PROGRESS_STAGES: ProgressStage[] = [
  { 
    stage: "Initializing AI Systems", 
    progress: 8, 
    emoji: "🚀",
    message: "Starting up our AI fitness coach...",
    tip: "💡 Your personalized journey is about to begin!"
  },
  { 
    stage: "Analyzing Your Profile", 
    progress: 15, 
    emoji: "🎯",
    message: "Understanding your fitness goals and preferences...",
    tip: "🧠 AI is learning about your unique needs!"
  },
  { 
    stage: "Designing Workouts", 
    progress: 28, 
    emoji: "🏋️‍♂️",
    message: "Creating the perfect workout routine for you...",
    tip: "💪 Every exercise is chosen specifically for your goals!"
  },
  { 
    stage: "Crafting Meal Plans", 
    progress: 45, 
    emoji: "🍽️",
    message: "Building your personalized nutrition strategy...",
    tip: "🥗 Delicious meals that fuel your transformation!"
  },
  { 
    stage: "Calculating Targets", 
    progress: 65, 
    emoji: "📊",
    message: "Setting optimal calorie and macro targets...",
    tip: "🎯 Science-based nutrition for maximum results!"
  },
  { 
    stage: "Optimizing Schedule", 
    progress: 80, 
    emoji: "📅",
    message: "Fitting everything into your daily routine...",
    tip: "⏰ Your plan adapts to your lifestyle perfectly!"
  },
  { 
    stage: "Adding Final Touches", 
    progress: 88, 
    emoji: "✨",
    message: "Personalizing every detail of your plan...",
    tip: "🔥 Almost ready for your transformation!"
  },
  { 
    stage: "Quality Assurance", 
    progress: 93, 
    emoji: "🔍",
    message: "Double-checking every detail for perfection...",
    tip: "🎯 We're ensuring your plan is absolutely perfect!"
  },
  { 
    stage: "Almost Ready", 
    progress: 96, 
    emoji: "⏳",
    message: "Your plan is almost ready - just a few more moments...",
    tip: "🌟 Perfect plans require patience - you're almost there!"
  },
  { 
    stage: "Plan Complete!", 
    progress: 100, 
    emoji: "🎉",
    message: "Your custom Vibe Plan is ready!",
    tip: "🌟 Time to start your amazing fitness journey!"
  }
];

/**
 * Creates progress stages customized for specific plan types
 */
export function getProgressStagesForPlanType(planType: 'workout' | 'diet' | 'both' = 'both'): ProgressStage[] {
  if (planType === 'workout') {
    return [
      { stage: "Initializing", progress: 10, emoji: "🚀" },
      { stage: "Analyzing Data", progress: 25, emoji: "📊" },
      { stage: "Designing Workouts", progress: 50, emoji: "🏋️‍♂️" },
      { stage: "Selecting Exercises", progress: 70, emoji: "💪" },
      { stage: "Optimizing Schedule", progress: 85, emoji: "📅" },
      { stage: "Finalizing Plan", progress: 95, emoji: "✨" },
      { stage: "Ready!", progress: 100, emoji: "🎉" }
    ];
  } else if (planType === 'diet') {
    return [
      { stage: "Initializing", progress: 10, emoji: "🚀" },
      { stage: "Recalculating BMR", progress: 25, emoji: "🧮" },
      { stage: "Creating Meals", progress: 50, emoji: "🍽️" },
      { stage: "Balancing Macros", progress: 70, emoji: "⚖️" },
      { stage: "Optimizing Schedule", progress: 85, emoji: "📅" },
      { stage: "Finalizing Plan", progress: 95, emoji: "✨" },
      { stage: "Ready!", progress: 100, emoji: "🎉" }
    ];
  } else {
    return DEFAULT_PROGRESS_STAGES;
  }
}
