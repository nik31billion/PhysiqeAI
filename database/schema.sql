-- User Profiles Table for Onboarding Data
-- This table stores all user onboarding information and profile data

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT, -- User's custom display name
  
  -- Onboarding completion status
  onboarding_complete BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0, -- Track current step (0-22)
  
  -- Basic Information (OnboardingScreen3-4)
  primary_goal TEXT, -- lose-weight, gain-muscle, improve-mood, transformation, others
  fitness_goal TEXT, -- lose-fat, gain-muscle, maintain-weight, other
  other_goal_description TEXT,
  
  -- Personal Stats (OnboardingScreen5-8)
  gender TEXT, -- male, female, other
  age INTEGER,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT, -- sedentary, lightly-active, moderately-active, very-active, extremely-active
  
  -- Fitness Preferences (OnboardingScreen9-12)
  workout_frequency INTEGER, -- days per week
  workout_duration INTEGER, -- minutes per session
  preferred_workout_time TEXT, -- morning, afternoon, evening
  fitness_experience TEXT, -- beginner, intermediate, advanced
  
  -- Goals and Preferences (OnboardingScreen13-16)
  target_weight_kg DECIMAL(5,2),
  target_date DATE,
  motivation_level INTEGER, -- 1-10 scale
  preferred_exercises TEXT[], -- array of exercise types
  
  -- Lifestyle and Preferences (OnboardingScreen17-20)
  dietary_preferences TEXT, -- vegetarian, vegan, keto, paleo, etc.
  allergies TEXT[],
  medical_conditions TEXT[],
  equipment_available TEXT[], -- home, gym, minimal
  
  -- Final Preferences (OnboardingScreen21-22)
  notification_preferences JSONB, -- push notifications, email, etc.
  privacy_settings JSONB,
  additional_notes TEXT,
  selected_plan TEXT, -- selected subscription plan
  coupon_code TEXT, -- coupon code for discounts
  purchase_successful BOOLEAN DEFAULT FALSE, -- whether purchase completed successfully
  product_identifier TEXT, -- RevenueCat product identifier
  revenue_cat_user_id TEXT, -- RevenueCat customer ID
  
  -- Profile Picture (OnboardingScreen8)
  profile_picture TEXT, -- user profile picture URI
  
  -- Physique Inspiration (OnboardingScreen9)
  physique_inspiration TEXT, -- character name or custom description
  physique_character_id TEXT, -- selected character ID
  physique_uploaded_image TEXT, -- uploaded image URI
  physique_category TEXT, -- anime, k-drama, celebrity
  
  -- Additional Onboarding Fields
  target_timeline_weeks INTEGER, -- target timeline in weeks
  fitness_obstacles TEXT[], -- array of fitness obstacles
  meal_frequency TEXT, -- preferred meal frequency
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Plans Table for storing personalized workout and diet plans
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan metadata
  plan_version INTEGER DEFAULT 1,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  -- User data snapshot (for plan generation context)
  user_snapshot JSONB,

  -- Generated plans from Gemini
  workout_plan JSONB,
  diet_plan JSONB,

  -- Status and error handling
  generation_status TEXT DEFAULT 'generating', -- generating, completed, failed
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only access their own plans
CREATE POLICY "Users can view own plans" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON user_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp for plans
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_complete ON user_profiles(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_step ON user_profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_active ON user_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_plans_generated_at ON user_plans(generated_at);
