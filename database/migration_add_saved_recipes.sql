-- Migration: Add saved recipes table
-- This table stores user's saved/favorite recipes from their meal plans

CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recipe details
  meal_name TEXT NOT NULL,
  description TEXT,
  kcal INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  ingredients TEXT[],
  instructions TEXT[],
  cooking_time TEXT,
  serving_size TEXT,
  
  -- Source information
  source_plan_id UUID REFERENCES user_plans(id) ON DELETE SET NULL,
  source_day TEXT, -- e.g., "Monday", "Tuesday"
  source_meal_type TEXT, -- e.g., "Breakfast", "Lunch", "Dinner"
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT TRUE,
  notes TEXT, -- User's personal notes about the recipe
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only access their own saved recipes
CREATE POLICY "Users can view own saved recipes" ON saved_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved recipes" ON saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved recipes" ON saved_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved recipes" ON saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE TRIGGER update_saved_recipes_updated_at
  BEFORE UPDATE ON saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_meal_name ON saved_recipes(meal_name);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_created_at ON saved_recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_is_favorite ON saved_recipes(user_id, is_favorite);

-- Add comment to table
COMMENT ON TABLE saved_recipes IS 'Stores user saved/favorite recipes from meal plans';
