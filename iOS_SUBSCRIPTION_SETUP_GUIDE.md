# iOS Subscription Setup Guide

## Issue: Subscription Plans Not Loading on iOS

The subscription plans are working perfectly on Android but failing to load on iOS with the error: "Failed to load subscription plans. Please check your internet connection."

## Root Causes Identified

1. **RevenueCat iOS API Key**: The current iOS API key appears to be a placeholder
2. **Missing iOS Configuration**: App.json missing essential iOS entitlements
3. **Insufficient Error Handling**: Limited iOS-specific debugging information

## Solutions Implemented

### 1. Enhanced app.json Configuration

Added iOS-specific entitlements and configurations:

```json
"ios": {
  "entitlements": {
    "com.apple.developer.in-app-payments": [
      "merchant.com.applotictech.flexaura"
    ]
  },
  "associatedDomains": [
    "applinks:flexaura.app.link"
  ]
}
```

### 2. Enhanced RevenueCat Context

- Added detailed iOS-specific debugging
- Enhanced error logging with platform information
- Better error categorization for iOS issues

### 3. Improved Onboarding Screen

- Added iOS-specific error messages
- Enhanced debugging for subscription loading failures
- Better user feedback for different error scenarios

## Required Actions

### 1. RevenueCat Dashboard Configuration

**CRITICAL**: Update the iOS API key in `PhysiqeAI/utils/RevenueCatContext.tsx`

```typescript
const apiKey = Platform.OS === 'ios' 
  ? 'YOUR_ACTUAL_IOS_API_KEY_HERE'  // Get this from RevenueCat Dashboard
  : 'goog_GbSInxtARSeejPPTFnWzfQaGuIr';
```

**Steps to get iOS API Key:**
1. Go to RevenueCat Dashboard
2. Select your project
3. Go to Project Settings > API Keys
4. Copy the iOS API key (starts with `appl_`)
5. Replace the placeholder in the code

### 2. App Store Connect Configuration

**Verify these settings in App Store Connect:**

1. **In-App Purchases**
   - Go to App Store Connect > Your App > Features > In-App Purchases
   - Ensure you have both monthly and annual subscription products
   - Verify products are in "Ready for Sale" status
   - Check that product IDs match your RevenueCat configuration

2. **Bundle ID**
   - Ensure bundle ID `com.applotictech.flexaura` matches exactly
   - Verify it's properly configured for in-app purchases

3. **App Review Information**
   - Ensure your app has been reviewed and approved
   - TestFlight builds should work for testing

### 3. RevenueCat Dashboard Setup

**Verify these in RevenueCat Dashboard:**

1. **Products Configuration**
   - Go to Products section
   - Ensure iOS products are properly configured
   - Check that App Store Connect product IDs match

2. **Offerings Configuration**
   - Go to Offerings section
   - Verify you have an offering with both monthly and annual packages
   - Check that package identifiers match your code

3. **iOS App Configuration**
   - Ensure iOS app is properly linked to App Store Connect
   - Verify bundle ID matches exactly

### 4. Testing Checklist

**Before testing on device:**

1. ✅ Update iOS API key in code
2. ✅ Ensure products are "Ready for Sale" in App Store Connect
3. ✅ Verify RevenueCat offerings are configured
4. ✅ Test on physical iOS device (not simulator)
5. ✅ Ensure device is signed in to App Store

## Debugging Steps

### 1. Check Console Logs

Look for these log messages when testing:

```
🚀 Initializing RevenueCat for platform: ios with API key: appl_xxxxx...
📱 Fetching offerings for platform: ios
✅ Fetched RevenueCat offerings: {...}
🍎 iOS Offerings Debug: {...}
```

### 2. Common Error Codes

- `NETWORK_ERROR`: Check internet connection
- `CONFIGURATION_ERROR`: API key or product configuration issue
- `PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR`: Product not ready in App Store Connect

### 3. Verification Steps

1. **API Key Verification**: Check console for successful initialization
2. **Products Verification**: Verify offerings contain monthly/annual packages
3. **Purchase Flow**: Test actual purchase flow after plans load

## Additional iOS-Specific Considerations

### 1. StoreKit Configuration

Ensure your iOS project has:
- In-App Purchase capability enabled
- Proper StoreKit configuration
- Correct bundle identifier

### 2. Sandbox Testing

For testing:
- Use sandbox Apple ID
- Ensure TestFlight build or development build
- Test on physical device

### 3. Production Deployment

For production:
- Ensure App Store review approval
- Verify all products are live
- Test with real Apple IDs

## Support Resources

- [RevenueCat iOS Setup Guide](https://docs.revenuecat.com/docs/getting-started/installation/reactnative)
- [App Store Connect In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [RevenueCat Dashboard](https://app.revenuecat.com/)

## Next Steps

1. **Immediate**: Update iOS API key in RevenueCatContext.tsx
2. **Verify**: Check App Store Connect product status
3. **Test**: Deploy and test on physical iOS device
4. **Monitor**: Check console logs for detailed error information

The enhanced error handling will now provide specific information about what's failing, making it easier to diagnose the exact issue.
