import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface DebugInfo {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
}

const ProductionDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);

  useEffect(() => {
    // Capture unhandled errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('PRODUCTION ERROR')) {
        setDebugInfo(prev => [...prev, {
          timestamp: new Date().toISOString(),
          error: errorMessage,
          stack: args[1]?.stack,
          componentStack: args[1]?.componentStack
        }]);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  if (__DEV__ || debugInfo.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Production Debug Info</Text>
      <ScrollView style={styles.scrollView}>
        {debugInfo.map((info, index) => (
          <View key={index} style={styles.debugItem}>
            <Text style={styles.timestamp}>{info.timestamp}</Text>
            <Text style={styles.error}>{info.error}</Text>
            {info.stack && (
              <Text style={styles.stack}>Stack: {info.stack}</Text>
            )}
            {info.componentStack && (
              <Text style={styles.componentStack}>Component: {info.componentStack}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  debugItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  timestamp: {
    color: '#00ff00',
    fontSize: 12,
    marginBottom: 5,
  },
  error: {
    color: '#ff0000',
    fontSize: 14,
    marginBottom: 5,
  },
  stack: {
    color: '#ffff00',
    fontSize: 10,
    marginBottom: 5,
  },
  componentStack: {
    color: '#00ffff',
    fontSize: 10,
  },
});

export default ProductionDebugger;
