# Apple Sign-In Error Debugging Guide

## Overview
This guide explains the Apple Sign-In errors, how to identify them, and the comprehensive fixes applied.

## Issues Identified

### 1. **Platform Compatibility Issue** ⚠️
- **Problem**: `AppleAuthenticationButton` was rendered on all platforms (iOS, Android, Web)
- **Impact**: Crashes on Android/Web because the component doesn't exist on those platforms
- **Fix**: Added `Platform.OS === 'ios'` check before rendering

### 2. **Missing Availability Check** ⚠️
- **Problem**: Button rendered without checking if Apple Sign-In is available on the device
- **Impact**: Crashes on devices where Apple Sign-In isn't supported (e.g., simulators without proper setup, devices not signed into iCloud)
- **Fix**: Added `isAvailableAsync()` check before rendering button

### 3. **Insufficient Error Handling** ⚠️
- **Problem**: Only handled `ERR_REQUEST_CANCELED`, missing other error codes
- **Impact**: Generic error messages don't help identify the root cause
- **Fix**: Added comprehensive error handling for all common error codes

### 4. **Poor Error Logging** ⚠️
- **Problem**: Minimal logging made it hard to debug issues
- **Impact**: Difficult to identify where and why errors occurred
- **Fix**: Added detailed logging at each step with 🍎 emoji for easy identification

## How to Identify Errors

### 1. **Check Console Logs**
Look for logs prefixed with 🍎 emoji:
```
🍎 Apple Sign-In available: true/false
🍎 Starting Apple Sign-In...
🍎 Apple credential received: {...}
🍎 Authenticating with Supabase...
🍎 Apple Sign-In Error: ...
```

### 2. **Error Location Identification**
Errors can occur at different stages:

#### Stage 1: Availability Check
- **Location**: `OnboardingScreen2.tsx` - `useEffect` hook
- **Log**: `🍎 Error checking Apple Sign-In availability:`
- **Common Causes**:
  - Device not signed into iCloud
  - Simulator without proper configuration
  - iOS version < 13.0

#### Stage 2: Button Rendering
- **Location**: `OnboardingScreen2.tsx` - Render method
- **Common Causes**:
  - Platform is not iOS (Android/Web)
  - `isAppleAvailable` is false
  - Component import issues

#### Stage 3: Sign-In Request
- **Location**: `AuthContext.tsx` - `signInWithApple` function
- **Log**: `🍎 Requesting Apple Sign-In credential...`
- **Common Causes**:
  - User cancelled the sign-in
  - Network issues
  - Apple ID authentication failure

#### Stage 4: Token Validation
- **Location**: `AuthContext.tsx` - After `signInAsync`
- **Log**: `🍎 Apple credential received:`
- **Common Causes**:
  - No identity token returned
  - Invalid token format

#### Stage 5: Supabase Authentication
- **Location**: `AuthContext.tsx` - `supabase.auth.signInWithIdToken`
- **Log**: `🍎 Supabase authentication error:`
- **Common Causes**:
  - Invalid token
  - Supabase configuration issues
  - Network problems
  - Apple provider not configured in Supabase

## Error Codes Reference

### Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ERR_REQUEST_CANCELED` | User cancelled sign-in | Normal behavior, no action needed |
| `ERR_CANCELED` | User cancelled sign-in | Normal behavior, no action needed |
| `ERR_INVALID_RESPONSE` | Invalid response from Apple | Retry sign-in |
| `ERR_NOT_AVAILABLE` | Apple Sign-In not available | Check device/iCloud settings |
| Platform error | Not on iOS | Only available on iOS devices |

### Supabase Error Codes

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| `Invalid login credentials` | Token validation failed | Check Supabase Apple provider configuration |
| `Provider not configured` | Apple provider not set up | Configure Apple provider in Supabase dashboard |

## Debugging Steps

### Step 1: Check Platform
```javascript
console.log('Platform:', Platform.OS); // Should be 'ios'
```

### Step 2: Check Availability
```javascript
const isAvailable = await AppleAuthentication.isAvailableAsync();
console.log('Apple Sign-In available:', isAvailable);
```

### Step 3: Check Device Settings
- Ensure device is signed into iCloud
- Check iOS version (must be >= 13.0)
- Verify device has Apple ID configured

### Step 4: Check Supabase Configuration
1. Go to Supabase Dashboard
2. Navigate to Authentication > Providers
3. Ensure Apple provider is enabled
4. Verify Service ID and Key ID are configured
5. Check redirect URL matches your app

### Step 5: Check App Configuration
1. Verify `app.json` has `expo-apple-authentication` plugin
2. Ensure iOS bundle identifier is correct
3. Check that Apple Sign-In capability is enabled in Xcode

### Step 6: Review Logs
Look for detailed logs in the console:
- Availability check results
- Credential receipt confirmation
- Token validation status
- Supabase authentication response

## Fixes Applied

### 1. OnboardingScreen2.tsx
- ✅ Added `Platform` import
- ✅ Added `useEffect` to check Apple availability on mount
- ✅ Added conditional rendering based on platform and availability
- ✅ Added fallback button for iOS when Apple Sign-In isn't available
- ✅ Improved error handling with detailed logging
- ✅ Added loading state management

### 2. AuthContext.tsx
- ✅ Added platform check at function start
- ✅ Added try-catch around availability check
- ✅ Added detailed logging at each step
- ✅ Added error handling for multiple error codes
- ✅ Added Supabase error logging
- ✅ Improved error messages for better user feedback

## Testing Checklist

### iOS Device Testing
- [ ] Test on physical iOS device
- [ ] Test with device signed into iCloud
- [ ] Test with device not signed into iCloud
- [ ] Test user cancellation flow
- [ ] Test successful sign-in flow
- [ ] Test error scenarios

### iOS Simulator Testing
- [ ] Test on iOS Simulator (may have limitations)
- [ ] Verify availability check works
- [ ] Test fallback button rendering

### Android Testing
- [ ] Verify Apple button doesn't render on Android
- [ ] Verify no crashes occur
- [ ] Verify other sign-in methods work

## Common Issues and Solutions

### Issue: "Apple Sign-In is not available on this device"
**Solution**: 
- Sign into iCloud on the device
- Ensure iOS version >= 13.0
- Check device settings > Sign-In & Security > Apple ID

### Issue: "No identity token received from Apple"
**Solution**:
- Retry sign-in
- Check network connection
- Verify Apple ID is valid

### Issue: "Supabase authentication error"
**Solution**:
- Check Supabase dashboard for Apple provider configuration
- Verify Service ID and Key ID
- Check redirect URLs
- Review Supabase logs for detailed error

### Issue: Button doesn't appear
**Solution**:
- Check console for availability status
- Verify platform is iOS
- Check if `isAppleAvailable` is true
- Review render logic in OnboardingScreen2

### Issue: App crashes on Android
**Solution**:
- Verify Platform.OS check is in place
- Ensure AppleAuthenticationButton is only rendered on iOS
- Check that imports are conditional

## Monitoring and Logging

### Key Log Points
1. **Availability Check**: `🍎 Apple Sign-In available: true/false`
2. **Sign-In Start**: `🍎 Starting Apple Sign-In...`
3. **Credential Received**: `🍎 Apple credential received: {...}`
4. **Supabase Auth**: `🍎 Authenticating with Supabase...`
5. **Success**: `🍎 Apple Sign-In successful!`
6. **Errors**: `🍎 Apple Sign-In Error: ...`

### Log Analysis
- Check for 🍎 emoji in logs to find Apple Sign-In related messages
- Review error details object for code, message, and stack trace
- Verify each stage completes before moving to next

## Additional Resources

- [Expo Apple Authentication Docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Supabase Apple Provider Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Sign-In Requirements](https://developer.apple.com/sign-in-with-apple/)

## Support

If errors persist after applying these fixes:
1. Check console logs for detailed error messages
2. Verify all configuration steps are completed
3. Test on a physical iOS device (not simulator)
4. Review Supabase dashboard for provider configuration
5. Check Apple Developer account for Service ID setup

