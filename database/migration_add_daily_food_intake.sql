-- Migration: Add daily food intake tracking
-- This table tracks individual food items added through the food scanner

-- Create daily_food_intake table
CREATE TABLE IF NOT EXISTS daily_food_intake (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Food item details
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  
  -- Nutrition information
  calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein_g DECIMAL(6,2) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(6,2) NOT NULL DEFAULT 0,
  fat_g DECIMAL(6,2) NOT NULL DEFAULT 0,
  fiber_g DECIMAL(6,2) DEFAULT 0,
  sugar_g DECIMAL(6,2) DEFAULT 0,
  sodium_mg DECIMAL(8,2) DEFAULT 0,
  
  -- Source and confidence
  source TEXT NOT NULL CHECK (source IN ('food_scanner', 'barcode_scanner', 'manual_entry')) DEFAULT 'food_scanner',
  confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100 confidence from AI analysis
  
  -- Meal categorization (optional)
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_food_intake_user_date ON daily_food_intake(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_food_intake_user_id ON daily_food_intake(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_food_intake_date ON daily_food_intake(date);
CREATE INDEX IF NOT EXISTS idx_daily_food_intake_source ON daily_food_intake(source);
CREATE INDEX IF NOT EXISTS idx_daily_food_intake_created_at ON daily_food_intake(created_at);

-- Enable Row Level Security
ALTER TABLE daily_food_intake ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own food intake records
CREATE POLICY "Users can view own food intake" ON daily_food_intake
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own food intake records
CREATE POLICY "Users can insert own food intake" ON daily_food_intake
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own food intake records
CREATE POLICY "Users can update own food intake" ON daily_food_intake
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own food intake records
CREATE POLICY "Users can delete own food intake" ON daily_food_intake
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can access all records (for analytics)
CREATE POLICY "Service role can access all food intake" ON daily_food_intake
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_food_intake TO authenticated;
GRANT ALL ON daily_food_intake TO service_role;

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_daily_food_intake_updated_at
  BEFORE UPDATE ON daily_food_intake
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE daily_food_intake IS 'Tracks individual food items consumed daily, including items from food scanner';
COMMENT ON COLUMN daily_food_intake.source IS 'Source of the food entry: food_scanner, barcode_scanner, or manual_entry';
COMMENT ON COLUMN daily_food_intake.confidence_score IS 'AI confidence score (0-100) for scanned food items';
COMMENT ON COLUMN daily_food_intake.meal_type IS 'Optional meal categorization for better organization';

-- Create helper function to get daily calorie intake for a user
CREATE OR REPLACE FUNCTION get_daily_calorie_intake(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  total_calories DECIMAL(8,2),
  total_protein DECIMAL(6,2),
  total_carbs DECIMAL(6,2),
  total_fat DECIMAL(6,2),
  food_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(calories), 0) as total_calories,
    COALESCE(SUM(protein_g), 0) as total_protein,
    COALESCE(SUM(carbs_g), 0) as total_carbs,
    COALESCE(SUM(fat_g), 0) as total_fat,
    COUNT(*)::INTEGER as food_count
  FROM daily_food_intake
  WHERE user_id = p_user_id 
    AND date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_daily_calorie_intake TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_calorie_intake TO service_role;
