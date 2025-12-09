/**
 * Zustand store for Aura data with AsyncStorage persistence
 * Provides instant access to Aura data without waiting for DB queries
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuraSummary {
  total_aura: number;
  current_streak: number;
  best_streak: number;
  daily_aura_earned: number;
  achievements_unlocked: string[];
  shares_today: number;
  coach_glo_interactions_today: number;
  updated_at?: string;
}

interface AuraState {
  auraSummary: AuraSummary | null;
  isLoading: boolean;
  lastSynced: number | null;
  
  // Actions
  setAuraSummary: (summary: AuraSummary) => void;
  addAuraPoints: (points: number, userId?: string) => Promise<void>;
  loadFromCache: (userId: string) => Promise<void>;
  syncWithDatabase: (userId: string) => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY_PREFIX = 'aura_store_';
const DEFAULT_AURA: AuraSummary = {
  total_aura: 0,
  current_streak: 0,
  best_streak: 0,
  daily_aura_earned: 0,
  achievements_unlocked: [],
  shares_today: 0,
  coach_glo_interactions_today: 0,
};

export const useAuraStore = create<AuraState>((set, get) => ({
  auraSummary: DEFAULT_AURA, // Initialize with default instead of null to prevent showing 0
  isLoading: false,
  lastSynced: null,

  setAuraSummary: (summary: AuraSummary) => {
    set({ auraSummary: summary });
  },

  addAuraPoints: async (points: number, userId?: string) => {
    const state = get();
    let updated;
    
    if (state.auraSummary) {
      updated = {
        ...state.auraSummary,
        total_aura: state.auraSummary.total_aura + points,
        daily_aura_earned: state.auraSummary.daily_aura_earned + points,
        updated_at: new Date().toISOString(),
      };
      set({ auraSummary: updated });
    } else {
      // Initialize with default if not loaded yet
      updated = {
        ...DEFAULT_AURA,
        total_aura: points,
        daily_aura_earned: points,
        updated_at: new Date().toISOString(),
      };
      set({ auraSummary: updated });
    }
    
    // Persist to AsyncStorage immediately if userId provided
    if (userId) {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify({
          auraSummary: updated,
          lastSynced: state.lastSynced,
        }));
      } catch (error) {
        console.error('Error saving aura to cache:', error);
      }
    }
  },

  loadFromCache: async (userId: string) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      const cached = await AsyncStorage.getItem(storageKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        set({
          auraSummary: data.auraSummary || DEFAULT_AURA,
          lastSynced: data.lastSynced || null,
        });
      } else {
        // Initialize with default if no cache
        set({ auraSummary: DEFAULT_AURA });
      }
    } catch (error) {
      console.error('Error loading aura from cache:', error);
      set({ auraSummary: DEFAULT_AURA });
    }
  },

  syncWithDatabase: async (userId: string) => {
    const state = get();
    
    // Don't sync if already synced recently (within 30 seconds)
    if (state.lastSynced && Date.now() - state.lastSynced < 30000) {
      return;
    }

    // Store optimistic state before sync
    const optimisticAura = state.auraSummary?.total_aura || 0;

    set({ isLoading: true });

    try {
      const { getUserAuraSummary } = await import('../auraService');
      const auraSummary = await getUserAuraSummary(userId);
      
      if (auraSummary) {
        // Merge optimistic updates with DB data - use higher value
        const finalAura = Math.max(auraSummary.total_aura, optimisticAura);
        const mergedSummary = {
          ...auraSummary,
          total_aura: finalAura,
          // Keep optimistic daily_aura_earned if higher
          daily_aura_earned: Math.max(auraSummary.daily_aura_earned || 0, state.auraSummary?.daily_aura_earned || 0),
        };
        
        set({
          auraSummary: mergedSummary,
          lastSynced: Date.now(),
          isLoading: false,
        });
        
        // Save to cache
        const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify({
          auraSummary: mergedSummary,
          lastSynced: Date.now(),
        }));
      } else {
        // Use optimistic data if available, otherwise default
        const finalSummary = state.auraSummary && state.auraSummary.total_aura > 0 
          ? state.auraSummary 
          : DEFAULT_AURA;
        
        set({
          auraSummary: finalSummary,
          lastSynced: Date.now(),
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error syncing aura with database:', error);
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      auraSummary: DEFAULT_AURA,
      lastSynced: null,
    });
  },
}));

