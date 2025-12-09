# Apple Sign-In Setup Checklist

This checklist covers all steps required to enable Apple Sign-In in your app.

## ✅ Step 1: Apple Developer Console Setup

### 1.1 Create Service ID
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Identifiers** → Click **+** → Select **Services IDs**
4. Create a new Service ID:
   - **Description**: Flex Aura Sign In
   - **Identifier**: `com.applotictech.flexaura.signin` (must match your CLIENT_ID)
5. Enable **Sign In with Apple** capability
6. Click **Configure** next to Sign In with Apple
7. Set **Primary App ID**: `com.applotictech.flexaura`
8. Add **Return URLs**:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Replace `YOUR_SUPABASE_PROJECT` with your actual Supabase project URL
9. Click **Save** → **Continue** → **Register**

### 1.2 Create Sign In with Apple Key
1. Go to **Keys** section in Apple Developer Console
2. Click **+** to create a new key
3. Enter **Key Name**: Flex Aura Sign In Key
4. Enable **Sign In with Apple** capability
5. Click **Configure** → Select your **Primary App ID**: `com.applotictech.flexaura`
6. Click **Save** → **Continue** → **Register**
7. **Download the .p8 key file** (you can only download it once!)
8. Note your **Key ID** (e.g., `LV29MFSHYY`)
9. Note your **Team ID** (e.g., `DAX56C9A62`) - found in Membership section

### 1.3 Verify App ID Configuration
1. Go to **Identifiers** → Find your App ID: `com.applotictech.flexaura`
2. Ensure **Sign In with Apple** capability is enabled
3. Click **Configure** → Verify configuration

## ✅ Step 2: Generate Client Secret (JWT)

### 2.1 Update generate-apple-jwt.js
Your file should have these values (verify they're correct):
```javascript
const TEAM_ID = 'DAX56C9A62'; // Your Team ID from Apple Developer
const KEY_ID = 'LV29MFSHYY';   // Your Key ID from Step 1.2
const CLIENT_ID = 'com.applotictech.flexaura.signin'; // Your Service ID
const PRIVATE_KEY_PATH = './apple_provider/AuthKey_LV29MFSHYY.p8'; // Your .p8 file path
```

### 2.2 Generate JWT
1. Make sure `jsonwebtoken` is installed: `npm install jsonwebtoken`
2. Place your `.p8` file in `apple_provider/` folder
3. Run: `node generate-apple-jwt.js`
4. **Copy the generated JWT token** (it's valid for 6 months)
5. You'll need to regenerate this every 6 months

## ✅ Step 3: Supabase Configuration

### 3.1 Enable Apple Provider
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Apple** provider
5. Click **Enable**

### 3.2 Configure Apple Provider
Fill in these fields:

1. **Services ID (Client ID)**
   - Value: `com.applotictech.flexaura.signin`
   - This is your Service ID from Step 1.1

2. **Secret Key (for OAuth)**
   - Value: Paste the JWT token from Step 2.2
   - This is the client secret you generated

3. **Additional Settings** (if available):
   - **Key ID**: `LV29MFSHYY` (your Key ID)
   - **Team ID**: `DAX56C9A62` (your Team ID)

### 3.3 Verify Redirect URL
1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Check that **Redirect URLs** includes:
   - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - `com.applotictech.flexaura://` (for deep linking)
3. Add any missing URLs

## ✅ Step 4: App Configuration

### 4.1 Verify app.json
Your `app.json` should include:
```json
{
  "expo": {
    "plugins": [
      "expo-apple-authentication"
    ],
    "ios": {
      "bundleIdentifier": "com.applotictech.flexaura"
    }
  }
}
```

✅ Verify: Your `app.json` already has `expo-apple-authentication` plugin

### 4.2 Verify Xcode Configuration
1. Open your iOS project in Xcode (after running `npx expo prebuild`)
2. Go to **Signing & Capabilities**
3. Verify **Sign In with Apple** capability is added
4. If not, click **+ Capability** → Add **Sign In with Apple**

### 4.3 Verify Bundle ID Match
- **App Bundle ID**: `com.applotictech.flexaura`
- **Service ID**: `com.applotictech.flexaura.signin`
- **App ID in Apple Developer**: `com.applotictech.flexaura`

All must match exactly!

## ✅ Step 5: Testing

### 5.1 Test on Physical iOS Device
1. Build and install app on physical iOS device (not simulator)
2. Ensure device is signed into iCloud
3. Try Apple Sign-In
4. Check console logs for errors

### 5.2 Common Issues

#### Issue: "Apple Sign-In is not available"
- **Solution**: Sign into iCloud on the device
- **Solution**: Ensure iOS version >= 13.0

#### Issue: "Invalid login credentials" from Supabase
- **Solution**: Verify Service ID matches in Supabase
- **Solution**: Regenerate and update JWT token in Supabase
- **Solution**: Check Key ID and Team ID are correct

#### Issue: "Redirect URL mismatch"
- **Solution**: Verify redirect URL in Supabase matches Apple Developer Console
- **Solution**: Check Service ID return URLs include Supabase callback URL

#### Issue: "Provider not configured"
- **Solution**: Enable Apple provider in Supabase Dashboard
- **Solution**: Verify all fields are filled correctly

## ✅ Step 6: Monitoring

### 6.1 Check Console Logs
When testing, look for these logs:
```
🍎 Apple Sign-In available: true
🍎 Starting Apple Sign-In...
🍎 Apple credential received: {...}
🍎 Authenticating with Supabase...
🍎 Supabase authentication successful: {...}
```

### 6.2 Check Supabase Logs
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for Apple authentication attempts
3. Check for any error messages

### 6.3 Check Apple Developer Console
1. Go to Apple Developer Console → **Certificates, Identifiers & Profiles**
2. Check your Service ID configuration
3. Verify return URLs are correct

## 📋 Quick Verification Checklist

- [ ] Service ID created: `com.applotictech.flexaura.signin`
- [ ] Service ID has Sign In with Apple enabled
- [ ] Return URLs configured in Service ID
- [ ] Key created with Key ID: `LV29MFSHYY`
- [ ] .p8 key file downloaded and saved
- [ ] Team ID noted: `DAX56C9A62`
- [ ] JWT token generated successfully
- [ ] Apple provider enabled in Supabase
- [ ] Service ID entered in Supabase: `com.applotictech.flexaura.signin`
- [ ] JWT token pasted in Supabase Secret Key field
- [ ] Redirect URLs configured in Supabase
- [ ] `expo-apple-authentication` plugin in app.json
- [ ] Bundle ID matches: `com.applotictech.flexaura`
- [ ] Sign In with Apple capability in Xcode
- [ ] Tested on physical iOS device
- [ ] Device signed into iCloud

## 🔍 Debugging Steps

### If Sign-In Fails:

1. **Check the exact error message** (we'll add better error display)
2. **Verify Service ID** matches in all places
3. **Check JWT token** is not expired (regenerate if needed)
4. **Verify redirect URLs** match exactly
5. **Check Supabase logs** for detailed error
6. **Verify device** is signed into iCloud
7. **Check iOS version** is >= 13.0

### Error Message Reference:

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| "Apple Sign-In is not available" | Not signed into iCloud | Sign into iCloud |
| "Invalid login credentials" | Wrong Service ID or JWT | Verify Supabase config |
| "Redirect URL mismatch" | URLs don't match | Update return URLs |
| "Provider not configured" | Apple not enabled in Supabase | Enable in dashboard |
| "No identity token" | Apple authentication failed | Check device/iCloud |

## 🔄 JWT Token Renewal

The JWT token expires after 6 months. To renew:

1. Run `node generate-apple-jwt.js` again
2. Copy the new JWT token
3. Update it in Supabase Dashboard → Authentication → Providers → Apple
4. Save the changes

## 📞 Support Resources

- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Apple Provider Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

## 🎯 Current Configuration

Based on your `generate-apple-jwt.js` file:
- **Team ID**: `DAX56C9A62`
- **Key ID**: `LV29MFSHYY`
- **Service ID**: `com.applotictech.flexaura.signin`
- **Bundle ID**: `com.applotictech.flexaura`

**Next Steps:**
1. Verify all these values are correct in Apple Developer Console
2. Verify they match in Supabase Dashboard
3. Test the sign-in flow and check error messages

