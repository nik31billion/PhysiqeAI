# GitHub Actions iOS Build - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Expo Token
```bash
# Go to: https://expo.dev/accounts/nikunjtulsyan/settings/access-tokens
# Create new token → Copy it
```

### 2. Add GitHub Secrets
Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these 3 secrets:
- `EXPO_TOKEN` - Your Expo access token
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### 3. Push to GitHub
```bash
git add .github/workflows/
git commit -m "Add iOS build workflow"
git push origin main
```

### 4. Run Workflow
1. Go to **Actions** tab in GitHub
2. Select **iOS Production Build (Simple)**
3. Click **Run workflow**
4. Wait 15-30 minutes
5. Download IPA from [EAS Dashboard](https://expo.dev/accounts/nikunjtulsyan/projects/flex-aura/builds)

## ✅ IPA Format Confirmed

- ✅ EAS Build **automatically creates IPA** for production iOS builds
- ✅ IPA is the **correct format** for App Store submission
- ✅ No additional conversion needed

## 📱 Submit to App Store

After build completes:
```bash
cd PhysiqeAI
eas submit --platform ios --latest
```

Or download IPA and upload manually via App Store Connect.

## 📖 Full Guide

See `GITHUB_ACTIONS_IOS_SETUP.md` for detailed instructions.

