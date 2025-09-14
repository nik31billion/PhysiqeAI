-- Migration: Add delete_user_data function for account deletion
-- This function can be called with elevated privileges to delete all user data

CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  -- Delete all user data in the correct order (respecting foreign key constraints)
  
  -- Delete progress photos
  DELETE FROM progress_photos WHERE progress_photos.user_id = delete_user_data.user_id;
  
  -- Delete day completions
  DELETE FROM day_completions WHERE day_completions.user_id = delete_user_data.user_id;
  
  -- Delete individual completions
  DELETE FROM meal_completions WHERE meal_completions.user_id = delete_user_data.user_id;
  DELETE FROM exercise_completions WHERE exercise_completions.user_id = delete_user_data.user_id;
  
  -- Delete user achievements
  DELETE FROM user_achievements WHERE user_achievements.user_id = delete_user_data.user_id;
  
  -- Delete aura events
  DELETE FROM aura_events WHERE aura_events.user_id = delete_user_data.user_id;
  
  -- Delete coach glow chats
  DELETE FROM coach_glow_chats WHERE coach_glow_chats.user_id = delete_user_data.user_id;
  
  -- Delete weight tracking
  DELETE FROM user_weight_tracking WHERE user_weight_tracking.user_id = delete_user_data.user_id;
  
  -- Delete user plans
  DELETE FROM user_plans WHERE user_plans.user_id = delete_user_data.user_id;
  
  -- Delete user profile (this will cascade to auth.users due to the foreign key)
  DELETE FROM user_profiles WHERE user_profiles.id = delete_user_data.user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return false
    RAISE LOG 'Error deleting user data for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
