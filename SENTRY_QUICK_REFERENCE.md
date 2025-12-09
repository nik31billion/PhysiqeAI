# 🚀 Sentry Quick Reference Guide

## 📍 Quick Links

- **Implementation Status:** `SENTRY_IMPLEMENTATION_COMPLETE.md`
- **Testing Guide:** `SENTRY_TESTING_GUIDE.md`
- **Testing Checklist:** `SENTRY_PHASE8_TESTING_CHECKLIST.md`
- **Configuration:** `utils/sentryConfig.ts`

---

## ⚡ Quick Setup (30 seconds)

1. **Get your Sentry DSN:**
   - Go to https://sentry.io
   - Create project → Select "React Native"
   - Copy your DSN

2. **Add to `.env`:**
   ```env
   EXPO_PUBLIC_SENTRY_DSN=your_dsn_here
   ```

3. **Done!** Sentry is now active ✅

---

## 🔍 What's Being Tracked

### ✅ Errors Tracked:
- React component errors (ErrorBoundary)
- JavaScript errors (global handler)
- Unhandled promise rejections
- API errors (Food Scanner, Plan Generation, Coach Glow)
- Database query errors
- Authentication errors
- UI errors (navigation, forms, validation)

### ⚡ Performance Tracked:
- API call durations
- Slow operations (>5s)
- Nested operation breakdowns
- Transaction performance

### 👤 User Context:
- User ID (on login)
- Email (masked)
- Subscription status
- Automatically cleared on logout

### 🧭 Breadcrumbs:
- Screen navigation
- User actions
- API calls
- Auth state changes

---

## 🛠️ Common Tasks

### View Errors in Sentry:
1. Go to https://sentry.io
2. Select your project
3. Click "Issues" tab
4. See all errors with full context

### Test Error Tracking:
1. See `SENTRY_TESTING_GUIDE.md`
2. Use Method 1 (ErrorBoundary test) - easiest
3. Check Sentry dashboard after 1-2 minutes

### Check Performance:
1. Go to Sentry dashboard
2. Click "Performance" tab
3. See slow operations and transactions

### Disable Sentry Temporarily:
- Remove `EXPO_PUBLIC_SENTRY_DSN` from `.env`
- Or set it to empty string
- App will work normally without Sentry

---

## 📊 Key Functions

### In Your Code:

```typescript
import { captureException, addBreadcrumb, startTransaction } from './utils/sentryConfig';

// Capture an error
captureException(error, {
  context: {
    operation: 'myOperation',
    userId: user.id,
  },
});

// Add breadcrumb
addBreadcrumb('User action', 'category', { data: 'value' });

// Track performance
const transaction = startTransaction('operation_name', 'api.call');
// ... do work ...
transaction.finish();
```

---

## 🎯 Error Context Examples

### Food Scanner Error:
```typescript
{
  foodScanner: {
    operation: 'analyzeFood',
    scanMode: 'food',
    userId: 'user-123',
    errorCode: 'NETWORK_ERROR',
  }
}
```

### Plan Generation Error:
```typescript
{
  planGeneration: {
    operation: 'generatePlanViaEdgeFunction',
    userId: 'user-123',
    planType: 'both',
    errorCode: 'TIMEOUT',
  }
}
```

### Coach Glow Error:
```typescript
{
  coachGlow: {
    operation: 'sendMessageToCoachGlow',
    userId: 'user-123',
    messageLength: 50,
    intent: 'general',
  }
}
```

---

## 🔒 Privacy & Security

### ✅ What's Safe:
- User IDs (anonymized)
- Error messages (sanitized)
- Operation types
- Performance metrics

### ❌ What's NOT Sent:
- Passwords
- Tokens
- Full email addresses (masked)
- Sensitive user data

### Development Mode:
- Errors logged to console
- Errors NOT sent to Sentry
- Breadcrumbs disabled

---

## 📈 Performance Thresholds

- **< 1s:** ✅ Fast
- **1-3s:** ⚠️ Normal
- **3-5s:** 🔶 Slow
- **> 5s:** 🔴 Very Slow (reported to Sentry)

---

## 🐛 Troubleshooting

### Errors Not Appearing?
1. Check DSN is set in `.env`
2. Check console for "Sentry initialized" message
3. Wait 1-2 minutes (Sentry batches errors)
4. Check internet connection

### App Crashes?
1. Check console logs
2. Check Sentry dashboard
3. Remove any test code
4. Verify no breaking changes

### Performance Issues?
1. Check Sentry Performance tab
2. Look for slow operations
3. Review transaction breakdowns
4. Optimize based on data

---

## 📞 Support

- **Sentry Docs:** https://docs.sentry.io/platforms/react-native/
- **Sentry Dashboard:** https://sentry.io
- **Implementation Docs:** See `SENTRY_IMPLEMENTATION_COMPLETE.md`

---

## ✅ Implementation Checklist

- [x] Phase 1: Foundation
- [x] Phase 2: Core Error Tracking
- [x] Phase 3: API Error Tracking
- [x] Phase 4: Supabase & Auth
- [x] Phase 5: UI Error Tracking
- [x] Phase 6: Performance Monitoring
- [x] Phase 7: User Context & Breadcrumbs
- [x] Phase 8: Testing & Validation

**Status:** ✅ **COMPLETE**

---

**Last Updated:** [Current Date]
**Version:** 1.0

