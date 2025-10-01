-- Migration: Add display_name column to user_profiles table
-- This allows users to set a custom display name instead of using their email username

-- Add display_name column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add comment to document the column
COMMENT ON COLUMN user_profiles.display_name IS 'User''s custom display name for the app interface';

-- Update existing users to have their display_name set to their email username (first part before @)
-- This ensures existing users have a display name while allowing them to customize it later
UPDATE user_profiles 
SET display_name = SPLIT_PART(email, '@', 1)
WHERE display_name IS NULL AND email IS NOT NULL;

-- For users without email, set a default display name
UPDATE user_profiles 
SET display_name = 'User'
WHERE display_name IS NULL;
