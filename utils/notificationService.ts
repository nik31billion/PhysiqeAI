import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  workoutTime: string; // Format: "HH:MM" (24-hour)
  mealTime: string; // Format: "HH:MM" (24-hour)
  streakTime: string; // Format: "HH:MM" (24-hour)
  workoutReminders: boolean;
  mealReminders: boolean;
  streakReminders: boolean;
  milestoneCelebrations: boolean;
  coachGlowMessages: boolean;
}

export interface NotificationMessage {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private notificationIds: string[] = [];
  private isExpoGo = false;

  private constructor() {
    // Check if running in Expo Go
    this.isExpoGo = Constants.appOwnership === 'expo';
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // Check if running in Expo Go
    if (this.isExpoGo) {
      console.warn('⚠️ Notifications are not fully supported in Expo Go. Please use a development build for full functionality.');
      this.isInitialized = true;
      return true; // Return true but with limited functionality
    }

    try {
      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Flex Aura Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#B7FCE7',
        });
      }

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      workoutTime: '08:00',
      mealTime: '12:00',
      streakTime: '19:00',
      workoutReminders: true,
      mealReminders: true,
      streakReminders: true,
      milestoneCelebrations: true,
      coachGlowMessages: true,
    };
  }

  /**
   * Load notification preferences from storage
   */
  async loadPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(`notification_preferences_${userId}`);
      if (stored) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
      }
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Save notification preferences to storage
   */
  async savePreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(`notification_preferences_${userId}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Schedule all recurring notifications based on user preferences
   */
  async scheduleRecurringNotifications(userId: string, preferences: NotificationPreferences): Promise<void> {
    if (!preferences.enabled) {
      await this.cancelAllNotifications();
      return;
    }

    // Skip scheduling in Expo Go
    if (this.isExpoGo) {
      console.log('📱 Expo Go detected: Notifications will be shown as in-app toasts only');
      return;
    }

    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      // Schedule workout reminders
      if (preferences.workoutReminders) {
        await this.scheduleWorkoutReminder(preferences.workoutTime);
      }

      // Schedule meal reminders
      if (preferences.mealReminders) {
        await this.scheduleMealReminder(preferences.mealTime);
      }

      // Schedule streak reminders
      if (preferences.streakReminders) {
        await this.scheduleStreakReminder(preferences.streakTime);
      }

      console.log('Recurring notifications scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule recurring notifications:', error);
    }
  }

  /**
   * Schedule workout reminder notification
   */
  private async scheduleWorkoutReminder(time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ready to crush your workout and boost your aura? Let\'s go! 💪',
        body: 'Time to flex your aura and get those gains!',
        data: { type: 'workout_reminder' },
      },
      trigger,
    });

    this.notificationIds.push(notificationId);
  }

  /**
   * Schedule meal reminder notification
   */
  private async scheduleMealReminder(time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Don\'t forget to check your meal plan and log your food for max aura! 🍽️',
        body: 'Fuel your body right and keep that aura glowing!',
        data: { type: 'meal_reminder' },
      },
      trigger,
    });

    this.notificationIds.push(notificationId);
  }

  /**
   * Schedule streak reminder notification
   */
  private async scheduleStreakReminder(time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Streak at risk! Log today\'s workout or meal to keep your aura glowing.',
        body: 'Don\'t let your streak break! Your aura depends on it! ✨',
        data: { type: 'streak_reminder' },
      },
      trigger,
    });

    this.notificationIds.push(notificationId);
  }

  /**
   * Send immediate notification (for missed activities)
   */
  async sendImmediateNotification(message: NotificationMessage): Promise<void> {
    // In Expo Go, we'll rely on in-app toasts instead of system notifications
    if (this.isExpoGo) {
      console.log('📱 Expo Go: Would show notification:', message.title, message.body);
      return;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: message.data || {},
        },
        trigger: null, // Immediate
      });

      this.notificationIds.push(notificationId);
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
    }
  }

  /**
   * Send milestone celebration notification
   */
  async sendMilestoneNotification(milestone: string, streakDays?: number): Promise<void> {
    const messages = {
      '7_day_streak': {
        title: 'You just hit a 7-day streak! Your aura is off the charts! ✨',
        body: 'Amazing work! Keep the momentum going!',
      },
      'aura_milestone': {
        title: 'Aura Milestone Reached! 🌟',
        body: 'Your aura is glowing brighter than ever!',
      },
      'goal_achieved': {
        title: 'Goal Achieved! 🎉',
        body: 'You did it! Time to set new goals and keep growing!',
      },
    };

    const message = messages[milestone as keyof typeof messages] || {
      title: 'Milestone Reached! 🎊',
      body: 'Congratulations on your achievement!',
    };

    await this.sendImmediateNotification(message);
  }

  /**
   * Send Coach Glow motivational message
   */
  async sendCoachGlowMessage(message: string): Promise<void> {
    await this.sendImmediateNotification({
      title: 'Coach Glow says:',
      body: message,
      data: { type: 'coach_glow' },
    });
  }

  /**
   * Send missed activity reminder
   */
  async sendMissedActivityReminder(activityType: 'workout' | 'meal', preferredTime: string): Promise<void> {
    const currentHour = new Date().getHours();
    const [preferredHour] = preferredTime.split(':').map(Number);
    
    // Only send if it's past the preferred time
    if (currentHour >= preferredHour) {
      const messages = {
        workout: {
          title: 'Missed your workout? No worries! 💪',
          body: 'It\'s not too late to get moving and boost your aura!',
        },
        meal: {
          title: 'Forgot to log your meal? 🍽️',
          body: 'Don\'t let your streak break - log it now!',
        },
      };

      await this.sendImmediateNotification(messages[activityType]);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationIds = [];
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    // In Expo Go, we'll always return true but with limited functionality
    if (this.isExpoGo) {
      return true;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if running in Expo Go
   */
  isRunningInExpoGo(): boolean {
    return this.isExpoGo;
  }

  /**
   * Format time for display (12-hour format)
   */
  formatTimeForDisplay(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Parse time from display format to 24-hour format
   */
  parseTimeFromDisplay(time12: string): string {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
