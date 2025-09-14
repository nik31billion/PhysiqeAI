-- Migration: Add day_completions table for tracking daily plan completion
-- This table stores when users complete their daily workout/meal plans

CREATE TABLE IF NOT EXISTS day_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL, -- YYYY-MM-DD format
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one completion per user per day
  UNIQUE(user_id, completed_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_day_completions_user_id ON day_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_day_completions_plan_id ON day_completions(plan_id);
CREATE INDEX IF NOT EXISTS idx_day_completions_date ON day_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_day_completions_active ON day_completions(is_active);

-- Enable Row Level Security
ALTER TABLE day_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own day completions" ON day_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own day completions" ON day_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own day completions" ON day_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_day_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_day_completions_updated_at
  BEFORE UPDATE ON day_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_day_completions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE day_completions IS 'Tracks daily completion of workout and meal plans';
COMMENT ON COLUMN day_completions.completed_date IS 'Date when the plan was completed (YYYY-MM-DD)';
COMMENT ON COLUMN day_completions.completed_at IS 'Timestamp when the completion was recorded';
COMMENT ON COLUMN day_completions.is_active IS 'Whether this completion record is active (for soft deletes)';
