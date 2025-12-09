# Local iOS Build - Quick Start Checklist

## ✅ Step-by-Step Setup (5 minutes)

### Step 1: Get Your Apple Team ID

1. Go to: https://developer.apple.com/account
2. Sign in
3. Copy your **Team ID** from top right (10 characters, e.g., `DAX56C9A62`)

### Step 2: Configure iOS Credentials (One-Time)

Run this command **on your local machine** (not in GitHub Actions):

```bash
cd PhysiqeAI
eas credentials --platform ios
```

**What this does:**
- Guides you through setting up certificates
- Stores them securely in EAS
- **Does NOT use build credits** - just stores credentials

**Choose these options when prompted:**
- Credential management: **"Local credentials"** or **"Let EAS manage"**
- Follow the prompts to set up your certificates

### Step 3: Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these 4 secrets:

| Secret | Value |
|--------|-------|
| `EXPO_TOKEN` | Get from: https://expo.dev/accounts/nikunjtulsyan/settings/access-tokens |
| `APPLE_TEAM_ID` | Your Team ID from Step 1 |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 4: Push and Build

```bash
git add .github/workflows/ios-build-local.yml
git commit -m "Add local iOS build workflow"
git push origin main
```

Then:
1. Go to **Actions** tab
2. Select **iOS Production Build (Local - No EAS Credits)**
3. Click **Run workflow**
4. Wait 20-40 minutes
5. Download IPA from artifacts

## 🎯 That's It!

The workflow will:
- ✅ Build locally (no EAS credits used)
- ✅ Create IPA file
- ✅ Upload as artifact for download

## ⚠️ Important Notes

1. **First-time setup**: You MUST run `eas credentials --platform ios` once on your local machine
2. **Code signing**: Uses automatic signing with your Team ID
3. **Build time**: 20-40 minutes (uses GitHub Actions minutes)
4. **Free tier**: ~6 builds/month on GitHub Actions free tier

## 🆘 Troubleshooting

### "No credentials found"
→ Run `eas credentials --platform ios` on your local machine first

### "Code signing failed"
→ Verify your `APPLE_TEAM_ID` secret is correct

### "Scheme not found"
→ The workflow auto-detects the scheme (usually `flex-aura`)

## 📱 After Build

Download the IPA and submit:
```bash
eas submit --platform ios --path /path/to/your-app.ipa
```

Or upload manually via App Store Connect.

---

**Ready?** Start with Step 1! 🚀

