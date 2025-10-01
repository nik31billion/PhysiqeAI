-- Fix RLS policies for aura system
-- This migration fixes the RLS policy issue that prevents user_aura_summary creation

-- Add policy to allow service role to insert user_aura_summary records
-- This is needed for the initialize_user_aura_summary trigger function
CREATE POLICY "Service role can insert aura summary" ON user_aura_summary
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add policy to allow service role to insert aura_events records
-- This is needed for aura-related functions that run with service role
CREATE POLICY "Service role can insert aura events" ON aura_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add policy to allow service role to update user_aura_summary records
-- This is needed for aura-related functions that run with service role
CREATE POLICY "Service role can update aura summary" ON user_aura_summary
  FOR UPDATE USING (auth.role() = 'service_role');

-- Ensure the initialize_user_aura_summary function is properly set as SECURITY DEFINER
-- This allows it to bypass RLS when called from triggers
CREATE OR REPLACE FUNCTION initialize_user_aura_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_aura_summary (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the add_aura function is properly set as SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_aura(
  p_user_id UUID,
  p_aura_delta INTEGER,
  p_event_type TEXT,
  p_event_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_aura INTEGER;
  v_new_aura INTEGER;
BEGIN
  -- Get current aura total
  SELECT COALESCE(total_aura, 0) INTO v_current_aura
  FROM user_aura_summary
  WHERE user_id = p_user_id;
  
  -- Calculate new aura total
  v_new_aura := v_current_aura + p_aura_delta;
  
  -- Ensure aura doesn't go below 0
  IF v_new_aura < 0 THEN
    v_new_aura := 0;
  END IF;
  
  -- Insert aura event
  INSERT INTO aura_events (
    user_id,
    event_type,
    event_description,
    aura_delta,
    current_aura_total,
    event_date,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_description,
    p_aura_delta,
    v_new_aura,
    CURRENT_DATE,
    p_metadata
  );
  
  -- Update user aura summary
  INSERT INTO user_aura_summary (user_id, total_aura, updated_at)
  VALUES (p_user_id, v_new_aura, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_aura = v_new_aura,
    updated_at = NOW();
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'new_aura_total', v_new_aura,
    'aura_delta', p_aura_delta
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
