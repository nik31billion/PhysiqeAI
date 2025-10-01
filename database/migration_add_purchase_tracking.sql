-- Migration: Add purchase tracking fields
-- Purpose: Track RevenueCat purchase completion and user data for analytics
-- Date: 2024-12-26

-- Add purchase tracking columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS purchase_successful BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS product_identifier TEXT,
ADD COLUMN IF NOT EXISTS revenue_cat_user_id TEXT;

-- Create index for better query performance on purchase tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_purchase_successful ON user_profiles(purchase_successful);
CREATE INDEX IF NOT EXISTS idx_user_profiles_revenue_cat_user_id ON user_profiles(revenue_cat_user_id);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.purchase_successful IS 'Tracks whether user completed purchase successfully during onboarding';
COMMENT ON COLUMN user_profiles.product_identifier IS 'RevenueCat product identifier (e.g., flexaura_monthly)';
COMMENT ON COLUMN user_profiles.revenue_cat_user_id IS 'RevenueCat customer ID for support and analytics';

-- Show confirmation
SELECT 'Purchase tracking fields added successfully' as status;
