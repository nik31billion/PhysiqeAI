-- Remove the recent_coach_glow_chats view entirely
-- We'll use the main coach_glow_chats table with filtering instead

-- Drop the view
DROP VIEW IF EXISTS recent_coach_glow_chats;

-- The main coach_glow_chats table already has proper RLS policies
-- Users can query it directly with date filtering:

-- Example query for recent chats:
-- SELECT * FROM coach_glow_chats 
-- WHERE created_at >= NOW() - INTERVAL '30 days'
-- ORDER BY created_at DESC;
