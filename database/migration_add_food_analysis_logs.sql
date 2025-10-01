-- Migration: Add food analysis logs table
-- This table tracks food scanner usage and accuracy

-- Create food_analysis_logs table
CREATE TABLE IF NOT EXISTS food_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scan_mode TEXT NOT NULL CHECK (scan_mode IN ('food', 'barcode', 'label')),
  food_items_count INTEGER NOT NULL DEFAULT 0,
  total_calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  average_confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_food_analysis_logs_user_id ON food_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_analysis_logs_created_at ON food_analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_food_analysis_logs_scan_mode ON food_analysis_logs(scan_mode);
CREATE INDEX IF NOT EXISTS idx_food_analysis_logs_success ON food_analysis_logs(success);

-- Enable Row Level Security
ALTER TABLE food_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own food analysis logs
CREATE POLICY "Users can view own food analysis logs" ON food_analysis_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own food analysis logs
CREATE POLICY "Users can insert own food analysis logs" ON food_analysis_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access all logs (for analytics)
CREATE POLICY "Service role can access all food analysis logs" ON food_analysis_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT ON food_analysis_logs TO authenticated;
GRANT ALL ON food_analysis_logs TO service_role;

-- Add comment for documentation
COMMENT ON TABLE food_analysis_logs IS 'Tracks food scanner usage, accuracy metrics, and errors for analytics and improvement';
COMMENT ON COLUMN food_analysis_logs.scan_mode IS 'Type of scan: food (camera), barcode, or nutrition label';
COMMENT ON COLUMN food_analysis_logs.food_items_count IS 'Number of food items detected in the scan';
COMMENT ON COLUMN food_analysis_logs.total_calories IS 'Total calories detected across all food items';
COMMENT ON COLUMN food_analysis_logs.average_confidence IS 'Average confidence score (0-100) across all detected items';
COMMENT ON COLUMN food_analysis_logs.success IS 'Whether the analysis completed successfully';
COMMENT ON COLUMN food_analysis_logs.error_message IS 'Error message if analysis failed';
