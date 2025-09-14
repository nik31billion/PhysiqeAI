import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingErrorHandlerProps {
  error: string | null;
  loading: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const OnboardingErrorHandler: React.FC<OnboardingErrorHandlerProps> = ({
  error,
  loading,
  onRetry,
  children,
}) => {
  // Don't show loading screen - let data saving happen silently in background
  // if (loading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <LinearGradient
  //         colors={['#B9F3E4', '#E0D9F7']}
  //         style={styles.background}
  //         start={{ x: 0, y: 0 }}
  //         end={{ x: 1, y: 1 }}
  //       />
  //       <View style={styles.loadingContent}>
  //         <ActivityIndicator size="large" color="#937AFD" />
  //         <Text style={styles.loadingText}>Saving your progress...</Text>
  //       </View>
  //     </View>
  //   );
  // }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#B9F3E4', '#E0D9F7']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <LinearGradient
                colors={['#FFF9CA', '#F5C6EC']}
                style={styles.retryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    position: 'relative',
  },
  errorContainer: {
    flex: 1,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#937AFD',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    borderRadius: 22,
    shadowColor: '#F5C6EC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 198, 236, 0.4)',
  },
  retryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 21,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.2,
  },
});
