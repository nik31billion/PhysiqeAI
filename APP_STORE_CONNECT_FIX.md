# App Store Connect "Missing Metadata" Fix

## Issue Identified
Your iOS subscription products show "Missing Metadata" in App Store Connect itself, which is why RevenueCat can't import them.

## Root Cause
The subscription products in App Store Connect are incomplete - they're missing required metadata like descriptions, display names, and localization details.

## Step-by-Step Fix

### 1. Complete Subscription Product Metadata

**Go to App Store Connect → Your App → Subscriptions → Premium**

**For each product (`flexaura_monthly` and `flexaura_yearly`):**

1. **Click on the product name** (e.g., "Premium")
2. **Fill in missing fields:**
   - ✅ **Subscription Display Name**: "Premium Monthly" / "Premium Yearly"
   - ✅ **Description**: Detailed description of benefits
   - ✅ **Subscription Duration**: Already set (1 month, 1 year)
   - ✅ **Price**: Select appropriate pricing tier
   - ✅ **Review Information**: Add screenshots and notes

### 2. Complete Localization

**Click on "English (U.S.)" in Localization section:**

1. **Subscription Group Display Name**: "Premium"
2. **App Name**: "Flex Aura"
3. **Subscription Display Names**: 
   - "Premium Monthly"
   - "Premium Yearly"
4. **Descriptions**: Detailed benefits for each subscription
5. **Review Screenshots**: Upload 3-5 screenshots showing subscription benefits

### 3. Submit for Review

**According to Apple's requirements:**

1. **Create New App Version:**
   - Go to App Store Connect → Your App → App Store
   - Click "+" to create new version
   - Add version number (e.g., 1.0.1)

2. **Add Subscriptions to Version:**
   - In the new version, go to "In-App Purchases and Subscriptions"
   - Add your subscription products
   - Complete all required information

3. **Submit for Review:**
   - Submit the app version with subscriptions
   - Apple will review both app and subscriptions

### 4. Wait for Approval

- **Review Time**: 24-48 hours typically
- **Status Change**: "Missing Metadata" → "Ready for Sale"
- **RevenueCat Import**: Once "Ready for Sale", RevenueCat can import products

## Expected Timeline

1. **Complete Metadata**: 30 minutes
2. **Submit for Review**: 15 minutes  
3. **Apple Review**: 1-2 days
4. **RevenueCat Import**: Immediate after approval
5. **iOS App Testing**: Immediate after import

## After Approval

Once products show "Ready for Sale":

1. **RevenueCat Import**: Go to RevenueCat → Products → Import
2. **Status Change**: Products will show "Published" instead of "Missing Metadata"
3. **iOS Testing**: Subscription plans will load correctly on iOS
4. **Console Logs**: Will show successful offerings fetch

## Common Mistakes to Avoid

- ❌ **Incomplete descriptions**: Apple requires detailed descriptions
- ❌ **Missing screenshots**: Required for subscription review
- ❌ **Wrong pricing**: Ensure pricing tier matches your target market
- ❌ **Missing localization**: Required for all supported languages
- ❌ **Skipping app version**: First subscription must be submitted with app version

## Verification Checklist

Before submitting:
- ✅ All subscription products have complete metadata
- ✅ Localization is complete for all languages
- ✅ Review screenshots are uploaded
- ✅ Pricing is set correctly
- ✅ App version includes the subscriptions
- ✅ All required agreements are signed

## Support Resources

- [App Store Connect Subscriptions Guide](https://developer.apple.com/app-store/subscriptions/)
- [Apple Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [RevenueCat App Store Connect Integration](https://docs.revenuecat.com/docs/app-store-connect-integration)

## Next Steps

1. **Immediate**: Complete metadata in App Store Connect
2. **Today**: Submit for review
3. **1-2 days**: Wait for Apple approval
4. **After approval**: Import to RevenueCat and test on iOS
