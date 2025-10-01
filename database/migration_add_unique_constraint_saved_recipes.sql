-- Migration: Add unique constraint to prevent duplicate saved recipes
-- This ensures that a user cannot save the same recipe multiple times

-- Add unique constraint on user_id and meal_name combination
ALTER TABLE saved_recipes 
ADD CONSTRAINT unique_user_meal_name 
UNIQUE (user_id, meal_name);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT unique_user_meal_name ON saved_recipes IS 'Prevents users from saving the same recipe multiple times';
