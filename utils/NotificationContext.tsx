import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService, NotificationPreferences } from './notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  preferences: NotificationPreferences;
  loading: boolean;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'celebration') => void;
  showMilestone: (milestone: string, streakDays?: number) => void;
  initializeNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getDefaultPreferences()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
      initializeNotifications();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const prefs = await notificationService.loadPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<NotificationPreferences>) => {
    if (!user?.id) return;

    const newPreferences = { ...preferences, ...prefs };
    setPreferences(newPreferences);

    try {
      await notificationService.savePreferences(user.id, newPreferences);
      await notificationService.scheduleRecurringNotifications(user.id, newPreferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Revert on error
      setPreferences(preferences);
    }
  };

  const initializeNotifications = async () => {
    if (!user?.id) return;

    try {
      const initialized = await notificationService.initialize();
      if (initialized) {
        await notificationService.scheduleRecurringNotifications(user.id, preferences);
        
        // Show info about Expo Go limitations
        if (notificationService.isRunningInExpoGo()) {
          console.log('📱 Running in Expo Go: System notifications are disabled. In-app notifications will still work.');
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'celebration' = 'info') => {
    // This will be handled by the NotificationManager component
    // For now, we'll just log it
    console.log(`Toast: ${title} - ${message} (${type})`);
  };

  const showMilestone = (milestone: string, streakDays?: number) => {
    // This will be handled by the NotificationManager component
    console.log(`Milestone: ${milestone} (${streakDays} days)`);
  };

  const value: NotificationContextType = {
    preferences,
    loading,
    updatePreferences,
    showToast,
    showMilestone,
    initializeNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
