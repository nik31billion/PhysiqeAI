# 🧪 Phase 8: Sentry Testing Checklist

## Overview
This checklist ensures all Sentry error tracking and performance monitoring is working correctly without breaking any existing functionality.

---

## ✅ Pre-Testing Setup

### 1. Environment Configuration
- [ ] `EXPO_PUBLIC_SENTRY_DSN` is set in `.env` file
- [ ] Sentry project is created at https://sentry.io
- [ ] DSN is correctly configured
- [ ] App builds without errors

### 2. Development Mode Check
- [ ] Verify errors are logged to console in `__DEV__` mode
- [ ] Verify errors are NOT sent to Sentry in `__DEV__` mode
- [ ] Verify breadcrumbs are disabled in `__DEV__` mode

---

## 🔍 Error Tracking Tests

### Test 1: Global Error Handling
**Test:** Trigger an uncaught error
- [ ] Add a test button that throws an error
- [ ] Click the button
- [ ] Verify error is caught by global handler
- [ ] Check console for error log
- [ ] Verify ErrorBoundary catches React errors

**Expected Result:** Error is logged, app doesn't crash

---

### Test 2: Food Scanner Error Tracking
**Test:** Food analysis with invalid image
- [ ] Open food scanner
- [ ] Try to analyze an invalid/corrupted image
- [ ] Verify error is captured in Sentry
- [ ] Check error context includes:
  - [ ] scanMode
  - [ ] userId
  - [ ] error message

**Expected Result:** Error appears in Sentry with full context

---

### Test 3: Plan Generation Error Tracking
**Test:** Plan generation with network error
- [ ] Enable airplane mode
- [ ] Try to generate a plan
- [ ] Verify error is captured
- [ ] Check error context includes:
  - [ ] userId
  - [ ] planType
  - [ ] error code

**Expected Result:** Network error tracked with context

---

### Test 4: Coach Glow Error Tracking
**Test:** Coach Glow with invalid message
- [ ] Open Coach Glow
- [ ] Send an empty or invalid message
- [ ] Verify error is captured
- [ ] Check error context includes:
  - [ ] userId
  - [ ] message length
  - [ ] error type

**Expected Result:** Error tracked with message context

---

### Test 5: Authentication Error Tracking
**Test:** Sign in with wrong password
- [ ] Go to login screen
- [ ] Enter wrong password
- [ ] Verify error is captured
- [ ] Check error context includes:
  - [ ] operation type
  - [ ] error code
  - [ ] error message

**Test:** Google Sign-In cancellation
- [ ] Start Google sign-in
- [ ] Cancel the flow
- [ ] Verify cancellation is NOT tracked as error
- [ ] Verify actual errors are tracked

**Expected Result:** Authentication errors tracked, cancellations ignored

---

### Test 6: Database Query Error Tracking
**Test:** Database query with invalid data
- [ ] Try to fetch profile with invalid user ID
- [ ] Verify error is captured
- [ ] Check error context includes:
  - [ ] operation type
  - [ ] userId
  - [ ] error code

**Expected Result:** Database errors tracked with query context

---

### Test 7: UI Error Tracking
**Test:** Navigation error
- [ ] Try to navigate to non-existent screen
- [ ] Verify error is captured
- [ ] Check breadcrumbs show navigation path

**Test:** Form validation error
- [ ] Submit onboarding form with invalid data
- [ ] Verify validation errors are tracked
- [ ] Check breadcrumbs show form state

**Expected Result:** UI errors tracked with navigation context

---

## ⚡ Performance Monitoring Tests

### Test 8: Performance Transaction Tracking
**Test:** Monitor API call performance
- [ ] Generate a plan (should take 20-30 seconds)
- [ ] Check console for performance logs
- [ ] Verify transaction includes:
  - [ ] Duration in milliseconds
  - [ ] Success/error status
  - [ ] Nested spans (API call, image conversion, etc.)

**Expected Result:** Performance data logged with breakdown

---

### Test 9: Slow Operation Detection
**Test:** Trigger slow operation
- [ ] Simulate slow API call (>5s)
- [ ] Verify warning is logged
- [ ] Check Sentry for performance alert

**Expected Result:** Slow operations detected and reported

---

## 👤 User Context Tests

### Test 10: User Context on Login
**Test:** Sign in and verify context
- [ ] Sign in with email/password
- [ ] Check Sentry dashboard
- [ ] Verify user context includes:
  - [ ] User ID
  - [ ] Email (masked)
  - [ ] Subscription status

**Test:** Google Sign-In context
- [ ] Sign in with Google
- [ ] Verify user context is set
- [ ] Check context is correct

**Test:** Apple Sign-In context
- [ ] Sign in with Apple
- [ ] Verify user context is set
- [ ] Check context is correct

**Expected Result:** User context set on all login methods

---

### Test 11: User Context on Logout
**Test:** Sign out and verify context cleared
- [ ] Sign in
- [ ] Verify user context is set
- [ ] Sign out
- [ ] Verify user context is cleared
- [ ] Check Sentry dashboard shows no user

**Expected Result:** User context cleared on logout

---

## 🧭 Navigation Breadcrumbs Tests

### Test 12: Screen Transition Tracking
**Test:** Navigate between screens
- [ ] Navigate: Home → Plan → Progress → Profile
- [ ] Check Sentry breadcrumbs
- [ ] Verify each transition is tracked
- [ ] Check breadcrumbs include:
  - [ ] Previous screen name
  - [ ] Current screen name
  - [ ] Navigation category

**Expected Result:** All screen transitions tracked

---

### Test 13: Onboarding Navigation
**Test:** Complete onboarding flow
- [ ] Start onboarding
- [ ] Navigate through steps
- [ ] Check breadcrumbs show:
  - [ ] Each onboarding step
  - [ ] Navigation between steps
  - [ ] Completion status

**Expected Result:** Onboarding navigation fully tracked

---

## 🔒 Privacy & Security Tests

### Test 14: Data Privacy
**Test:** Verify sensitive data is masked
- [ ] Check Sentry dashboard
- [ ] Verify emails are masked/truncated
- [ ] Verify passwords are never sent
- [ ] Verify tokens are not included

**Expected Result:** No sensitive data in Sentry

---

### Test 15: Development Mode Privacy
**Test:** Verify dev mode behavior
- [ ] Run app in development mode
- [ ] Trigger errors
- [ ] Verify errors are logged to console
- [ ] Verify errors are NOT sent to Sentry
- [ ] Check Sentry dashboard shows no dev errors

**Expected Result:** Dev errors not sent to Sentry

---

## 🚫 Breaking Changes Tests

### Test 16: App Functionality
**Test:** Verify app works normally
- [ ] All screens load correctly
- [ ] Navigation works as expected
- [ ] Food scanner works
- [ ] Plan generation works
- [ ] Coach Glow works
- [ ] Authentication works
- [ ] Onboarding works

**Expected Result:** No functionality broken

---

### Test 17: Performance Impact
**Test:** Verify Sentry doesn't slow down app
- [ ] Measure app startup time
- [ ] Measure screen load times
- [ ] Measure API call times
- [ ] Compare with baseline (if available)

**Expected Result:** No significant performance impact

---

### Test 18: Error Handling
**Test:** Verify error handling works
- [ ] Trigger various errors
- [ ] Verify app doesn't crash
- [ ] Verify user sees appropriate error messages
- [ ] Verify errors are handled gracefully

**Expected Result:** Errors handled gracefully, app stable

---

## 📊 Sentry Dashboard Verification

### Test 19: Dashboard Data
**Test:** Verify data appears in Sentry
- [ ] Open Sentry dashboard
- [ ] Check Issues tab for errors
- [ ] Check Performance tab for transactions
- [ ] Check User Feedback (if enabled)
- [ ] Verify error context is complete
- [ ] Verify breadcrumbs are present
- [ ] Verify user context is set

**Expected Result:** All data visible in Sentry dashboard

---

### Test 20: Error Grouping
**Test:** Verify errors are grouped correctly
- [ ] Trigger same error multiple times
- [ ] Check Sentry groups them together
- [ ] Verify error frequency is tracked
- [ ] Check affected users count

**Expected Result:** Errors properly grouped and counted

---

## ✅ Final Validation

### Checklist:
- [ ] All error scenarios tested
- [ ] All performance monitoring verified
- [ ] User context working correctly
- [ ] Navigation breadcrumbs tracking
- [ ] No breaking changes introduced
- [ ] App works normally
- [ ] Sentry dashboard shows data
- [ ] Privacy requirements met
- [ ] Development mode working correctly

---

## 🐛 Known Issues / Notes

_Add any issues found during testing here_

---

## 📝 Test Results Summary

**Date:** _______________
**Tester:** _______________
**Environment:** Development / Production
**Sentry DSN:** Configured / Not Configured

**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Notes:**
_Add any additional notes or observations here_

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark Phase 8 as complete
   - ✅ Document any issues found
   - ✅ Set up Sentry alerts (optional)
   - ✅ Monitor production errors

2. **If tests fail:**
   - ❌ Document failures
   - ❌ Fix issues
   - ❌ Re-test
   - ❌ Update documentation

3. **Production Deployment:**
   - 🚀 Deploy to production
   - 🚀 Monitor Sentry dashboard
   - 🚀 Set up alerts for critical errors
   - 🚀 Review error trends weekly

---

**Testing Guide Version:** 1.0
**Last Updated:** [Current Date]

