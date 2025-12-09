# GitHub Actions iOS Build Setup Guide

## ✅ What's Been Created

1. **`.github/workflows/ios-build.yml`** - Full-featured workflow with artifact download
2. **`.github/workflows/ios-build-simple.yml`** - Simpler version (recommended to start)
3. **Updated `eas.json`** - Ensures production builds create IPA format

## 📋 What You Need to Do

### Step 1: Get Your Expo Access Token

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Get your access token**:
   ```bash
   eas whoami
   ```
   This will show your username. To get the token:
   - Go to [Expo Dashboard](https://expo.dev/accounts/nikunjtulsyan/settings/access-tokens)
   - Click "Create Token"
   - Name it: `GitHub Actions iOS Build`
   - Copy the token (you'll only see it once!)

### Step 2: Get Apple Credentials (For App Store Submission)

#### A. Apple ID
- Your Apple Developer account email
- Example: `your-email@example.com`

#### B. App-Specific Password
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Go to **Security** → **App-Specific Passwords**
4. Click **Generate Password**
5. Label it: `GitHub Actions iOS Build`
6. Copy the password (starts with `xxxx-xxxx-xxxx-xxxx`)

#### C. Apple Team ID (Optional, for submission)
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Sign in
3. Your Team ID is shown in the top right (format: `XXXXXXXXXX`)
4. Or check your `app.json` - it might be in your Apple Developer account

### Step 3: Add Secrets to GitHub

1. **Go to your GitHub repository**
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets one by one:

#### Required Secrets:

| Secret Name | Value | Where to Get It |
|------------|-------|----------------|
| `EXPO_TOKEN` | Your Expo access token | Step 1 above |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase URL | Your Supabase dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Your Supabase dashboard |

#### Optional Secrets (For App Store Submission):

| Secret Name | Value | Where to Get It |
|------------|-------|----------------|
| `APPLE_ID` | Your Apple Developer email | Your Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | Step 2B above |
| `APPLE_TEAM_ID` | Your Team ID | Step 2C above |

### Step 4: Choose Your Workflow

You have two workflow files:

#### Option A: Simple Workflow (Recommended to Start)
- **File**: `.github/workflows/ios-build-simple.yml`
- **How it works**: Builds the IPA, you download from EAS Dashboard
- **Pros**: Simpler, easier to debug
- **Cons**: Manual download step

#### Option B: Full Workflow
- **File**: `.github/workflows/ios-build.yml`
- **How it works**: Builds IPA and uploads as GitHub artifact
- **Pros**: IPA available as download in GitHub
- **Cons**: More complex, requires `jq` (might need adjustment)

**Recommendation**: Start with **Option A** (simple), then switch to Option B if you need artifact downloads.

### Step 5: Test the Workflow

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add GitHub Actions iOS build workflow"
   git push origin main
   ```

2. **Trigger the workflow**:
   - Go to your GitHub repository
   - Click **Actions** tab
   - Select **iOS Production Build (Simple)** workflow
   - Click **Run workflow** button
   - Select your branch (usually `main`)
   - Click **Run workflow**

3. **Monitor the build**:
   - Watch the workflow run in real-time
   - Check for any errors
   - Build typically takes 15-30 minutes

### Step 6: Download Your IPA

#### If using Simple Workflow:
1. After build completes, go to [EAS Build Dashboard](https://expo.dev/accounts/nikunjtulsyan/projects/flex-aura/builds)
2. Find your latest iOS build
3. Click **Download** to get the IPA file

#### If using Full Workflow:
1. After build completes, go to GitHub Actions
2. Click on the completed workflow run
3. Scroll down to **Artifacts**
4. Download `ios-production-ipa`

## 🚀 Submitting to App Store

### Option 1: Using EAS Submit (Recommended)

After your build completes:

```bash
cd PhysiqeAI
eas submit --platform ios --latest
```

This will:
- Find your latest build
- Upload it to App Store Connect
- Handle all the submission process

### Option 2: Manual Submission

1. **Download the IPA** (from EAS Dashboard or GitHub artifacts)
2. **Use Transporter App** (macOS) or **App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Select your app
   - Go to **TestFlight** or **App Store** tab
   - Click **+** to add a new build
   - Upload the IPA file

## 📊 Understanding Build Output

### IPA Format
- ✅ **IPA** (iOS App Store Package) is the correct format
- ✅ EAS Build automatically creates IPA for production builds
- ✅ This is what App Store expects

### Build Location
- Builds are stored in EAS Build servers
- You can download them from:
  - EAS Dashboard: `https://expo.dev/accounts/nikunjtulsyan/projects/flex-aura/builds`
  - GitHub Actions artifacts (if using full workflow)

## 🔧 Troubleshooting

### Build Fails with "EXPO_TOKEN not found"
- ✅ Make sure you added `EXPO_TOKEN` secret in GitHub
- ✅ Verify the token is correct (regenerate if needed)

### Build Fails with "No credentials found"
- ✅ Make sure you've configured iOS credentials in EAS:
  ```bash
  eas build:configure --platform ios
  ```
- ✅ Or use remote credentials (EAS will prompt)

### Build Takes Too Long
- ✅ Mac runners use 10x GitHub Actions minutes
- ✅ 30-minute build = 300 minutes used
- ✅ Free tier: 2,000 minutes/month = ~6 builds/month
- ✅ Consider upgrading GitHub Actions or using EAS Build directly

### "Cannot find module" errors
- ✅ Make sure `npm ci` runs successfully
- ✅ Check that `package-lock.json` is committed
- ✅ Verify Node.js version matches (currently set to 20)

## 💰 Cost Considerations

### GitHub Actions Free Tier:
- **2,000 minutes/month** for free accounts
- **Mac runners use 10x minutes** (1 minute = 10 minutes used)
- **Typical iOS build**: 20-30 minutes = 200-300 minutes used
- **Free tier allows**: ~6-10 builds/month

### If You Run Out:
1. **Upgrade GitHub Actions** ($4/month for 3,000 more minutes)
2. **Use EAS Build directly** ($29/month for Production plan)
3. **Use cloud Mac** for occasional builds

## ✅ Checklist

Before your first build, make sure:

- [ ] Added `EXPO_TOKEN` secret to GitHub
- [ ] Added `EXPO_PUBLIC_SUPABASE_URL` secret to GitHub
- [ ] Added `EXPO_PUBLIC_SUPABASE_ANON_KEY` secret to GitHub
- [ ] (Optional) Added Apple credentials for submission
- [ ] Pushed workflow files to GitHub
- [ ] Tested workflow with manual trigger
- [ ] Verified build completes successfully
- [ ] Downloaded IPA file
- [ ] Tested IPA installation (if possible)

## 🎯 Next Steps

1. **Test the workflow** with a manual trigger
2. **Download the IPA** and verify it's the correct format
3. **Submit to App Store** using `eas submit` or manually
4. **Set up automatic builds** on version tags (if desired)

## 📝 Notes

- **IPA Format**: EAS Build automatically creates IPA files for production iOS builds
- **Build Time**: Typically 15-30 minutes
- **Storage**: Builds are stored in EAS for 30 days (free tier)
- **Versioning**: `autoIncrement: true` in `eas.json` handles version bumps automatically

## 🆘 Need Help?

If you encounter issues:
1. Check the GitHub Actions logs
2. Check EAS Build dashboard for detailed logs
3. Verify all secrets are set correctly
4. Make sure your Expo account has build credits (or use GitHub Actions)

---

**Ready to build?** Go to GitHub Actions and click "Run workflow"! 🚀

