# 🔥 Firebase Analytics Setup Guide

## ✅ What's Already Done

We've successfully integrated Firebase Analytics into your app! Here's what's been set up:

### 📦 Installed Packages
- ✅ `@react-native-firebase/app` - Firebase core
- ✅ `@react-native-firebase/analytics` - Analytics module

### 🏗️ Code Integration
- ✅ `utils/firebaseConfig.ts` - Firebase initialization
- ✅ `utils/analyticsService.ts` - Analytics helper functions
- ✅ `utils/AnalyticsContext.tsx` - Analytics provider
- ✅ `App.tsx` - AnalyticsProvider integrated
- ✅ `navigation/AppNavigator.tsx` - Automatic screen view tracking
- ✅ `utils/useOnboardingNavigation.ts` - Onboarding event tracking

### 📊 What's Being Tracked Automatically
- ✅ **Screen views** - Every screen user visits
- ✅ **Onboarding steps** - Each step completion
- ✅ **Onboarding completion** - When user finishes onboarding
- ✅ **Payment screen skip** - Tracking that Screen 21 is skipped
- ✅ **App opens** - When app comes to foreground

---

## 🚀 Next Steps - YOU NEED TO DO THIS

### Step 1: Add Firebase Config Files

You need to add Firebase configuration files to your project:

#### For Android:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your existing project (the one hosting your landing page)
3. Click the **gear icon** → **Project Settings**
4. Scroll down to "Your apps" section
5. If you don't have an Android app registered:
   - Click **"Add app"** → Select **Android** icon
   - Enter package name: `com.physiqueai.app` (or your actual package name from `app.json`)
   - Register the app
6. **Download `google-services.json`**
7. Place it here: `PhysiqeAI/android/app/google-services.json`

#### For iOS:

1. In the same Firebase Console → Project Settings
2. If you don't have an iOS app registered:
   - Click **"Add app"** → Select **iOS** icon
   - Enter bundle ID from your `app.json`
   - Register the app
3. **Download `GoogleService-Info.plist`**
4. Place it here: `PhysiqeAI/ios/GoogleService-Info.plist`

### Step 2: Update app.json (If needed)

If you're using Expo managed workflow, add this to `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/analytics"
    ]
  }
}
```

### Step 3: Rebuild the App

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios

# Or rebuild with EAS Build
eas build --platform android
eas build --platform ios
```

**⚠️ Important:** You MUST rebuild the app after adding Firebase config files. Hot reload won't work!

---

## 📊 How to View Analytics Data

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Analytics** in the left sidebar
4. You'll see several dashboards:

#### Dashboard
- Real-time active users
- Users by country
- App versions
- Most viewed screens

#### Events
- See all tracked events:
  - `screen_view` - Screen visits
  - `onboarding_step_completed` - Each onboarding step
  - `onboarding_completed` - Full onboarding completion
  - `payment_screen_skipped` - When users skip payment
  - `app_open` - App opens

#### Conversions
- Set up conversion events (e.g., onboarding completion)

#### Audiences
- Create user segments (e.g., "Completed Onboarding", "Skipped Payment")

#### Funnels
- Create custom funnels to see drop-off:
  1. Go to **Analytics** → **Analysis** → **Funnel analysis**
  2. Click **"New funnel"**
  3. Add steps:
     - Step 1: `screen_view` where `screen_name = OnboardingScreen1`
     - Step 2: `screen_view` where `screen_name = OnboardingScreen10`
     - Step 3: `screen_view` where `screen_name = OnboardingScreen20`
     - Step 4: `screen_view` where `screen_name = OnboardingScreen22`
     - Step 5: `screen_view` where `screen_name = Home`
  4. See exactly where users drop off!

---

## 📈 What You'll See in Analytics

### After 24-48 hours, you'll have data like:

```
Onboarding Funnel:
┌─────────────────────────┬─────────┬──────────┐
│ Screen                  │ Users   │ Drop-off │
├─────────────────────────┼─────────┼──────────┤
│ OnboardingScreen1       │ 1000    │ 0%       │
│ OnboardingScreen5       │ 850     │ 15%      │
│ OnboardingScreen10      │ 650     │ 35%      │
│ OnboardingScreen15      │ 550     │ 45%      │
│ OnboardingScreen20      │ 450     │ 55%      │
│ Payment Skip Event      │ 450     │ -        │
│ OnboardingScreen22      │ 420     │ 58%      │
│ HomeScreen              │ 420     │ 58%      │
└─────────────────────────┴─────────┴──────────┘

Key Insights:
✅ 42% completion rate (before: 27%)
✅ 55% improvement by removing payment!
✅ Biggest drop-off: Screens 1→10 (15%)
```

### Screen Views (Top 10)
```
1. OnboardingScreen1      - 1000 views
2. HomeScreen             - 420 views
3. OnboardingScreen10     - 650 views
4. PlanScreen             - 380 views
5. OnboardingScreen20     - 450 views
6. ProgressScreen         - 290 views
7. FoodScannerScreen      - 210 views
8. OnboardingScreen5      - 850 views
9. ProfileScreen          - 180 views
10. SettingsScreen        - 120 views
```

### Events
```
- onboarding_completed       : 420 times
- payment_screen_skipped     : 450 times
- app_open                   : 2,340 times
- onboarding_step_completed  : 8,500 times
```

---

## 🎯 Adding More Analytics (Optional)

### Track Feature Usage

The `analyticsService.ts` already has functions ready to use. Just import and call them:

#### Track Workout Logging

```typescript
// In your workout logging screen
import { logWorkoutLogged } from '../utils/analyticsService';

const handleWorkoutComplete = async () => {
  // ... your workout logging code ...
  
  await logWorkoutLogged('Push Day', 5, 45); // type, exercises, duration
};
```

#### Track Meal Logging

```typescript
// In your meal logging screen
import { logMealLogged, logMealCompleted } from '../utils/analyticsService';

const handleMealLog = async () => {
  await logMealLogged('breakfast', 450); // type, calories
};

const handleMealComplete = async () => {
  await logMealCompleted('breakfast');
};
```

#### Track Food Scanner

```typescript
// In FoodScannerScreen
import { logFoodScanned } from '../utils/analyticsService';

const handleScanComplete = async (success: boolean) => {
  await logFoodScanned('food', success); // 'food' | 'barcode' | 'label' | 'library'
};
```

#### Track Progress Photos

```typescript
// In progress photo upload
import { logProgressPhotoUploaded } from '../utils/analyticsService';

const handlePhotoUpload = async () => {
  // ... upload code ...
  await logProgressPhotoUploaded();
};
```

#### Track Coach Glow

```typescript
// In Coach Glow components
import { logCoachGlowInteraction } from '../utils/analyticsService';

// When user sends message
await logCoachGlowInteraction('message_sent');

// When user clicks motivation button
await logCoachGlowInteraction('motivation_clicked');

// When user requests plan swap
await logCoachGlowInteraction('plan_swap_clicked');
```

---

## 🔍 Debugging

### Check if Firebase is Working

The analytics service logs to console:

```
✅ Good signs:
🚀 Initializing Firebase Analytics...
✅ Firebase Analytics ready!
📊 [Analytics] Screen view: HomeScreen
📊 [Analytics] Onboarding step 1: OnboardingScreen1

❌ Problems:
⚠️ Firebase Analytics not initialized
⚠️ Make sure google-services.json is in place
📊 [Analytics - Not Ready] Screen view: HomeScreen
```

### Common Issues

#### 1. "Firebase Analytics not initialized"
**Solution:** Make sure you've added the config files and rebuilt the app.

#### 2. "No data in Firebase Console"
**Solution:** 
- Wait 24-48 hours for data to appear
- Make sure you're looking at the correct date range
- Check Debug View (see below)

#### 3. Events not showing up
**Solution:** Use Debug View to see real-time events

### Enable Debug View

To see events in real-time (during development):

#### Android:
```bash
adb shell setprop debug.firebase.analytics.app com.physiqueai.app
```

#### iOS:
1. In Xcode, edit your scheme
2. Add argument: `-FIRAnalyticsDebugEnabled`

Then go to Firebase Console → Analytics → DebugView to see events in real-time!

---

## 📱 Testing the Integration

1. **Run the app** (must rebuild after adding config files)
2. **Complete onboarding** (go through all screens)
3. **Check console logs** - Look for "📊 [Analytics]" messages
4. **Go to Firebase Console** → Analytics → DebugView
5. **You should see events appearing in real-time!**

---

## 🎉 What's Next?

### After Setup:

1. **Wait 24-48 hours** for real data to accumulate
2. **Set up custom dashboards** in Firebase Console
3. **Create funnels** to track onboarding, feature usage, etc.
4. **Set up audiences** for targeted messaging
5. **Use insights** to improve your app:
   - Where do users drop off?
   - Which features are most used?
   - When should you prompt for payment?

### Analytics-Driven Decisions:

- **If onboarding completion is still low:** Simplify more screens
- **If certain features aren't used:** Improve onboarding education
- **If retention is low:** Add push notifications / reminders
- **If engagement is high:** That's when you re-add payment!

---

## 🆘 Need Help?

### Resources:
- [Firebase Analytics Docs](https://rnfirebase.io/analytics/usage)
- [Event Parameters Reference](https://firebase.google.com/docs/reference/cpp/group/event-names)
- [Firebase Console](https://console.firebase.google.com)

### Contact Firebase Support:
- Go to Firebase Console
- Click the "?" icon → "Contact Support"

---

## 📋 Checklist

Use this to track your setup progress:

- [ ] Firebase packages installed (`npm install` completed)
- [ ] Downloaded `google-services.json` from Firebase Console
- [ ] Placed `google-services.json` in `PhysiqeAI/android/app/`
- [ ] Downloaded `GoogleService-Info.plist` from Firebase Console
- [ ] Placed `GoogleService-Info.plist` in `PhysiqeAI/ios/`
- [ ] Updated `app.json` with Firebase plugins (if using Expo)
- [ ] Rebuilt the app (`npx expo run:android` or `npx expo run:ios`)
- [ ] Tested analytics (checked console logs)
- [ ] Verified in Firebase Console → DebugView
- [ ] Waiting for real data (24-48 hours)

---

## 🎯 Quick Commands Reference

```bash
# Install packages (already done)
npm install @react-native-firebase/app @react-native-firebase/analytics

# Rebuild app (REQUIRED after adding config files)
npx expo run:android
npx expo run:ios

# Enable debug mode (Android)
adb shell setprop debug.firebase.analytics.app com.physiqueai.app

# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

**🎉 You're all set! Once you add the config files and rebuild, analytics will start flowing in!**

Need help? Check the Firebase Console or reach out to Firebase Support!

