        -- Migration: Add individual meal and exercise completion tracking
-- This allows users to complete meals and exercises individually

-- Table for tracking individual meal completions
CREATE TABLE IF NOT EXISTS meal_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL, -- YYYY-MM-DD format
  meal_index INTEGER NOT NULL, -- Index of meal in the day's meal plan (0, 1, 2, etc.)
  meal_name TEXT NOT NULL, -- Name of the meal (e.g., "Breakfast", "Lunch")
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one completion per user per meal per day
  UNIQUE(user_id, completed_date, meal_index)
);

-- Table for tracking individual exercise completions
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL, -- YYYY-MM-DD format
  exercise_index INTEGER NOT NULL, -- Index of exercise in the day's workout plan (0, 1, 2, etc.)
  exercise_name TEXT NOT NULL, -- Name of the exercise
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one completion per user per exercise per day
  UNIQUE(user_id, completed_date, exercise_index)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_completions_user_id ON meal_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_completions_plan_id ON meal_completions(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_completions_date ON meal_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_meal_completions_active ON meal_completions(is_active);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_user_id ON exercise_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_plan_id ON exercise_completions(plan_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_date ON exercise_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_active ON exercise_completions(is_active);

-- Enable Row Level Security
ALTER TABLE meal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meal_completions
CREATE POLICY "Users can view their own meal completions" ON meal_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal completions" ON meal_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal completions" ON meal_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for exercise_completions
CREATE POLICY "Users can view their own exercise completions" ON exercise_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise completions" ON exercise_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise completions" ON exercise_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp for meal completions
CREATE OR REPLACE FUNCTION update_meal_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically update updated_at timestamp for exercise completions
CREATE OR REPLACE FUNCTION update_exercise_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_meal_completions_updated_at
  BEFORE UPDATE ON meal_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_completions_updated_at();

CREATE TRIGGER trigger_update_exercise_completions_updated_at
  BEFORE UPDATE ON exercise_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_completions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE meal_completions IS 'Tracks individual meal completions within daily plans';
COMMENT ON TABLE exercise_completions IS 'Tracks individual exercise completions within daily workouts';
COMMENT ON COLUMN meal_completions.meal_index IS 'Index of meal in the day (0=breakfast, 1=lunch, 2=dinner, etc.)';
COMMENT ON COLUMN exercise_completions.exercise_index IS 'Index of exercise in the day (0=first exercise, 1=second, etc.)';
