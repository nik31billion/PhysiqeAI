# 🧪 Sentry Testing Guide

## 📋 Prerequisites

Before testing, you need to set up your Sentry project and get your DSN.

### Step 1: Create Sentry Account & Project

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (or log in if you have one)
3. Create a new project:
   - Click **"Create Project"**
   - Select **"React Native"** as the platform
   - Give it a name: `PhysiqeAI` (or whatever you prefer)
   - Click **"Create Project"**

### Step 2: Get Your DSN

1. After creating the project, you'll see a page with setup instructions
2. Look for **"DSN"** (Data Source Name) - it looks like:
   ```
   https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. Copy this DSN

### Step 3: Configure DSN in Your App

You have two options:

#### Option A: Environment Variable (Recommended)
1. Create a `.env` file in `PhysiqeAI/` directory (if you don't have one)
2. Add:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. Replace with your actual DSN

#### Option B: Direct in Code
1. Open `PhysiqeAI/utils/sentryConfig.ts`
2. Find line with `const SENTRY_DSN = ...`
3. Replace `'YOUR_SENTRY_DSN'` with your actual DSN:
   ```typescript
   const SENTRY_DSN = 'https://xxxxx@xxxxx.ingest.sentry.io/xxxxx';
   ```

---

## 🧪 Testing Methods

### Method 1: Test Error Boundary (Easiest)

This tests if Sentry is capturing React component errors.

1. **Temporarily break a component** to trigger ErrorBoundary:
   - Open any screen file (e.g., `screens/HomeScreen.tsx`)
   - Add this at the top of the component:
   ```typescript
   // TEST CODE - REMOVE AFTER TESTING
   throw new Error('Sentry Test Error - ErrorBoundary');
   ```

2. **Run the app:**
   ```bash
   npm start
   ```

3. **Navigate to that screen** - it should crash and show the error boundary

4. **Check Sentry:**
   - Go to [Sentry Dashboard](https://sentry.io)
   - Click on your project
   - Go to **"Issues"** tab
   - You should see the error appear within 1-2 minutes
   - Click on it to see full details

5. **Remove the test code** after confirming it works

---

### Method 2: Test API Error Tracking

This tests if Sentry captures API call errors.

#### Test Food Scanner Error:

1. **Temporarily break the food scanner:**
   - Open `utils/geminiVisionService.ts`
   - Find the `analyzeFood` function
   - Add this at the start of the try block:
   ```typescript
   // TEST CODE - REMOVE AFTER TESTING
   if (scanMode === 'food') {
     throw new Error('Sentry Test - Food Scanner API Error');
   }
   ```

2. **Run the app and scan food:**
   - Open the food scanner
   - Take a photo or select an image
   - The error should be caught and sent to Sentry

3. **Check Sentry dashboard** - you should see the error with context:
   - Operation: `analyzeFood`
   - Scan mode: `food`
   - User ID
   - Duration

4. **Remove the test code**

#### Test Plan Generation Error:

1. **Temporarily break plan generation:**
   - Open `utils/planService.ts`
   - Find `generatePlanViaEdgeFunction`
   - Add this at the start:
   ```typescript
   // TEST CODE - REMOVE AFTER TESTING
   throw new Error('Sentry Test - Plan Generation Error');
   ```

2. **Try to generate a plan** in the app

3. **Check Sentry** - should see error with plan generation context

4. **Remove the test code**

#### Test Coach Glow Error:

1. **Temporarily break Coach Glow:**
   - Open `utils/coachGlowService.ts`
   - Find `sendMessageToCoachGlow`
   - Add this at the start:
   ```typescript
   // TEST CODE - REMOVE AFTER TESTING
   throw new Error('Sentry Test - Coach Glow Error');
   ```

2. **Send a message** in Coach Glow chat

3. **Check Sentry** - should see error with chat context

4. **Remove the test code**

---

### Method 3: Test Global Error Handler

This tests unhandled JavaScript errors.

1. **Add test code to App.tsx:**
   - Open `App.tsx`
   - Add this in the `App` function (before return):
   ```typescript
   // TEST CODE - REMOVE AFTER TESTING
   setTimeout(() => {
     throw new Error('Sentry Test - Global Error Handler');
   }, 5000);
   ```

2. **Run the app** - after 5 seconds, it should throw an error

3. **Check Sentry** - should see the error

4. **Remove the test code**

---

### Method 4: Test Unhandled Promise Rejection

1. **Add test code anywhere:**
   ```typescript
   // TEST CODE - REMOVE AFTER TESTING
   Promise.reject(new Error('Sentry Test - Unhandled Promise Rejection'));
   ```

2. **Run the app** - error should be caught

3. **Check Sentry** - should see the error

4. **Remove the test code**

---

## ✅ What to Look For in Sentry

When you check the Sentry dashboard, you should see:

### 1. Error Details
- **Error message** - The error you threw
- **Stack trace** - Where the error occurred
- **Timestamp** - When it happened

### 2. Context Information
- **User ID** (if user is logged in)
- **Device info** - OS, device model, app version
- **Breadcrumbs** - Actions leading up to the error

### 3. Performance Data
- **Duration** - How long the operation took
- **Transaction** - The operation that failed

### 4. Tags
- **scanMode** (for food scanner)
- **intent** (for Coach Glow)
- **operation** type

---

## 🚨 Testing Real-World Scenarios

### Test Network Error (Food Scanner)

1. **Turn on airplane mode** on your device
2. **Try to scan food** - should fail with network error
3. **Check Sentry** - should see Supabase connection error

### Test Authentication Error

1. **Sign out** of the app
2. **Try to generate a plan** - should fail with auth error
3. **Check Sentry** - should see "User not authenticated" error

### Test Invalid Response

1. **Temporarily modify** `geminiVisionService.ts`:
   ```typescript
   // In analyzeFood, after getting data
   if (data && data.success) {
     data.foodItems = null; // Force invalid response
   }
   ```

2. **Scan food** - should fail with "Invalid response format"

3. **Check Sentry** - should see error with response format context

---

## 🔍 Debugging Tips

### If Errors Don't Appear in Sentry:

1. **Check DSN is set:**
   - Look at console logs when app starts
   - Should see: `✅ Sentry initialized successfully`
   - If you see: `⚠️ Sentry not initialized - DSN not configured`
   - Then DSN is not set correctly

2. **Check development mode:**
   - In `sentryConfig.ts`, we filter out errors in `__DEV__` mode
   - To test in dev, temporarily change:
   ```typescript
   // In beforeSend function
   if (__DEV__) {
     return event; // Send errors in dev too
   }
   ```

3. **Check network:**
   - Sentry needs internet to send errors
   - Make sure device has internet connection

4. **Wait a bit:**
   - Sentry batches errors and sends them periodically
   - Wait 1-2 minutes after triggering error

### If App Crashes:

1. **Check console logs** - should see error details
2. **Check Sentry dashboard** - error should appear there
3. **Remove test code** - app should work normally again

---

## 📊 Expected Results

After testing, you should see in Sentry:

1. **Multiple error types:**
   - ErrorBoundary errors
   - API errors (Food Scanner, Plan Generation, Coach Glow)
   - Global JavaScript errors
   - Unhandled promise rejections

2. **Rich context for each error:**
   - User information
   - Device information
   - Breadcrumbs (user actions)
   - Performance data
   - Custom tags

3. **No duplicate errors:**
   - Same error should be grouped together
   - You'll see "affected users" count

---

## 🎯 Quick Test Checklist

- [ ] Sentry DSN configured
- [ ] App starts without errors
- [ ] ErrorBoundary test works
- [ ] Food Scanner error tracking works
- [ ] Plan Generation error tracking works
- [ ] Coach Glow error tracking works
- [ ] Global error handler works
- [ ] Errors appear in Sentry dashboard
- [ ] Error context is correct
- [ ] Performance data is captured
- [ ] All test code removed

---

## 🚀 Next Steps After Testing

Once you confirm Sentry is working:

1. **Remove all test code**
2. **Deploy to production** (or test build)
3. **Monitor Sentry dashboard** for real errors
4. **Set up alerts** (optional):
   - Go to Sentry → Settings → Alerts
   - Create alert for new errors
   - Get email/Slack notifications

---

## 💡 Pro Tips

1. **Use Sentry's Release Tracking:**
   - Tag errors with app version
   - See which version introduced bugs

2. **Set up User Context:**
   - We'll add this in Phase 7
   - See which users are affected

3. **Use Breadcrumbs:**
   - We'll add navigation breadcrumbs in Phase 7
   - See user actions before errors

4. **Performance Monitoring:**
   - We'll add this in Phase 6
   - Track slow operations

---

**Ready to test? Start with Method 1 (ErrorBoundary test) - it's the easiest!** 🚀

