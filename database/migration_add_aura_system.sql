-- Aura System Database Schema
-- This migration adds the complete Aura gamification system

-- Aura Events Table - tracks all Aura earning/losing events
CREATE TABLE IF NOT EXISTS aura_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'daily_workout', 'meal_completion', 'streak_bonus', etc.
  event_description TEXT,
  aura_delta INTEGER NOT NULL, -- positive for earning, negative for penalties
  current_aura_total INTEGER NOT NULL, -- total aura after this event
  
  -- Event metadata
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional context
  metadata JSONB, -- store additional event-specific data
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Aura Summary Table - maintains current aura totals and streaks
CREATE TABLE IF NOT EXISTS user_aura_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Current totals
  total_aura INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  
  -- Daily tracking
  last_activity_date DATE,
  daily_aura_earned INTEGER DEFAULT 0, -- resets daily
  
  -- Achievement tracking
  achievements_unlocked TEXT[] DEFAULT '{}', -- array of achievement IDs
  last_achievement_date DATE,
  
  -- Social sharing tracking
  last_share_date DATE,
  shares_today INTEGER DEFAULT 0,
  
  -- Coach Glo interaction tracking
  last_coach_glo_date DATE,
  coach_glo_interactions_today INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements Table - defines all possible achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY, -- 'first_week', 'seven_day_streak', 'goal_weight', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  aura_reward INTEGER NOT NULL,
  icon_name TEXT, -- for UI display
  category TEXT NOT NULL, -- 'streak', 'milestone', 'social', 'progress'
  requirements JSONB, -- flexible requirements structure
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements Table - tracks which achievements users have unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aura_earned INTEGER NOT NULL,
  
  -- Prevent duplicate achievements
  UNIQUE(user_id, achievement_id)
);

-- Weight Tracking Table - for weight progress and milestone tracking
CREATE TABLE IF NOT EXISTS user_weight_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Weight data
  weight_kg DECIMAL(5,2) NOT NULL,
  weight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  
  -- Progress tracking
  weight_change_from_start DECIMAL(5,2), -- calculated field
  is_goal_weight BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one weight entry per user per day
  UNIQUE(user_id, weight_date)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE aura_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_aura_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weight_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aura_events
CREATE POLICY "Users can view own aura events" ON aura_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own aura events" ON aura_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_aura_summary
CREATE POLICY "Users can view own aura summary" ON user_aura_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own aura summary" ON user_aura_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own aura summary" ON user_aura_summary
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_weight_tracking
CREATE POLICY "Users can view own weight tracking" ON user_weight_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight tracking" ON user_weight_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight tracking" ON user_weight_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for achievements
-- All authenticated users can read achievement definitions
CREATE POLICY "Authenticated users can view achievements" ON achievements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete achievements (for admin operations)
CREATE POLICY "Service role can manage achievements" ON achievements
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aura_events_user_id ON aura_events(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_events_date ON aura_events(event_date);
CREATE INDEX IF NOT EXISTS idx_aura_events_type ON aura_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_aura_summary_user_id ON user_aura_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weight_tracking_user_id ON user_weight_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weight_tracking_date ON user_weight_tracking(weight_date);

-- Create trigger to update updated_at timestamp for user_aura_summary
CREATE TRIGGER update_user_aura_summary_updated_at
  BEFORE UPDATE ON user_aura_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user aura summary when user signs up
CREATE OR REPLACE FUNCTION initialize_user_aura_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_aura_summary (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize aura summary for new users
CREATE TRIGGER on_user_created_initialize_aura
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_aura_summary();

-- Insert default achievements
INSERT INTO achievements (id, name, description, aura_reward, icon_name, category, requirements) VALUES
-- Streak Achievements
('first_day', 'First Day Complete', 'Complete your first day of workouts and meals', 10, 'star', 'streak', '{"min_days": 1}'),
('three_day_streak', '3-Day Streak', 'Complete 3 consecutive days', 15, 'fire', 'streak', '{"min_streak": 3}'),
('seven_day_streak', '7-Day Streak', 'Complete 7 consecutive days', 30, 'crown', 'streak', '{"min_streak": 7}'),
('fourteen_day_streak', '14-Day Streak', 'Complete 14 consecutive days', 50, 'trophy', 'streak', '{"min_streak": 14}'),
('thirty_day_streak', '30-Day Streak', 'Complete 30 consecutive days', 100, 'medal', 'streak', '{"min_streak": 30}'),

-- Milestone Achievements
('first_week', 'First Week Complete', 'Complete your first full week', 25, 'calendar', 'milestone', '{"min_days": 7}'),
('first_month', 'First Month Complete', 'Complete your first full month', 75, 'moon', 'milestone', '{"min_days": 30}'),
('goal_weight_achieved', 'Goal Weight Achieved', 'Reach your target weight', 50, 'target', 'milestone', '{"type": "weight_goal"}'),
('weight_loss_milestone_5kg', '5kg Lost', 'Lose 5kg from starting weight', 40, 'scale', 'milestone', '{"type": "weight_loss", "amount": 5}'),
('weight_loss_milestone_10kg', '10kg Lost', 'Lose 10kg from starting weight', 80, 'scale', 'milestone', '{"type": "weight_loss", "amount": 10}'),

-- Social Achievements
('first_share', 'First Share', 'Share your progress for the first time', 20, 'share', 'social', '{"type": "first_share"}'),
('social_butterfly', 'Social Butterfly', 'Share your progress 10 times', 50, 'butterfly', 'social', '{"type": "share_count", "count": 10}'),
('referral_master', 'Referral Master', 'Refer a friend who completes their first week', 50, 'users', 'social', '{"type": "referral"}'),

-- Basic Activity Achievements
('first_workout', 'First Workout', 'Complete your first workout', 15, 'fire', 'workout', '{"type": "first_workout"}'),
('first_meal', 'First Meal', 'Complete your first meal', 10, 'restaurant', 'meal', '{"type": "first_meal"}'),

-- Aura Level Achievements
('aura_collector', 'Aura Collector', 'Earn 100 Aura points', 25, 'star', 'aura', '{"type": "aura_total", "amount": 100}'),
('aura_master', 'Aura Master', 'Earn 500 Aura points', 50, 'crown', 'aura', '{"type": "aura_total", "amount": 500}'),
('aura_legend', 'Aura Legend', 'Earn 1000 Aura points', 100, 'trophy', 'aura', '{"type": "aura_total", "amount": 1000}'),

-- Progress Achievements
('progress_photo_upload', 'Progress Photo', 'Upload your first progress photo', 8, 'camera', 'progress', '{"type": "photo_upload"}'),
('measurement_update', 'Measurement Update', 'Update your body measurements', 4, 'ruler', 'progress', '{"type": "measurement_update"}'),
('coach_glo_fan', 'Coach Glo Fan', 'Chat with Coach Glo 10 times', 30, 'chat', 'progress', '{"type": "coach_glo", "count": 10}'),
('plan_tweaker', 'Plan Tweaker', 'Request a plan modification', 5, 'settings', 'progress', '{"type": "plan_tweak"}')

ON CONFLICT (id) DO NOTHING;

-- Function to add aura points and track events
CREATE OR REPLACE FUNCTION add_aura_points(
  p_user_id UUID,
  p_event_type TEXT,
  p_aura_delta INTEGER,
  p_event_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_current_aura INTEGER;
  v_new_aura INTEGER;
BEGIN
  -- Get current aura total
  SELECT COALESCE(total_aura, 0) INTO v_current_aura
  FROM user_aura_summary
  WHERE user_id = p_user_id;
  
  -- Calculate new aura total
  v_new_aura := v_current_aura + p_aura_delta;
  
  -- Ensure aura doesn't go below 0
  IF v_new_aura < 0 THEN
    v_new_aura := 0;
  END IF;
  
  -- Insert aura event
  INSERT INTO aura_events (
    user_id,
    event_type,
    event_description,
    aura_delta,
    current_aura_total,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_description,
    p_aura_delta,
    v_new_aura,
    p_metadata
  );
  
  -- Update user aura summary
  INSERT INTO user_aura_summary (user_id, total_aura, updated_at)
  VALUES (p_user_id, v_new_aura, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_aura = v_new_aura,
    updated_at = NOW();
  
  RETURN v_new_aura;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id TEXT, aura_earned INTEGER) AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
  requirements_met BOOLEAN;
BEGIN
  -- Get user stats
  SELECT 
    uas.total_aura,
    uas.current_streak,
    uas.best_streak,
    COUNT(ae.id) as total_days_completed
  INTO user_stats
  FROM user_aura_summary uas
  LEFT JOIN aura_events ae ON ae.user_id = uas.user_id 
    AND ae.event_type = 'daily_workout'
  WHERE uas.user_id = p_user_id
  GROUP BY uas.total_aura, uas.current_streak, uas.best_streak;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM achievements 
    WHERE is_active = true 
    AND id NOT IN (
      SELECT achievement_id FROM user_achievements WHERE user_id = p_user_id
    )
  LOOP
    requirements_met := false;
    
    -- Check achievement requirements based on type
    CASE achievement_record.id
      WHEN 'first_day' THEN
        requirements_met := user_stats.total_days_completed >= 1;
      WHEN 'three_day_streak' THEN
        requirements_met := user_stats.current_streak >= 3;
      WHEN 'seven_day_streak' THEN
        requirements_met := user_stats.current_streak >= 7;
      WHEN 'fourteen_day_streak' THEN
        requirements_met := user_stats.current_streak >= 14;
      WHEN 'thirty_day_streak' THEN
        requirements_met := user_stats.current_streak >= 30;
      WHEN 'first_week' THEN
        requirements_met := user_stats.total_days_completed >= 7;
      WHEN 'first_month' THEN
        requirements_met := user_stats.total_days_completed >= 30;
      -- Add more achievement checks as needed
    END CASE;
    
    -- If requirements met, unlock achievement
    IF requirements_met THEN
      INSERT INTO user_achievements (user_id, achievement_id, aura_earned)
      VALUES (p_user_id, achievement_record.id, achievement_record.aura_reward)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
      
      -- Add aura points for achievement
      PERFORM add_aura_points(
        p_user_id,
        'achievement_unlocked',
        achievement_record.aura_reward,
        'Achievement unlocked: ' || achievement_record.name,
        jsonb_build_object('achievement_id', achievement_record.id)
      );
      
      -- Return achievement details
      achievement_id := achievement_record.id;
      aura_earned := achievement_record.aura_reward;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
