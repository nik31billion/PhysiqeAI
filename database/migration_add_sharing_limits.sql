-- Migration: Add sharing limits and tracking
-- This migration adds a table to track user sharing activities and implement daily/weekly limits

-- Create sharing_activities table to track user sharing
CREATE TABLE IF NOT EXISTS sharing_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'whatsapp', 'instagram', 'x', 'facebook', 'general', etc.
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aura_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sharing_activities_user_id ON sharing_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_sharing_activities_shared_at ON sharing_activities(shared_at);
CREATE INDEX IF NOT EXISTS idx_sharing_activities_user_shared_at ON sharing_activities(user_id, shared_at);

-- Create sharing_limits table to store daily/weekly limits
CREATE TABLE IF NOT EXISTS sharing_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    limit_type VARCHAR(20) NOT NULL, -- 'daily' or 'weekly'
    max_shares INTEGER NOT NULL DEFAULT 5, -- Maximum shares per period
    aura_per_share INTEGER NOT NULL DEFAULT 10, -- Aura points per share
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sharing limits
INSERT INTO sharing_limits (limit_type, max_shares, aura_per_share) 
VALUES 
    ('daily', 3, 15), -- 3 shares per day, 15 aura each
    ('weekly', 10, 10) -- 10 shares per week, 10 aura each
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE sharing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sharing_activities
CREATE POLICY "Users can view their own sharing activities" ON sharing_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sharing activities" ON sharing_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sharing_limits (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view sharing limits" ON sharing_limits
    FOR SELECT USING (auth.role() = 'authenticated');

-- Function to check if user can share (within limits)
CREATE OR REPLACE FUNCTION can_user_share(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    daily_limit INTEGER;
    weekly_limit INTEGER;
    daily_count INTEGER;
    weekly_count INTEGER;
    daily_aura INTEGER;
    weekly_aura INTEGER;
    result JSON;
BEGIN
    -- Get daily limits
    SELECT max_shares, aura_per_share INTO daily_limit, daily_aura
    FROM sharing_limits WHERE limit_type = 'daily' LIMIT 1;
    
    -- Get weekly limits
    SELECT max_shares, aura_per_share INTO weekly_limit, weekly_aura
    FROM sharing_limits WHERE limit_type = 'weekly' LIMIT 1;
    
    -- Count daily shares (last 24 hours)
    SELECT COUNT(*) INTO daily_count
    FROM sharing_activities 
    WHERE user_id = user_uuid 
    AND shared_at >= NOW() - INTERVAL '24 hours';
    
    -- Count weekly shares (last 7 days)
    SELECT COUNT(*) INTO weekly_count
    FROM sharing_activities 
    WHERE user_id = user_uuid 
    AND shared_at >= NOW() - INTERVAL '7 days';
    
    -- Build result
    result := json_build_object(
        'can_share', (daily_count < daily_limit) AND (weekly_count < weekly_limit),
        'daily_remaining', GREATEST(0, daily_limit - daily_count),
        'weekly_remaining', GREATEST(0, weekly_limit - weekly_count),
        'daily_limit', daily_limit,
        'weekly_limit', weekly_limit,
        'daily_aura', daily_aura,
        'weekly_aura', weekly_aura,
        'daily_count', daily_count,
        'weekly_count', weekly_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a share and return aura earned
CREATE OR REPLACE FUNCTION record_share(
    user_uuid UUID,
    platform_name VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
    daily_limit INTEGER;
    weekly_limit INTEGER;
    daily_count INTEGER;
    weekly_count INTEGER;
    daily_aura INTEGER;
    weekly_aura INTEGER;
    daily_remaining INTEGER;
    weekly_remaining INTEGER;
    aura_to_award INTEGER;
    can_share BOOLEAN;
    limits_data JSON;
    result JSON;
BEGIN
    -- Check if user can share
    SELECT can_user_share(user_uuid) INTO limits_data;
    
    -- Extract values from JSON
    can_share := (limits_data->>'can_share')::BOOLEAN;
    daily_remaining := (limits_data->>'daily_remaining')::INTEGER;
    weekly_remaining := (limits_data->>'weekly_remaining')::INTEGER;
    daily_limit := (limits_data->>'daily_limit')::INTEGER;
    weekly_limit := (limits_data->>'weekly_limit')::INTEGER;
    daily_aura := (limits_data->>'daily_aura')::INTEGER;
    weekly_aura := (limits_data->>'weekly_aura')::INTEGER;
    daily_count := (limits_data->>'daily_count')::INTEGER;
    weekly_count := (limits_data->>'weekly_count')::INTEGER;
    
    IF NOT can_share THEN
        result := json_build_object(
            'success', false,
            'error', 'Sharing limit exceeded',
            'daily_remaining', daily_remaining,
            'weekly_remaining', weekly_remaining
        );
        RETURN result;
    END IF;
    
    -- Determine aura to award based on which limit is closer
    IF daily_count < daily_limit THEN
        aura_to_award := daily_aura;
    ELSE
        aura_to_award := weekly_aura;
    END IF;
    
    -- Record the share
    INSERT INTO sharing_activities (user_id, platform, aura_earned)
    VALUES (user_uuid, platform_name, aura_to_award);
    
    -- Return success with aura earned
    result := json_build_object(
        'success', true,
        'aura_earned', aura_to_award,
        'platform', platform_name,
        'daily_remaining', daily_remaining - 1,
        'weekly_remaining', weekly_remaining - 1
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_user_share(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_share(UUID, VARCHAR) TO authenticated;
