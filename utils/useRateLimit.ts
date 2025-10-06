import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface RateLimitInfo {
  canRegenerate: boolean;
  nextAvailableAt?: string;
  hoursRemaining?: number;
  message?: string;
}

export function useRateLimit(userId: string, planType: 'workout' | 'diet' | 'both') {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({ canRegenerate: true });
  const [loading, setLoading] = useState(false);

  const checkRateLimit = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-rate-limit', {
        body: { userId, planType }
      });

      if (error) throw error;
      
      setRateLimitInfo(data);
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow regeneration if there's an error
      setRateLimitInfo({ canRegenerate: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRateLimit();
  }, [userId, planType]);

  return {
    ...rateLimitInfo,
    loading,
    refresh: checkRateLimit
  };
}
