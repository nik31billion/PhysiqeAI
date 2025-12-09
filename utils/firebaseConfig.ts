import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';

/**
 * Firebase Configuration for React Native (Production)
 * Using @react-native-firebase SDK for native iOS/Android apps
 * 
 * Config files needed:
 * - Android: google-services.json in PhysiqeAI/google-services.json
 * - iOS: GoogleService-Info.plist in PhysiqeAI/GoogleService-Info.plist
 * 
 * These are automatically configured via app.json
 */

let isInitialized = false;

/**
 * Initialize Firebase
 * This is called automatically when the app starts
 */
export const initializeFirebase = async (): Promise<any> => {
  try {
    // Firebase auto-initializes in React Native when config files are present
    // Just need to verify it's working
    
    if (isInitialized) {
      console.log('✅ Firebase already initialized');
      return firebase;
    }

    console.log('🚀 Initializing Firebase...');
    
    // Check if Firebase is initialized
    if (firebase.apps.length > 0) {
      console.log('✅ Firebase initialized successfully');
      console.log('📱 Firebase app name:', firebase.app().name);
      isInitialized = true;
      return firebase;
    }
    
    console.warn('⚠️ Firebase not auto-initialized. Make sure google-services.json and GoogleService-Info.plist are in place.');
    return null;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return null;
  }
};

/**
 * Get Firebase Analytics instance
 */
export const getAnalytics = () => {
  return analytics();
};

/**
 * Check if Firebase is initialized and ready
 */
export const isFirebaseReady = (): boolean => {
  return isInitialized || firebase.apps.length > 0;
};

export { analytics };
export default { initializeFirebase, getAnalytics, isFirebaseReady, analytics };
