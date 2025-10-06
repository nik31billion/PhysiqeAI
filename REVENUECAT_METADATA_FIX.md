# RevenueCat "Missing Metadata" Fix

## Issue Identified
Products showing "Missing Metadata" status in RevenueCat dashboard:
- `Premium` (`flexaura_monthly`)
- `Premium Yearly` (`flexaura_yearly`)

## Root Cause
The "Missing Metadata" status indicates that RevenueCat cannot properly connect to your App Store Connect products.

## Immediate Fix Steps

### 1. App Store Connect Verification
**Go to App Store Connect → Your App → Features → In-App Purchases**

Verify these products exist and are "Ready for Sale":
- Product ID: `flexaura_monthly`
- Product ID: `flexaura_yearly`

**Check Status:**
- ✅ Ready for Sale
- ❌ Missing Metadata
- ❌ Waiting for Review

### 2. RevenueCat Product Re-import
**In RevenueCat Dashboard:**

1. Go to **Products** section
2. Click **"Import"** button (top right)
3. Select your iOS app: "Flex Aura - AI Fitness App"
4. This will automatically sync and fix the metadata issue

### 3. Manual Product Configuration (if import fails)
**For each "Missing Metadata" product:**

1. Click on the product (e.g., `Premium`)
2. Click **"Edit"**
3. Verify these fields:
   - **Product ID**: `flexaura_monthly` (exact match)
   - **Store**: App Store
   - **Bundle ID**: `com.applotictech.flexaura`
   - **Product Type**: Auto-renewable subscription

4. Click **"Save"**

### 4. Verify Bundle ID Match
**Check these match exactly:**
- **Your app.json**: `com.applotictech.flexaura`
- **App Store Connect**: `com.applotictech.flexaura`
- **RevenueCat**: `com.applotictech.flexaura`

### 5. Check App Store Connect Agreements
**Go to App Store Connect → Agreements, Tax, and Banking:**
- ✅ Paid Applications Agreement signed
- ✅ Banking information complete
- ✅ Tax information complete

## Expected Result
After fixing, your products should show:
- ✅ **Published** status instead of "Missing Metadata"
- ✅ Subscription plans should load on iOS
- ✅ Console logs should show successful offerings fetch

## Testing
1. Deploy updated app to TestFlight
2. Test on physical iOS device
3. Check console logs for successful offerings fetch
4. Verify subscription plans display correctly

## Common Issues
- **Bundle ID mismatch**: Most common cause
- **Products not "Ready for Sale"**: Check App Store Connect status
- **Missing agreements**: Complete Paid Applications Agreement
- **Wrong product IDs**: Ensure exact match between platforms

## Next Steps
1. Complete the import/re-import process
2. Verify all products show "Published" status
3. Test on iOS device
4. Check console logs for success messages
