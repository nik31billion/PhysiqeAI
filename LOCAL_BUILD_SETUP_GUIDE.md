# Local iOS Build Setup Guide (No EAS Credits)

## 🎯 What This Does

This workflow builds your iOS app **locally on GitHub Actions Mac runner** without using EAS Build credits. It:
- ✅ Uses GitHub Actions Mac runner (free tier: 2,000 minutes/month)
- ✅ Builds IPA directly with Xcode
- ✅ **Does NOT consume EAS Build credits**
- ⚠️ Requires proper code signing setup

## 📋 Prerequisites

### 1. Get Your Apple Team ID

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Sign in with your Apple Developer account
3. Your **Team ID** is shown in the top right corner
   - Format: `XXXXXXXXXX` (10 characters)
   - Example: `DAX56C9A62`

### 2. Configure iOS Credentials in EAS (One-Time Setup)

Even though we're building locally, we need to store your credentials in EAS so the workflow can access them:

```bash
cd PhysiqeAI
eas credentials --platform ios
```

This will:
- Ask you to choose credential management (choose "Local credentials")
- Guide you through setting up certificates and provisioning profiles
- Store them securely in EAS (doesn't use build credits, just stores them)

**Note**: If you've already run `eas build:configure --platform ios` before, your credentials are already stored.

### 3. Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Where to Get It |
|------------|-------|----------------|
| `EXPO_TOKEN` | Your Expo access token | [expo.dev/accounts/.../settings/access-tokens](https://expo.dev/accounts/nikunjtulsyan/settings/access-tokens) |
| `APPLE_TEAM_ID` | Your Apple Team ID | Step 1 above |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase URL | Your Supabase dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Your Supabase dashboard |

## 🚀 Running the Workflow

### Step 1: Push the Workflow

```bash
git add .github/workflows/ios-build-local.yml
git commit -m "Add local iOS build workflow"
git push origin main
```

### Step 2: Trigger the Build

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **iOS Production Build (Local - No EAS Credits)**
4. Click **Run workflow**
5. Select your branch (usually `main`)
6. Click **Run workflow**

### Step 3: Wait for Build

- Build typically takes **20-40 minutes**
- Watch the workflow logs in real-time
- The build will:
  1. Generate iOS project with `expo prebuild`
  2. Install CocoaPods dependencies
  3. Build archive with Xcode
  4. Export IPA file
  5. Upload IPA as artifact

### Step 4: Download IPA

1. After build completes, go to the workflow run
2. Scroll down to **Artifacts**
3. Download `ios-production-ipa`
4. Extract the `.ipa` file

## 📱 Submitting to App Store

### Option 1: Using EAS Submit (Easiest)

```bash
cd PhysiqeAI
eas submit --platform ios --path /path/to/your-app.ipa
```

### Option 2: Manual Upload

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **TestFlight** or **App Store** tab
4. Click **+** to add a new build
5. Upload the IPA file

## 🔧 Troubleshooting

### Error: "No provisioning profiles found"

**Solution**: Make sure you've configured credentials:
```bash
cd PhysiqeAI
eas credentials --platform ios
```

### Error: "Code signing failed"

**Solution**: 
1. Verify your `APPLE_TEAM_ID` secret is correct
2. Make sure your Apple Developer account has proper certificates
3. Check that your bundle ID matches: `com.applotictech.flexaura`

### Error: "Scheme not found"

**Solution**: The workflow automatically detects the scheme. If it fails:
1. Check the workflow logs for the detected scheme name
2. The scheme is usually based on your app slug: `flex-aura`

### Error: "CocoaPods installation failed"

**Solution**: The workflow installs CocoaPods automatically. If it fails:
- Check the logs for specific pod errors
- Some pods might need additional configuration

### Build Takes Too Long

- Normal build time: 20-40 minutes
- First build is slower (installing dependencies)
- Mac runners use 10x GitHub Actions minutes
- Free tier: 2,000 minutes/month = ~5 builds/month

## ⚠️ Important Notes

### Code Signing

- The workflow uses **automatic code signing**
- Requires valid Apple Developer account
- Certificates and provisioning profiles are managed by EAS
- Make sure your Apple Developer account is active

### Build Limitations

- **GitHub Actions free tier**: 2,000 minutes/month
- **Mac runners**: Use 10x minutes (1 min = 10 min used)
- **Typical build**: 30 minutes = 300 minutes used
- **Free tier allows**: ~6 builds/month

### EAS Credentials vs EAS Build

- **EAS Credentials**: Storing certificates (doesn't use build credits)
- **EAS Build**: Actually building the app (uses build credits)
- This workflow uses EAS Credentials but NOT EAS Build

## ✅ Checklist

Before your first build:

- [ ] Got your Apple Team ID
- [ ] Configured iOS credentials: `eas credentials --platform ios`
- [ ] Added `EXPO_TOKEN` to GitHub secrets
- [ ] Added `APPLE_TEAM_ID` to GitHub secrets
- [ ] Added `EXPO_PUBLIC_SUPABASE_URL` to GitHub secrets
- [ ] Added `EXPO_PUBLIC_SUPABASE_ANON_KEY` to GitHub secrets
- [ ] Pushed workflow file to GitHub
- [ ] Ready to trigger first build!

## 🎯 Comparison: Local Build vs EAS Build

| Feature | Local Build | EAS Build |
|---------|-------------|-----------|
| **EAS Credits** | ❌ No | ✅ Yes (15/month free) |
| **Setup Complexity** | ⚠️ Medium | ✅ Easy |
| **Build Time** | 20-40 min | 15-30 min |
| **GitHub Actions Minutes** | ✅ Uses (free tier) | ✅ Uses (free tier) |
| **Code Signing** | ⚠️ Manual setup | ✅ Automatic |
| **Reliability** | ⚠️ Depends on setup | ✅ Very reliable |

## 🆘 Need Help?

If you encounter issues:

1. **Check workflow logs** - Detailed error messages
2. **Verify credentials** - Run `eas credentials --platform ios`
3. **Check Apple Developer account** - Make sure it's active
4. **Verify secrets** - All required secrets are set correctly

## 🚀 Next Steps

1. **Set up credentials** (if not done):
   ```bash
   cd PhysiqeAI
   eas credentials --platform ios
   ```

2. **Add GitHub secrets** (see Prerequisites above)

3. **Push and test**:
   ```bash
   git add .github/workflows/ios-build-local.yml
   git commit -m "Add local iOS build workflow"
   git push origin main
   ```

4. **Trigger build** from GitHub Actions

5. **Download and submit** your IPA!

---

**Ready to build?** Set up credentials and trigger your first build! 🎉

