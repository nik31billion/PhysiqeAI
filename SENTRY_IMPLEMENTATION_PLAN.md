# 🚨 Sentry Implementation Plan - Step by Step

## 📋 Overview

This plan adds Sentry error tracking to your app **without changing any logic or flows**. We'll add error tracking layer by layer, testing after each step.

---

## ✅ Phase 1: Install & Basic Setup (Foundation)

### Step 1.1: Install Sentry Package
- Install `@sentry/react-native` package
- No code changes yet - just installation

### Step 1.2: Create Sentry Configuration File
- Create `utils/sentryConfig.ts`
- Initialize Sentry with DSN (you'll get this from Sentry dashboard)
- Configure for React Native
- Set up environment detection (dev vs production)

### Step 1.3: Initialize in App.tsx
- Import Sentry config at the very top of App.tsx
- Initialize before any other code runs
- Test: App should work exactly as before

**Files to modify:**
- `package.json` (add dependency)
- `utils/sentryConfig.ts` (new file)
- `App.tsx` (add initialization)

---

## ✅ Phase 2: Core Error Tracking (App-Level)

### Step 2.1: Enhance ErrorBoundary
- Wrap existing ErrorBoundary errors with Sentry
- Add user context (user ID, email)
- Add device info automatically
- Test: ErrorBoundary should still work, but now errors go to Sentry

### Step 2.2: Global Error Handlers
- Catch unhandled promise rejections
- Catch JavaScript errors
- Catch native crashes
- Test: App should work normally, errors logged to Sentry

**Files to modify:**
- `App.tsx` (ErrorBoundary enhancement)

---

## ✅ Phase 3: API Error Tracking (Critical Paths)

### Step 3.1: Food Scanner (Gemini Vision API)
- Wrap `geminiVisionService.ts` errors
- Track: API failures, timeouts, parsing errors
- Add breadcrumbs: scan mode, image size, user ID
- Track performance: API call duration

### Step 3.2: Plan Generation (Gemini API)
- Wrap `planService.ts` errors
- Track: Generation failures, edge function errors
- Add breadcrumbs: user ID, plan type, regeneration flag
- Track performance: Generation duration

### Step 3.3: Coach Glow (Gemini API)
- Wrap `coachGlowService.ts` errors
- Track: Chat API failures, message sending errors
- Add breadcrumbs: user ID, message length, intent
- Track performance: Response time

**Files to modify:**
- `utils/geminiVisionService.ts`
- `utils/planService.ts`
- `utils/coachGlowService.ts`

---

## ✅ Phase 4: Supabase Error Tracking

### Step 4.1: Database Query Errors
- Wrap Supabase query errors in key services:
  - `instantDataManager.ts`
  - `auraService.ts`
  - `dailyFoodIntakeService.ts`
  - `profileService.ts`
- Track: Query failures, RLS errors, connection issues
- Add breadcrumbs: Table name, operation type, user ID

### Step 4.2: Authentication Errors
- Enhance `AuthContext.tsx` error tracking
- Track: Sign-in failures, sign-up errors, OAuth errors
- Add breadcrumbs: Auth method, email (masked), error type

### Step 4.3: Edge Function Errors
- Track edge function invocation errors
- Add breadcrumbs: Function name, request body (sanitized)

**Files to modify:**
- `utils/AuthContext.tsx`
- `utils/instantDataManager.ts`
- `utils/auraService.ts`
- `utils/dailyFoodIntakeService.ts`
- `utils/profileService.ts`

---

## ✅ Phase 5: UI Error Tracking (Screen-Level)

### Step 5.1: Food Scanner Screen
- Wrap `FoodScannerScreen.tsx` errors
- Track: Image capture errors, analysis failures
- Add breadcrumbs: Screen state, scan mode

### Step 5.2: Onboarding Screens
- Wrap onboarding screen errors
- Track: Form validation errors, navigation errors
- Add breadcrumbs: Screen number, step name

### Step 5.3: Plan Screen
- Wrap `PlanScreen.tsx` errors
- Track: Plan loading errors, display errors
- Add breadcrumbs: User ID, plan status

**Files to modify:**
- `screens/FoodScannerScreen.tsx`
- `screens/OnboardingScreen*.tsx` (key screens)
- `screens/PlanScreen.tsx`

---

## ✅ Phase 6: Performance Monitoring

### Step 6.1: API Performance
- Track slow API calls (>5 seconds)
- Track: Gemini API response times
- Track: Supabase query times
- Alert on performance degradation

### Step 6.2: Screen Performance
- Track slow screen renders
- Track: Navigation delays
- Track: Data loading times

**Files to modify:**
- Add performance tracking to existing API calls
- Add to navigation tracking

---

## ✅ Phase 7: User Context & Breadcrumbs

### Step 7.1: Set User Context
- Set user ID, email, subscription status
- Update on login/logout
- Mask sensitive data

### Step 7.2: Add Breadcrumbs
- Navigation events
- API calls
- User actions (button clicks, form submissions)

**Files to modify:**
- `utils/AuthContext.tsx` (set user context)
- `navigation/AppNavigator.tsx` (navigation breadcrumbs)

---

## ✅ Phase 8: Testing & Validation

### Step 8.1: Test Error Scenarios
- Test: Network errors (airplane mode)
- Test: API failures (invalid requests)
- Test: Database errors (invalid queries)
- Verify: All errors appear in Sentry dashboard

### Step 8.2: Verify No Breaking Changes
- Test: All existing flows work
- Test: No UI changes
- Test: No performance degradation
- Verify: App works exactly as before

---

## 📊 Error Tracking Coverage

### ✅ What Will Be Tracked:

1. **Gemini API Errors:**
   - Food analysis failures
   - Plan generation failures
   - Coach Glow chat failures
   - API timeouts
   - Rate limit errors
   - Invalid responses

2. **Supabase Errors:**
   - Database query failures
   - Authentication errors
   - Edge function errors
   - RLS policy violations
   - Connection timeouts

3. **UI Errors:**
   - Screen crashes
   - Navigation errors
   - Form validation errors
   - Image capture errors

4. **Performance Issues:**
   - Slow API calls (>5s)
   - Slow screen renders
   - Memory leaks
   - Network timeouts

5. **User Context:**
   - User ID
   - Email (masked)
   - Subscription status
   - Device info
   - App version

---

## 🎯 Success Criteria

- ✅ All errors are captured in Sentry
- ✅ No breaking changes to app functionality
- ✅ No UI changes
- ✅ No performance degradation
- ✅ User context is set correctly
- ✅ Breadcrumbs provide useful debugging info
- ✅ Performance monitoring tracks slow operations

---

## 🚀 Implementation Order

We'll implement in this order to minimize risk:

1. **Phase 1** - Foundation (install & config)
2. **Phase 2** - Core (ErrorBoundary, global handlers)
3. **Phase 3** - API errors (most critical)
4. **Phase 4** - Database errors
5. **Phase 5** - UI errors
6. **Phase 6** - Performance
7. **Phase 7** - Context & breadcrumbs
8. **Phase 8** - Testing

---

## ⚠️ Important Notes

- **No Logic Changes:** We're only adding error tracking, not changing any business logic
- **Non-Breaking:** All changes are additive - existing code continues to work
- **Graceful Degradation:** If Sentry fails, app continues to work normally
- **Privacy:** Sensitive data (passwords, tokens) will be masked
- **Performance:** Sentry calls are async and won't block the UI

---

**Ready to start? Let's begin with Phase 1!** 🚀

