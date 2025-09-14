-- Migration to add BMR, TDEE, and target calories columns to user_profiles table
-- This migration adds the calculated calorie values for workout/diet plan generation

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bmr INTEGER,
ADD COLUMN IF NOT EXISTS tdee INTEGER,
ADD COLUMN IF NOT EXISTS target_calories INTEGER;

-- Add comments to the new columns for documentation
COMMENT ON COLUMN user_profiles.bmr IS 'Basal Metabolic Rate calculated using Harris-Benedict formula';
COMMENT ON COLUMN user_profiles.tdee IS 'Total Daily Energy Expenditure based on BMR and activity level';
COMMENT ON COLUMN user_profiles.target_calories IS 'Daily calorie target based on goal type (lose/gain/maintain)';

-- Create an index on the calculated values for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_calorie_values ON user_profiles(bmr, tdee, target_calories);
