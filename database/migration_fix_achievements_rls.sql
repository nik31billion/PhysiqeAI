-- Fix RLS for achievements table
-- This migration adds proper Row Level Security to the achievements table

-- Enable RLS on achievements table
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements table
-- All authenticated users can read achievement definitions
CREATE POLICY "Authenticated users can view achievements" ON achievements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete achievements (for admin operations)
CREATE POLICY "Service role can manage achievements" ON achievements
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: If you want to allow users to read achievements without authentication
-- (for public achievement definitions), you can use this instead:
-- CREATE POLICY "Public can view active achievements" ON achievements
--   FOR SELECT USING (is_active = true);

-- Note: The achievements table contains global achievement definitions
-- that are the same for all users. The user_achievements table contains
-- user-specific achievement unlocks and is properly protected with RLS.
