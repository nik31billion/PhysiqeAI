// Google Auth Configuration
// Replace these with your actual Google OAuth Client IDs from Google Cloud Console

export const GOOGLE_AUTH_CONFIG = {
  // Android Client ID (from Google Cloud Console - Production with App Signing SHA-1)
  androidClientId: '249953575983-90a9duhkv30kmk7n0gr0qf7cfvuv53i9.apps.googleusercontent.com',
  
  // iOS Client ID (from Google Cloud Console)  
  iosClientId: '249953575983-3kf0p4urs0mijvclro29j59ec7t6n5g3.apps.googleusercontent.com',
  
  // Web Client ID (from Google Cloud Console - used for Supabase)
  webClientId: '249953575983-bo1pe9j79l0m1tv4cok7s69hc46cqq39.apps.googleusercontent.com',
};

// Instructions:
// 1. Go to Google Cloud Console → Credentials
// 2. Copy the Client IDs from your Android, iOS, and Web OAuth clients
// 3. Replace the placeholder values above with your actual Client IDs
// 4. Make sure to keep the .apps.googleusercontent.com suffix
