/**
 * Calorie calculation utilities for fitness planning
 * Implements BMR, TDEE, and daily calorie target calculations
 */

export interface CalorieCalculationInputs {
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  activity_level: 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active' | 'Super active';
  goal_type: 'lose' | 'gain' | 'maintain';
  goal_timeframe_weeks: number;
}

export interface CalorieCalculationOutputs {
  bmr: number;
  tdee: number;
  targetCalories: number;
  activityCapped?: boolean;
  activityCappedMessage?: string;
}

/**
 * Activity factors for TDEE calculation (conservative mapping)
 */
const ACTIVITY_FACTORS = {
  'Sedentary': 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.55, // Capped for safety
  'Super active': 1.55  // Capped for safety
} as const;

/**
 * Calculates Basal Metabolic Rate using Harris-Benedict formula
 */
function calculateBMR(inputs: Pick<CalorieCalculationInputs, 'age' | 'gender' | 'height_cm' | 'weight_kg'>): number {
  const { age, gender, height_cm, weight_kg } = inputs;

  if (gender === 'male') {
    // BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) – (5.677 × age in years)
    return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age);
  } else {
    // BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) – (4.330 × age in years)
    return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age);
  }
}

/**
 * Calculates Total Daily Energy Expenditure
 */
function calculateTDEE(bmr: number, activity_level: CalorieCalculationInputs['activity_level']): number {
  const activityFactor = ACTIVITY_FACTORS[activity_level];
  return bmr * activityFactor;
}

/**
 * Calculates daily calorie target based on goal type with safety limits
 */
function calculateTargetCalories(tdee: number, goal_type: CalorieCalculationInputs['goal_type']): number {
  switch (goal_type) {
    case 'lose':
      // For weight loss: deficit of 450 kcal/day, max -800
      return Math.max(tdee - 800, tdee - 450);

    case 'gain':
      // For weight gain: surplus of 250 kcal/day, max +500
      return Math.min(tdee + 500, tdee + 250);

    case 'maintain':
      // For maintenance: equal to TDEE
      return tdee;

    default:
      throw new Error(`Invalid goal type: ${goal_type}`);
  }
}

/**
 * Rounds a number to the nearest 10
 */
function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Main function to calculate BMR, TDEE, and daily calorie target
 * @param inputs - User inputs from onboarding
 * @returns Object containing bmr, tdee, and targetCalories (all rounded to nearest 10)
 */
export function calculateCalories(inputs: CalorieCalculationInputs): CalorieCalculationOutputs {
  // Validate inputs
  if (inputs.age <= 0 || inputs.age > 150) {
    throw new Error('Invalid age: must be between 1 and 150');
  }

  if (inputs.height_cm <= 0 || inputs.height_cm > 300) {
    throw new Error('Invalid height: must be between 1 and 300 cm');
  }

  if (inputs.weight_kg <= 0 || inputs.weight_kg > 500) {
    throw new Error('Invalid weight: must be between 1 and 500 kg');
  }

  if (inputs.goal_weight_kg <= 0 || inputs.goal_weight_kg > 500) {
    throw new Error('Invalid goal weight: must be between 1 and 500 kg');
  }

  if (!ACTIVITY_FACTORS.hasOwnProperty(inputs.activity_level)) {
    throw new Error(`Invalid activity level: ${inputs.activity_level}`);
  }

  if (!['lose', 'gain', 'maintain'].includes(inputs.goal_type)) {
    throw new Error(`Invalid goal type: ${inputs.goal_type}`);
  }

  if (inputs.goal_timeframe_weeks <= 0) {
    throw new Error('Invalid goal timeframe: must be greater than 0');
  }

  // Check if activity level was capped
  const activityCapped = inputs.activity_level === 'Very active' || inputs.activity_level === 'Super active';
  const activityCappedMessage = activityCapped 
    ? 'Your activity level was capped at "Moderately active" for safety. This prevents overestimation unless you have manual labor plus intense training.'
    : undefined;

  // Calculate BMR
  const bmr = calculateBMR({
    age: inputs.age,
    gender: inputs.gender,
    height_cm: inputs.height_cm,
    weight_kg: inputs.weight_kg
  });

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, inputs.activity_level);

  // Calculate target calories
  const targetCalories = calculateTargetCalories(tdee, inputs.goal_type);

  // Round all values to nearest 10
  return {
    bmr: roundToNearest10(bmr),
    tdee: roundToNearest10(tdee),
    targetCalories: roundToNearest10(targetCalories),
    activityCapped,
    activityCappedMessage
  };
}

/**
 * Example usage:
 * const result = calculateCalories({
 *   age: 28,
 *   gender: 'male',
 *   height_cm: 175,
 *   weight_kg: 80,
 *   goal_weight_kg: 75,
 *   activity_level: 'Moderately active',
 *   goal_type: 'lose',
 *   goal_timeframe_weeks: 12
 * });
 *
 * Result: { bmr: 1800, tdee: 2790, targetCalories: 2340, activityCapped: false }
 * 
 * For "Very active" or "Super active": activityCapped: true, activityCappedMessage: "..."
 */
