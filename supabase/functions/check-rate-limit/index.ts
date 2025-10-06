// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface RegenerationLimit {
  id: string;
  user_id: string;
  plan_type: 'workout' | 'diet' | 'both';
  last_regenerated_at: string;
  created_at: string;
  updated_at: string;
}

interface RateLimitResult {
  canRegenerate: boolean;
  nextAvailableAt?: Date;
  hoursRemaining?: number;
  message?: string;
}

/**
 * Checks if user can regenerate a specific plan type
 */
async function checkRegenerationLimit(
  supabase: any,
  userId: string,
  planType: 'workout' | 'diet' | 'both'
): Promise<RateLimitResult> {
  try {
    const { data: limit, error } = await supabase
      .from('user_regeneration_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', planType)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking regeneration limit:', error);
      // If there's an error, allow regeneration (fail open)
      return { canRegenerate: true };
    }

    if (!limit) {
      // No limit found, user can regenerate
      return { canRegenerate: true };
    }

    const lastRegenerated = new Date(limit.last_regenerated_at);
    const now = new Date();
    const hoursSinceLastRegeneration = (now.getTime() - lastRegenerated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastRegeneration >= 24) {
      // 24 hours have passed, user can regenerate
      return { canRegenerate: true };
    }

    // Calculate when user can regenerate again
    const nextAvailableAt = new Date(lastRegenerated.getTime() + (24 * 60 * 60 * 1000));
    const hoursRemaining = Math.ceil((nextAvailableAt.getTime() - now.getTime()) / (1000 * 60 * 60));

    return {
      canRegenerate: false,
      nextAvailableAt,
      hoursRemaining,
      message: `You can regenerate your ${planType} plan in ${hoursRemaining} hours`
    };

  } catch (error) {
    console.error('Error in checkRegenerationLimit:', error);
    // Fail open - allow regeneration if there's an error
    return { canRegenerate: true };
  }
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { userId, planType } = await req.json()
    
    if (!userId || !planType) {
      return new Response(
        JSON.stringify({ error: 'userId and planType are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate planType
    if (!['workout', 'diet', 'both'].includes(planType)) {
      return new Response(
        JSON.stringify({ error: 'planType must be workout, diet, or both' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check rate limit
    const rateLimitResult = await checkRegenerationLimit(supabase, userId, planType)

    return new Response(
      JSON.stringify(rateLimitResult),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )

  } catch (error) {
    console.error('Error in check-rate-limit:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        canRegenerate: true // Fail open
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})
