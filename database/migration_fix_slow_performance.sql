-- Revert Performance Issues - Remove optimization migration that's causing slowdowns
-- This removes the complex functions and indexes that were causing the 3-minute loading times

-- 1. Drop the complex optimized functions that are causing the slowdown
DROP FUNCTION IF EXISTS get_user_aura_summary_optimized(UUID);
DROP FUNCTION IF EXISTS get_user_data_optimized(UUID);

-- 2. Drop the indexes that might be causing poor query performance
DROP INDEX IF EXISTS idx_aura_events_user_date;
DROP INDEX IF EXISTS idx_day_completions_user_active;  
DROP INDEX IF EXISTS idx_user_plans_user_active;

-- 3. Re-add simple indexes that actually help performance
CREATE INDEX IF NOT EXISTS idx_aura_events_user_id 
ON aura_events(user_id);

CREATE INDEX IF NOT EXISTS idx_day_completions_user_id 
ON day_completions(user_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id
ON user_plans(user_id, is_active);

-- 4. Keep the simple performance improvements without the complex joins
-- Note: The original functions were much simpler and faster
-- This ensures we go back to simple, fast queries
