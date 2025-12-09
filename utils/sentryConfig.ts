/**
 * Sentry Error Tracking Configuration
 * 
 * This file initializes Sentry for error tracking and performance monitoring.
 * 
 * To set up Sentry:
 * 1. Create a project at https://sentry.io
 * 2. Get your DSN (Data Source Name) from the project settings
 * 3. Replace 'YOUR_SENTRY_DSN' below with your actual DSN
 * 4. Or set it as an environment variable: EXPO_PUBLIC_SENTRY_DSN
 */

import { Platform } from 'react-native';

// Import Sentry - use try/catch to handle bundling issues gracefully
let Sentry: any = null;
try {
  Sentry = require('@sentry/react-native');
} catch (error) {
  console.warn('⚠️ Sentry package not available:', error);
}

// Get DSN from environment variable or use placeholder
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'YOUR_SENTRY_DSN';

/**
 * Initialize Sentry
 * Call this function at the very start of your app (before any other code)
 */
export function initSentry() {
  // Don't initialize Sentry if DSN is not set (development mode)
  if (!SENTRY_DSN || SENTRY_DSN === 'YOUR_SENTRY_DSN') {
    if (__DEV__) {
      console.log('⚠️ Sentry not initialized - DSN not configured');
      console.log('📝 To enable Sentry:');
      console.log('   1. Create project at https://sentry.io');
      console.log('   2. Get your DSN from project settings');
      console.log('   3. Set EXPO_PUBLIC_SENTRY_DSN environment variable');
      console.log('   4. Or replace YOUR_SENTRY_DSN in utils/sentryConfig.ts');
    }
    return;
  }

  // Check if Sentry is available
  if (!Sentry || !Sentry.init) {
    console.warn('⚠️ Sentry not available - skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      
      // Environment
      environment: __DEV__ ? 'development' : 'production',
      
      // Enable debug mode in development only
      debug: __DEV__,
      
      // Performance monitoring
      enableAutoSessionTracking: true,
      
      // Sample rates (0.0 to 1.0)
      tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in production
      profilesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in production
      
      // Native crash reporting
      enableNativeCrashHandling: true,
      enableNative: true,
      
      // Filter out common non-critical errors
      beforeSend(event: any, hint: any) {
        // Don't send errors in development (to avoid flooding Sentry with dev errors)
        if (__DEV__) {
          // Still log to console in dev for debugging
          console.log('📊 [Sentry] Error captured (not sent in dev):', event.message);
          return null; // Don't send to Sentry in dev
        }
        
        // Filter out specific errors if needed
        const error = hint.originalException;
        if (error instanceof Error) {
          // Filter out RevenueCat customLogHandler errors (we already handle these)
          if (error.message.includes('customLogHandler')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Filter breadcrumbs
      beforeBreadcrumb(breadcrumb: any) {
        // Don't send breadcrumbs in development
        if (__DEV__) {
          return null;
        }
        return breadcrumb;
      },
    });

    if (__DEV__) {
      console.log('✅ Sentry initialized successfully (dev mode - errors not sent)');
    } else {
      console.log('✅ Sentry initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    console.warn('⚠️ App will continue without error tracking');
    // Don't crash the app if Sentry initialization fails
  }
}

// Check if Sentry is available before using it
function isSentryAvailable(): boolean {
  return Sentry !== null && typeof Sentry !== 'undefined';
}

/**
 * Set user context for error tracking
 * Call this when user logs in
 */
export function setSentryUser(user: { id: string; email?: string | null; subscriptionStatus?: string }) {
  if (!isSentryAvailable()) return;
  try {
    Sentry.setUser({
      id: user.id,
      email: user.email || undefined,
      // Add custom tags
      subscription_status: user.subscriptionStatus || 'free',
    });
  } catch (error) {
    console.error('Failed to set Sentry user:', error);
  }
}

/**
 * Clear user context
 * Call this when user logs out
 */
export function clearSentryUser() {
  if (!isSentryAvailable()) return;
  try {
    Sentry.setUser(null);
  } catch (error) {
    console.error('Failed to clear Sentry user:', error);
  }
}

/**
 * Add breadcrumb for debugging
 * Use this to track user actions leading up to errors
 */
export function addBreadcrumb(message: string, category: string = 'custom', data?: Record<string, any>) {
  if (!isSentryAvailable()) return;
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    // Silently fail - breadcrumbs are not critical
  }
}

/**
 * Capture an exception manually
 * Use this for non-fatal errors you want to track
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!isSentryAvailable()) return;
  try {
    if (context) {
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } catch (err) {
    // Silently fail - error tracking should never break the app
    if (__DEV__) {
      console.error('Failed to capture exception:', err);
    }
  }
}

/**
 * Capture a message manually
 * Use this for tracking important events (not errors)
 */
export function captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info', context?: Record<string, any>) {
  if (!isSentryAvailable()) return;
  try {
    if (context) {
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  } catch (error) {
    // Silently fail
    console.error('Failed to capture message:', error);
  }
}

/**
 * Start a transaction for performance monitoring
 * Use this to track slow operations
 * Returns a transaction object with finish, setTag, setData, startChild methods
 * 
 * Performance thresholds:
 * - < 1s: Fast (green)
 * - 1-3s: Normal (yellow)
 * - 3-5s: Slow (orange)
 * - > 5s: Very Slow (red) - will be reported to Sentry
 */
export function startTransaction(name: string, op: string = 'custom') {
  if (!isSentryAvailable()) {
    // Fallback: simple timing without Sentry
    const startTime = Date.now();
    return {
      finish: () => {
        const duration = Date.now() - startTime;
        if (__DEV__) {
          console.log(`[Performance] ${name} (${op}) took ${duration}ms`);
        }
      },
      setTag: () => {},
      setData: () => {},
      startChild: () => ({
        finish: () => {},
        setTag: () => {},
        setData: () => {},
      }),
    };
  }

  // For React Native Sentry, we'll use a simpler approach
  // The startTransaction API may not be available in all versions
  // We'll track performance manually and report slow operations
  const startTime = Date.now();
  const tags: Record<string, string> = {};
  const data: Record<string, any> = {};
  const children: Array<{ name: string; op: string; startTime: number }> = [];
  
  return {
    finish: () => {
      const duration = Date.now() - startTime;
      
      // Log performance data
      if (__DEV__) {
        const threshold = duration < 1000 ? '✅ Fast' : 
                         duration < 3000 ? '⚠️ Normal' : 
                         duration < 5000 ? '🔶 Slow' : '🔴 Very Slow';
        console.log(`[Sentry Performance] ${name} (${op}) took ${duration}ms ${threshold}`);
      }
      
      // Report slow operations (>5s) to Sentry
      if (duration > 5000) {
        captureMessage(
          `Slow operation detected: ${name} took ${duration}ms`,
          'warning',
          {
            performance: {
              operation: name,
              op,
              duration_ms: duration,
              threshold: 'very_slow',
              tags,
              data,
            },
          }
        );
      }
      
      // Add breadcrumb for performance tracking
      addBreadcrumb(`Performance: ${name}`, 'performance', {
        operation: name,
        op,
        duration_ms: duration,
        ...tags,
        ...data,
      });
    },
    setTag: (key: string, value: string) => {
      tags[key] = value;
      if (__DEV__) {
        console.log(`[Sentry Tag] ${name}: ${key} = ${value}`);
      }
    },
    setData: (key: string, value: any) => {
      data[key] = value;
      if (__DEV__) {
        console.log(`[Sentry Data] ${name}: ${key} = ${JSON.stringify(value)}`);
      }
    },
    startChild: (childName: string, childOp: string = 'custom') => {
      const childStartTime = Date.now();
      const childIndex = children.length;
      children.push({ name: childName, op: childOp, startTime: childStartTime });
      
      return {
        finish: () => {
          const childDuration = Date.now() - childStartTime;
          if (__DEV__) {
            console.log(`[Sentry Performance] ${name} > ${childName} took ${childDuration}ms`);
          }
          
          // Add breadcrumb for child operation
          addBreadcrumb(`Performance: ${name} > ${childName}`, 'performance', {
            parent: name,
            operation: childName,
            op: childOp,
            duration_ms: childDuration,
          });
        },
        setTag: (key: string, value: string) => {
          // Store child tags in parent data
          data[`${childName}_${key}`] = value;
        },
        setData: (key: string, value: any) => {
          // Store child data in parent data
          data[`${childName}_${key}`] = value;
        },
      };
    },
  };
}

// Export Sentry instance for advanced usage
export { Sentry };

