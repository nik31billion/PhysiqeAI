import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRevenueCat } from '../utils/RevenueCatContext';
import { useAuth } from '../utils/AuthContext';

const RevenueCatTestScreen: React.FC = () => {
  const { 
    offerings, 
    fetchOfferings, 
    loading, 
    customerInfo, 
    isProUser, 
    restorePurchases 
  } = useRevenueCat();
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Auto-fetch offerings when screen loads
    if (!offerings) {
      fetchOfferings();
    }
  }, []);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    addTestResult('Starting RevenueCat integration tests...');

    // Test 1: Check if user is authenticated
    if (user) {
      addTestResult(`✅ User authenticated: ${user.id}`);
    } else {
      addTestResult('❌ No user authenticated');
      return;
    }

    // Test 2: Check if customer info is available
    if (customerInfo) {
      addTestResult(`✅ Customer info loaded`);
      addTestResult(`   - Original App User ID: ${customerInfo.originalAppUserId}`);
      addTestResult(`   - Is Pro User: ${isProUser}`);
      addTestResult(`   - Active Entitlements: ${Object.keys(customerInfo.entitlements.active).length}`);
    } else {
      addTestResult('❌ No customer info available');
    }

    // Test 3: Fetch offerings
    try {
      addTestResult('🔄 Fetching offerings...');
      await fetchOfferings();
      
      if (offerings) {
        addTestResult(`✅ Offerings fetched successfully`);
        addTestResult(`   - Current offerings available: ${offerings.current ? 'Yes' : 'No'}`);
        
        if (offerings.current) {
          const packageKeys = Object.keys(offerings.current);
          addTestResult(`   - Available packages: ${packageKeys.join(', ')}`);
          
          // Check specific packages
          if (offerings.current.monthly) {
            addTestResult(`   - Monthly package: ${offerings.current.monthly.product.priceString}`);
          }
          if (offerings.current.annual) {
            addTestResult(`   - Annual package: ${offerings.current.annual.product.priceString}`);
          }
        }
      } else {
        addTestResult('❌ Offerings fetch returned null');
      }
    } catch (error) {
      addTestResult(`❌ Error fetching offerings: ${error}`);
    }

    // Test 4: Test restore purchases (safe to call)
    try {
      addTestResult('🔄 Testing restore purchases...');
      const restoredInfo = await restorePurchases();
      if (restoredInfo) {
        addTestResult('✅ Restore purchases completed');
      } else {
        addTestResult('⚠️ Restore purchases returned null');
      }
    } catch (error) {
      addTestResult(`❌ Error restoring purchases: ${error}`);
    }

    addTestResult('✅ All tests completed!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>RevenueCat Integration Test</Text>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading RevenueCat...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Status</Text>
        <Text style={styles.statusText}>User ID: {user?.id || 'Not logged in'}</Text>
        <Text style={styles.statusText}>Is Pro User: {isProUser ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Offerings Loaded: {offerings ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Customer Info: {customerInfo ? 'Available' : 'Not available'}</Text>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={runTests}>
        <Text style={styles.testButtonText}>Run Integration Tests</Text>
      </TouchableOpacity>

      {offerings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raw Offerings Data</Text>
          <ScrollView style={styles.codeContainer} horizontal>
            <Text style={styles.codeText}>
              {JSON.stringify(offerings, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}

      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <ScrollView style={styles.resultsContainer}>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  codeContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    padding: 10,
    maxHeight: 200,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#333',
  },
  resultsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    padding: 10,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 2,
    color: '#333',
    fontFamily: 'Courier',
  },
});

export default RevenueCatTestScreen;
