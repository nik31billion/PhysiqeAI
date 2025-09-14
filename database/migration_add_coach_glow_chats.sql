-- Coach Glow Chat Logs Table
-- This table stores all interactions between users and Coach Glow for tracking and personalization

CREATE TABLE IF NOT EXISTS coach_glow_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Chat content
  user_message TEXT NOT NULL,
  coach_response TEXT NOT NULL,
  intent TEXT NOT NULL, -- 'motivation', 'plan_swap', 'general'
  
  -- Context and metadata
  context JSONB, -- Additional context like current day, meal type, etc.
  response_time_ms INTEGER, -- Time taken to generate response
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE coach_glow_chats ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only access their own chat logs
CREATE POLICY "Users can view own chat logs" ON coach_glow_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat logs" ON coach_glow_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coach_glow_chats_user_id ON coach_glow_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_glow_chats_created_at ON coach_glow_chats(created_at);
CREATE INDEX IF NOT EXISTS idx_coach_glow_chats_intent ON coach_glow_chats(intent);

-- Create a view for recent chat history (last 30 days)
CREATE OR REPLACE VIEW recent_coach_glow_chats AS
SELECT 
  user_id,
  user_message,
  coach_response,
  intent,
  context,
  created_at
FROM coach_glow_chats
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON recent_coach_glow_chats TO authenticated;
