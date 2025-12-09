# Testing on Physical Device via USB

## Android Testing

### Prerequisites
1. **Enable Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options

2. **Enable USB Debugging**:
   - In Developer Options, enable "USB Debugging"
   - Enable "Install via USB" (if available)

3. **Connect Phone via USB**:
   - Connect your phone to your computer with a USB cable
   - On your phone, when prompted, tap "Allow USB Debugging" and check "Always allow from this computer"

4. **Verify Connection**:
   ```bash
   adb devices
   ```
   You should see your device listed.

### Run the App

**Option 1: Using Expo Dev Client (Recommended)**
```bash
npm start
# Then press 'a' to open on Android device
```

**Option 2: Direct Android Build**
```bash
npm run android
```

**Option 3: Using Expo Go (if you have it installed)**
```bash
npm start
# Scan QR code with Expo Go app
```

---

## iOS Testing

### Prerequisites
1. **Install Xcode** (macOS only):
   - Download from App Store
   - Install Command Line Tools: `xcode-select --install`

2. **Connect iPhone via USB**:
   - Connect your iPhone to your Mac
   - On iPhone: Settings → General → VPN & Device Management → Trust your computer

3. **Configure in Xcode**:
   - Open Xcode → Preferences → Accounts
   - Add your Apple ID
   - In your project, select your device as the target

### Run the App

**Option 1: Using Expo Dev Client**
```bash
npm start
# Then press 'i' to open on iOS device
```

**Option 2: Direct iOS Build**
```bash
npm run ios
```

---

## Testing the Performance Improvements

### What to Test:

1. **App Launch Speed**:
   - Close the app completely
   - Reopen the app
   - ✅ Should load instantly (no 2-3 second delay)
   - Calories should appear immediately

2. **Meal Completion**:
   - Go to Plan Screen → Meals tab
   - Mark a meal as complete
   - ✅ Calories should update instantly (no 1-2 second delay)
   - Go back to Home Screen
   - ✅ Calories should reflect the change immediately

3. **Aura Updates**:
   - Complete a meal or exercise
   - ✅ Aura points should update instantly
   - Check Aura display (if visible)
   - ✅ Should show updated values immediately

4. **Offline Testing**:
   - Turn off WiFi/Mobile Data
   - Open the app
   - ✅ Should still show cached calories and data
   - Complete a meal
   - ✅ Should update instantly (will sync when online)

5. **Daily Reset**:
   - Wait until midnight (or change phone date)
   - Open the app
   - ✅ Calories should reset for new day
   - ✅ Cache should load new day's data

### Debugging Tips:

**Check if stores are working:**
- Add console logs in `caloriesStore.ts`:
  ```typescript
  console.log('Calories loaded from cache:', data);
  ```

**Monitor AsyncStorage:**
- Use React Native Debugger or Flipper
- Check AsyncStorage keys: `calories_store_*` and `aura_store_*`

**Check Network Calls:**
- Open Chrome DevTools → Network tab
- Should see fewer Supabase calls
- Calls should happen in background (non-blocking)

---

## Troubleshooting

### Android: Device Not Detected
```bash
# Restart ADB
adb kill-server
adb start-server
adb devices
```

### Android: "Unable to install" error
- Check if USB Debugging is enabled
- Try different USB cable
- Enable "Install via USB" in Developer Options

### iOS: Build Errors
- Make sure you're on macOS
- Check Xcode is properly installed
- Verify your Apple ID is added in Xcode

### App Not Loading
- Clear cache: `npm start -- --clear`
- Rebuild dev client: `npx expo prebuild --clean`
- Check Metro bundler is running

---

## Quick Test Commands

```bash
# Start Expo
npm start

# For Android (press 'a' after npm start)
# OR run directly:
npm run android

# For iOS (press 'i' after npm start)  
# OR run directly:
npm run ios

# Clear cache if issues
npm start -- --clear
```

---

## Performance Comparison

### Before (Old Behavior):
- App opens → 2-3 second wait → Calories appear
- Mark meal complete → 1-2 second wait → Calories update

### After (With Zustand):
- App opens → **Instant** → Calories appear immediately
- Mark meal complete → **Instant** → Calories update immediately

You should notice the difference immediately! 🚀

