# Aura System Implementation

## Overview

The Aura system is a comprehensive gamification feature that transforms Flex Aura into an engaging, shareable fitness experience. Users earn Aura points for various activities, unlock achievements, and can share their progress on social media.

## 🎯 Core Features

### 1. Aura Point System
- **Daily Workout**: +10 Aura
- **Meal Completion**: +3 Aura per meal
- **All Meals Bonus**: +10 Aura when all meals completed
- **7-Day Streak**: +30 Aura bonus
- **New Best Streak**: +20 Aura
- **Daily Check-in**: +1 Aura
- **Progress Photo**: +8 Aura
- **Measurement Update**: +4 Aura
- **Coach Glo Chat**: +3 Aura (max 1/day)
- **Plan Tweak**: +5 Aura (max 1/week)
- **Glow Card Share**: +20 Aura (max 1/day)
- **Friend Referral**: +50 Aura

### 2. Achievement System
- **Streak Achievements**: 3-day, 7-day, 14-day, 30-day streaks
- **Milestone Achievements**: First week, first month, goal weight
- **Social Achievements**: First share, social butterfly, referral master
- **Progress Achievements**: Progress photo, measurement update, Coach Glo fan

### 3. Dynamic Avatar System
- Mascot changes based on Aura level and streak
- Glowing effects and animations
- Streak indicators and visual feedback

### 4. Social Sharing
- Glow Cards with user's Aura, streak, and achievements
- Social media integration
- Viral loop mechanics

## 🏗️ Architecture

### Database Schema
```sql
-- Core tables
aura_events          -- All Aura earning/losing events
user_aura_summary    -- Current totals and streaks
achievements         -- Achievement definitions
user_achievements    -- User's unlocked achievements
user_weight_tracking -- Weight progress tracking
```

### Key Services
- **auraService.ts**: Core Aura logic and database operations
- **dailyAuraService.ts**: Daily events and maintenance
- **sharingService.ts**: Social media sharing functionality
- **useAura.ts**: React hook for Aura data management
- **useDailyAura.ts**: React hook for daily Aura events

### Components
- **AuraMeter**: Animated Aura display with progress ring
- **StreakTracker**: Visual streak tracking with dots and stats
- **AchievementCard**: Individual achievement display
- **GlowCard**: Shareable progress card
- **AuraEarningAnimation**: Celebration animations
- **DynamicMascot**: Avatar that changes based on progress

## 🚀 Implementation Status

### ✅ Completed
- [x] Database schema design and migration
- [x] Core Aura service with all earning events
- [x] Achievement system with automatic unlocking
- [x] Streak tracking and calculations
- [x] Social sharing functionality
- [x] ProgressScreen redesign with Aura focus
- [x] Animated components and visual feedback
- [x] Dynamic mascot system
- [x] Integration with existing completion services

### 🔄 In Progress
- [ ] Weight tracking integration
- [ ] Coach Glo integration for Aura events
- [ ] Plan generation integration
- [ ] Onboarding integration

### 📋 Pending
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Analytics integration
- [ ] Push notifications for achievements
- [ ] Leaderboard system (future)

## 🎮 Usage Examples

### Earning Aura Points
```typescript
import { useAura } from '../utils/useAura';

const { addAuraPoints } = useAura(userId);

// Add aura points for an event
await addAuraPoints('daily_workout', 10, 'Completed daily workout');
```

### Sharing Glow Card
```typescript
import { useAura } from '../utils/useAura';

const { shareGlowCard } = useAura(userId);

// Share and earn aura
const result = await shareGlowCard();
if (result.success && result.auraEarned) {
  // Show celebration animation
}
```

### Using Dynamic Mascot
```typescript
import { DynamicMascot } from '../components';

<DynamicMascot
  totalAura={totalAura}
  currentStreak={currentStreak}
  size="medium"
  showGlow={true}
  animated={true}
/>
```

## 🎨 Visual Design

### Aura Levels
- **Starting** (0-19): Purple (#DDA0DD) - Cloudy mood
- **Beginner** (20-49): Yellow (#FFEAA7) - Normal mood
- **Beginner+** (50-99): Green (#96CEB4) - Positive mood
- **Intermediate** (100-199): Blue (#45B7D1) - Confident mood
- **Advanced** (200-499): Teal (#4ECDC4) - Motivated mood
- **Elite** (500-999): Red (#FF6B6B) - Excited mood
- **Legendary** (1000+): Gold (#FFD700) - Glowing mood

### Animations
- Glow effects for high Aura levels
- Pulse animations for streaks
- Bounce effects for achievements
- Sparkle animations for Aura earning

## 🔧 Configuration

### Daily Limits
```typescript
export const DAILY_LIMITS = {
  COACH_GLO_CHAT: 1,
  PLAN_TWEAK_REQUEST: 1, // per week
  GLOW_CARD_SHARE: 1,
  PROGRESS_SHARE: 1,
  MAX_DAILY_PENALTY: -10,
};
```

### Aura Points
```typescript
export const AURA_POINTS = {
  DAILY_WORKOUT: 10,
  MEAL_COMPLETION: 3,
  ALL_MEALS_BONUS: 10,
  SEVEN_DAY_STREAK_BONUS: 30,
  NEW_BEST_STREAK: 20,
  // ... more values
};
```

## 📱 Integration Points

### ProgressScreen
- Aura meter as main display
- Streak tracker with visual dots
- Achievement cards
- Share buttons with Aura rewards

### Completion Services
- Automatic Aura earning for workouts/meals
- Streak updates
- Achievement checking

### Coach Glo
- Aura rewards for interactions
- Motivational messages based on Aura level

## 🎯 Future Enhancements

### Phase 2 Features
- Weight tracking with Aura rewards
- Body measurement updates
- Progress photo uploads
- Social leaderboards
- Team challenges

### Phase 3 Features
- Aura marketplace (rewards/prizes)
- Seasonal events
- Custom achievement creation
- Advanced analytics
- Integration with wearables

## 🐛 Known Issues

- Some mascot images may not exist (fallback to default)
- Animation performance on older devices
- Sharing may not work on all platforms

## 📊 Analytics

The system tracks:
- Aura earning patterns
- Achievement unlock rates
- Sharing engagement
- Streak maintenance
- User progression through levels

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User can only access their own data
- Daily limits prevent abuse
- Input validation on all Aura events

## 🚀 Deployment

1. Run the database migration: `migration_add_aura_system.sql`
2. Deploy the updated services and components
3. Test Aura earning and sharing functionality
4. Monitor performance and user engagement

## 📞 Support

For issues or questions about the Aura system:
- Check the console logs for Aura-related errors
- Verify database permissions and RLS policies
- Test with a fresh user account
- Check network connectivity for sharing features
