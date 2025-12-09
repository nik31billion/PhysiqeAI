// Initialize Sentry FIRST - before any other imports
import { initSentry, captureException } from './utils/sentryConfig';
initSentry();

// Set up global error handlers AFTER Sentry is initialized
// This catches errors that happen outside of React components
if (typeof ErrorUtils !== 'undefined') {
  const originalGlobalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    // Capture in Sentry
    captureException(error, {
      globalErrorHandler: {
        isFatal: isFatal || false,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });
    
    // Call original handler if it exists
    if (originalGlobalHandler) {
      originalGlobalHandler(error, isFatal);
    }
  });
}

// Catch unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalUnhandledRejection = global.onunhandledrejection;
  global.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    // Capture in Sentry
    captureException(error, {
      unhandledRejection: {
        reason: String(event.reason),
        promise: event.promise?.toString(),
      },
    });
    
    // Call original handler if it exists
    if (originalUnhandledRejection && typeof originalUnhandledRejection === 'function') {
      try {
        (originalUnhandledRejection as any)(event);
      } catch (e) {
        // Ignore errors in original handler
      }
    }
  };
}

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppNavigator } from './navigation';
import { AuthProvider } from './utils/AuthContext';
import { OnboardingProvider } from './utils/OnboardingContext';
import { NotificationProvider } from './utils/NotificationContext';
import { RevenueCatProvider } from './utils/RevenueCatContext';
import { PlanGenerationProvider } from './utils/PlanGenerationContext';
import { AnalyticsProvider } from './utils/AnalyticsContext';
import NotificationManager from './components/NotificationManager';
import ProductionDebugger from './components/ProductionDebugger';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log detailed error information for debugging
    console.error('Error Stack:', error.stack);
    console.error('Error Info:', JSON.stringify(errorInfo, null, 2));
    
    // Capture error in Sentry with context
    captureException(error, {
      errorBoundary: {
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });
    
    // Store error for debugging (in production)
    if (!__DEV__) {
      // You can send this to a crash reporting service
      console.error('PRODUCTION ERROR:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Prevent console logging errors in production
if (__DEV__) {
  // In development, keep normal console behavior
} else {
  // In production, prevent console errors from crashing the app
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args) => {
    // Filter out RevenueCat customLogHandler errors
    const message = args[0];
    if (typeof message === 'string' && message.includes('customLogHandler')) {
      return; // Ignore this specific error
    }
    originalConsoleError.apply(console, args);
  };

  // Reduce console output in production
  console.log = (...args) => {
    // Only log critical messages in production
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('ERROR') || 
      message.includes('CRITICAL') || 
      message.includes('Failed') ||
      message.includes('Successfully')
    )) {
      originalConsoleLog.apply(console, args);
    }
  };

  console.warn = (...args) => {
    // Only log critical warnings in production
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('CRITICAL') || 
      message.includes('timeout')
    )) {
      originalConsoleWarn.apply(console, args);
    }
  };
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* Initialize Firebase Analytics first */}
      <AnalyticsProvider>
        <AuthProvider>
          <ErrorBoundary>
            <RevenueCatProvider>
              <ErrorBoundary>
                <OnboardingProvider>
                  <ErrorBoundary>
                    <PlanGenerationProvider>
                      <ErrorBoundary>
                        <NotificationProvider>
                          <ErrorBoundary>
                            <NotificationManager>
                              <AppNavigator />
                              <ProductionDebugger />
                            </NotificationManager>
                          </ErrorBoundary>
                        </NotificationProvider>
                      </ErrorBoundary>
                    </PlanGenerationProvider>
                  </ErrorBoundary>
                </OnboardingProvider>
              </ErrorBoundary>
            </RevenueCatProvider>
          </ErrorBoundary>
        </AuthProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B9F3E4',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#937AFD',
    textAlign: 'center',
    fontWeight: '600',
  },
});
