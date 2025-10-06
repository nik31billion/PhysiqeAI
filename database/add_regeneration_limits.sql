-- Add regeneration limits table for rate limiting plan regeneration
-- This prevents users from regenerating plans too frequently

CREATE TABLE IF NOT EXISTS user_regeneration_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('workout', 'diet', 'both')),
  last_regenerated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_type)
);

-- Enable RLS
ALTER TABLE user_regeneration_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own regeneration limits" ON user_regeneration_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own regeneration limits" ON user_regeneration_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own regeneration limits" ON user_regeneration_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_regeneration_limits_user_id ON user_regeneration_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_regeneration_limits_type ON user_regeneration_limits(user_id, plan_type);
CREATE INDEX IF NOT EXISTS idx_user_regeneration_limits_last_regenerated ON user_regeneration_limits(last_regenerated_at);

-- Add comment for documentation
COMMENT ON TABLE user_regeneration_limits IS 'Tracks when users last regenerated each type of plan to enforce 24-hour rate limits';
COMMENT ON COLUMN user_regeneration_limits.plan_type IS 'Type of plan: workout, diet, or both';
COMMENT ON COLUMN user_regeneration_limits.last_regenerated_at IS 'Timestamp of last regeneration for this plan type';
