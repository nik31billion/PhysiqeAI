# Apple Sign-In Error Diagnosis Guide

## 🎯 How to Find the Exact Error

When you try to sign in with Apple on iOS, the app will now show you detailed error messages. Here's how to diagnose the issue:

### Step 1: Check the Error Alert
When you tap "Sign In with Apple" and it fails, you'll see an alert with:
- **Error Title**: Tells you the category of error
- **Error Message**: Describes what went wrong
- **"View Details" button**: Shows technical details (error code, status)

### Step 2: Check Console Logs
Open your development console (React Native debugger, Metro bundler, or Xcode console) and look for logs starting with 🍎:

```
🍎 Apple Sign-In available: true/false
🍎 Starting Apple Sign-In...
🍎 Apple credential received: {...}
🍎 Authenticating with Supabase...
🍎 Supabase authentication error: {...}
🍎❌ INVALID CREDENTIALS - Check: ...
```

### Step 3: Check Supabase Logs
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Logs** → **Auth Logs**
3. Look for recent authentication attempts
4. Check for error messages from Apple provider

## 🔍 Common Errors and Solutions

### Error 1: "Invalid login credentials"
**What it means**: Supabase can't verify the Apple token
**Common causes**:
1. Service ID mismatch between Supabase and Apple Developer Console
2. JWT token expired or invalid
3. Key ID or Team ID incorrect

**How to fix**:
1. Verify Service ID in Supabase matches: `com.applotictech.flexaura.signin`
2. Regenerate JWT token: `node generate-apple-jwt.js`
3. Update JWT in Supabase Dashboard → Authentication → Providers → Apple
4. Verify Key ID: `LV29MFSHYY` and Team ID: `DAX56C9A62`

### Error 2: "Redirect URL mismatch"
**What it means**: Return URLs don't match between Apple and Supabase
**Common causes**:
1. Return URL in Apple Developer Console doesn't match Supabase
2. URL format is incorrect
3. Missing callback URL

**How to fix**:
1. Get your Supabase project URL (e.g., `https://abcdefgh.supabase.co`)
2. Add return URL in Apple Developer Console: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. Verify redirect URL in Supabase Dashboard → Authentication → URL Configuration
4. URLs must match EXACTLY (including https:// and trailing /)

### Error 3: "Service ID mismatch" or "client_id error"
**What it means**: The Service ID in Supabase doesn't match Apple Developer Console
**Common causes**:
1. Typo in Service ID
2. Wrong Service ID used
3. Service ID not properly configured

**How to fix**:
1. Verify Service ID in Apple Developer Console: `com.applotictech.flexaura.signin`
2. Verify Service ID in Supabase: Authentication → Providers → Apple
3. They must match EXACTLY (case-sensitive)

### Error 4: "Apple Sign-In is not available"
**What it means**: Device doesn't support Apple Sign-In
**Common causes**:
1. Not signed into iCloud
2. iOS version < 13.0
3. Device restrictions

**How to fix**:
1. Sign into iCloud on the device (Settings → [Your Name] → iCloud)
2. Ensure iOS version is 13.0 or later
3. Check device restrictions (Settings → Screen Time → Content & Privacy Restrictions)

### Error 5: "No identity token received from Apple"
**What it means**: Apple authentication succeeded but no token returned
**Common causes**:
1. Network issues
2. Apple authentication service error
3. App configuration issue

**How to fix**:
1. Check internet connection
2. Retry sign-in
3. Verify app bundle ID matches: `com.applotictech.flexaura`
4. Check Xcode project has Sign In with Apple capability

## 📋 Quick Diagnostic Checklist

Run through this checklist when you see an error:

### Configuration Check
- [ ] Service ID in Supabase: `com.applotictech.flexaura.signin`
- [ ] Service ID in Apple Developer Console: `com.applotictech.flexaura.signin`
- [ ] Service IDs match exactly (case-sensitive)
- [ ] JWT token generated recently (not expired)
- [ ] JWT token pasted in Supabase Secret Key field
- [ ] Key ID correct: `LV29MFSHYY`
- [ ] Team ID correct: `DAX56C9A62`

### URL Configuration Check
- [ ] Return URL in Apple Developer Console includes: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- [ ] Redirect URL in Supabase matches exactly
- [ ] URLs use `https://` (not `http://`)
- [ ] No trailing spaces in URLs

### Device Check
- [ ] Testing on physical iOS device (not simulator if possible)
- [ ] Device signed into iCloud
- [ ] iOS version >= 13.0
- [ ] App bundle ID: `com.applotictech.flexaura`

### Supabase Check
- [ ] Apple provider enabled in Supabase Dashboard
- [ ] All fields filled in Apple provider settings
- [ ] No error messages in Supabase Auth Logs

## 🔧 Step-by-Step Diagnosis Process

### 1. Try Sign-In and Note the Error
- Tap "Sign In with Apple"
- Read the error message carefully
- Tap "View Details" to see error code and status
- Take a screenshot or note the exact message

### 2. Check Console Logs
- Look for 🍎 emoji logs
- Find the first error log
- Note what stage failed:
  - Availability check
  - Credential request
  - Token validation
  - Supabase authentication

### 3. Check Supabase Dashboard
- Go to Authentication → Providers → Apple
- Verify all fields are filled:
  - Services ID (Client ID)
  - Secret Key (JWT token)
- Check Auth Logs for detailed error

### 4. Check Apple Developer Console
- Verify Service ID configuration
- Check return URLs
- Verify Key is active
- Check App ID has Sign In with Apple enabled

### 5. Regenerate JWT Token (if needed)
```bash
node generate-apple-jwt.js
```
- Copy the new JWT token
- Update it in Supabase Dashboard
- Save and try again

## 🚨 Most Common Issue

**90% of Apple Sign-In errors are due to:**
1. **JWT token expired or invalid** → Regenerate and update in Supabase
2. **Service ID mismatch** → Verify Service ID matches exactly in both places
3. **Redirect URL mismatch** → Ensure return URLs match exactly

## 📞 Getting Help

If you've checked everything and still get errors:

1. **Collect error information**:
   - Error message from alert
   - Error code and status from "View Details"
   - Console logs (all 🍎 logs)
   - Supabase Auth Logs

2. **Verify configuration**:
   - Run through the Quick Diagnostic Checklist above
   - Double-check all values match exactly

3. **Check documentation**:
   - See `APPLE_SIGN_IN_SETUP_CHECKLIST.md` for setup steps
   - Review `APPLE_SIGN_IN_ERROR_DEBUGGING.md` for detailed debugging

## 🎯 Next Steps

1. **Try signing in again** and note the exact error message
2. **Check the console logs** for 🍎 emoji logs
3. **Follow the error-specific solution** from the list above
4. **Verify configuration** using the checklist
5. **Regenerate JWT token** if it's been more than 6 months

The improved error handling will now show you exactly what's wrong, making it much easier to fix the issue!

