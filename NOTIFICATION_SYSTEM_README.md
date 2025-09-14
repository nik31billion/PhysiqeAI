# Flex Aura Notification System

A comprehensive local notification system for Flex Aura that provides workout reminders, meal plan notifications, streak encouragement, and milestone celebrations.

## Features

### 🎯 Core Notifications
- **Workout Reminders**: Daily reminders at user's preferred workout time
- **Meal Reminders**: Daily reminders at user's preferred meal time  
- **Streak Reminders**: Daily reminders to maintain consistency
- **Missed Activity Alerts**: Notifications when users miss their scheduled activities

### 🎉 Celebration Notifications
- **Milestone Celebrations**: In-app modals for 7-day streaks, aura milestones, and goal achievements
- **Coach Glow Messages**: Motivational messages when aura drops or streaks break
- **Progress Toasts**: Real-time feedback for completed activities

### ⚙️ User Controls
- **Customizable Times**: Users can set their preferred notification times
- **Granular Controls**: Toggle individual notification types on/off
- **Settings Management**: Easy access through ProfileScreen notification button

## Architecture

### Core Components

#### 1. NotificationService (`utils/notificationService.ts`)
- Singleton service managing all local notifications
- Handles permission requests and notification scheduling
- Manages user preferences storage
- Provides notification message templates

#### 2. NotificationContext (`utils/NotificationContext.tsx`)
- React context for global notification state management
- Handles preference loading and saving
- Provides notification control methods

#### 3. NotificationManager (`components/NotificationManager.tsx`)
- Global component managing toast and modal displays
- Handles notification state updates
- Provides global notification trigger functions

### UI Components

#### 1. NotificationSettingsModal (`components/NotificationSettingsModal.tsx`)
- Full-featured settings interface
- Time picker for customizing notification times
- Toggle switches for individual notification types
- Beautiful gradient design matching app theme

#### 2. NotificationToast (`components/NotificationToast.tsx`)
- Animated toast notifications
- Multiple types: success, info, warning, celebration
- Auto-dismiss with customizable duration
- Smooth slide-in/out animations

#### 3. MilestoneCelebrationModal (`components/MilestoneCelebrationModal.tsx`)
- Full-screen celebration modals
- Confetti animations and mascot integration
- Milestone-specific messaging and styling
- Interactive continue buttons

### Integration Hooks

#### 1. useNotificationTriggers (`utils/useNotificationTriggers.ts`)
- Monitors aura levels, streaks, and activity completion
- Triggers appropriate notifications based on user behavior
- Handles missed activity detection
- Provides Coach Glow motivational messages

## Usage

### Basic Setup

The notification system is automatically initialized when the app starts:

```tsx
// App.tsx
<NotificationProvider>
  <NotificationManager>
    <AppNavigator />
  </NotificationManager>
</NotificationProvider>
```

### Triggering Notifications

#### Programmatic Notifications
```tsx
import { showToast, showMilestone } from '../components/NotificationManager';

// Show a toast notification
showToast('Success!', 'Workout completed!', 'success');

// Show a milestone celebration
showMilestone('7_day_streak', 7);
```

#### Using the Hook
```tsx
import { useNotificationTriggers } from '../utils/useNotificationTriggers';

const MyComponent = () => {
  useNotificationTriggers({
    currentAura: 75,
    streakDays: 5,
    hasLoggedWorkoutToday: true,
    hasLoggedMealToday: false,
    preferredWorkoutTime: '08:00',
    preferredMealTime: '12:00',
  });
  
  // Component logic...
};
```

### Accessing Settings

Users can access notification settings through the ProfileScreen:

```tsx
// ProfileScreen.tsx - notification button in header
<TouchableOpacity 
  style={styles.notificationButton}
  onPress={() => setNotificationSettingsVisible(true)}
>
  <Ionicons name="notifications-outline" size={24} color="#a2b2b7" />
</TouchableOpacity>
```

## Configuration

### Default Settings

```typescript
const defaultPreferences = {
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
```

### Notification Messages

#### Workout Reminders
- **Morning**: "Ready to crush your workout and boost your aura? Let's go! 💪"
- **Afternoon**: "Time to flex your aura and get those gains!"
- **Evening**: "Don't let the day end without boosting your aura!"

#### Meal Reminders  
- **Lunch**: "Don't forget to check your meal plan and log your food for max aura! 🍽️"
- **Dinner**: "Fuel your body right and keep that aura glowing!"

#### Streak Reminders
- **Daily**: "Streak at risk! Log today's workout or meal to keep your aura glowing."
- **Motivation**: "Don't let your streak break! Your aura depends on it! ✨"

#### Milestone Celebrations
- **7-Day Streak**: "You just hit a 7-day streak! Your aura is off the charts! ✨"
- **Aura Milestone**: "Aura Milestone! Your aura is glowing brighter than ever!"
- **Goal Achieved**: "Goal Achieved! Time to set new goals and keep growing!"

## Technical Details

### Dependencies
- `expo-notifications`: Local notification management
- `@react-native-async-storage/async-storage`: Preference storage
- `react-native-reanimated`: Smooth animations

### Permissions
The system automatically requests notification permissions on first use. Users can manage permissions through their device settings.

### Storage
User preferences are stored locally using AsyncStorage with the key format:
```
notification_preferences_{userId}
```

### Scheduling
- Notifications are scheduled as daily recurring events
- Missed activity checks run 1 hour after preferred times
- All notifications respect user's timezone

### Performance
- Minimal battery impact with efficient scheduling
- Automatic cleanup of old notifications
- Optimized re-renders with React context

## Future Enhancements

### Planned Features
- [ ] Push notification support for background updates
- [ ] Smart notification timing based on user behavior
- [ ] Custom notification sounds and vibrations
- [ ] Notification analytics and insights
- [ ] Integration with Apple Health and Google Fit
- [ ] Social sharing of milestones

### Advanced Features
- [ ] AI-powered notification optimization
- [ ] Weather-based workout suggestions
- [ ] Location-based meal recommendations
- [ ] Integration with calendar apps
- [ ] Voice-activated notification controls

## Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. Check device notification permissions
2. Verify notification settings are enabled
3. Ensure app is not in battery optimization mode

#### Incorrect Timing
1. Verify device timezone settings
2. Check notification time preferences
3. Restart the app to refresh scheduling

#### Performance Issues
1. Clear notification cache
2. Restart notification service
3. Check for conflicting notification apps

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Notification Debug:', true);
```

## Support

For issues or feature requests related to the notification system, please refer to the main Flex Aura documentation or contact the development team.

---

*Built with ❤️ for Flex Aura users who want to stay motivated and consistent on their fitness journey.*
