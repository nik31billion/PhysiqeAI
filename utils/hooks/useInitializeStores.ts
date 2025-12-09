/**
 * Hook to initialize Zustand stores on app load
 * Loads cached data immediately for instant UI
 */

import { useEffect } from 'react';
import { useCaloriesStore, useAuraStore } from '../stores';

export const useInitializeStores = (userId: string | null, userPlan: any) => {
  const loadCaloriesFromCache = useCaloriesStore((state) => state.loadFromCache);
  const syncCaloriesWithDB = useCaloriesStore((state) => state.syncWithDatabase);
  const loadAuraFromCache = useAuraStore((state) => state.loadFromCache);
  const syncAuraWithDB = useAuraStore((state) => state.syncWithDatabase);

  useEffect(() => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];

    // Load calories from cache immediately
    loadCaloriesFromCache(userId, today).then(() => {
      // Sync with DB in background
      if (userPlan) {
        syncCaloriesWithDB(userId, today, userPlan).catch(() => {
          // Silently handle errors
        });
      }
    });

    // Load aura from cache immediately
    loadAuraFromCache(userId).then(() => {
      // Sync with DB in background
      syncAuraWithDB(userId).catch(() => {
        // Silently handle errors
      });
    });
  }, [userId, userPlan]);
};

