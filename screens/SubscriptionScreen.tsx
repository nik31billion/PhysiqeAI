import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRevenueCat } from '../utils/RevenueCatContext';
import { 
  extractSubscriptionInfo, 
  formatSubscriptionDate, 
  getSubscriptionStatusColor, 
  getSubscriptionStatusText,
  formatRelativeTime,
  SubscriptionInfo,
  getSubscriptionBenefits,
  getDaysUntilRenewal,
  isSubscriptionExpiringSoon
} from '../utils/subscriptionService';

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { customerInfo, isProUser, loading: contextLoading, restorePurchases } = useRevenueCat();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (customerInfo) {
      const info = extractSubscriptionInfo(customerInfo);
      setSubscriptionInfo(info);
    }
  }, [customerInfo]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const restoredInfo = await restorePurchases();
      if (restoredInfo) {
        const info = extractSubscriptionInfo(restoredInfo);
        setSubscriptionInfo(info);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription (change plan, cancel, etc.), you\'ll need to go through your device\'s subscription settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            const url = Platform.OS === 'ios' 
              ? 'https://apps.apple.com/account/subscriptions'
              : 'https://play.google.com/store/account/subscriptions';
            
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Could not open subscription settings. Please go to your device settings manually.');
            });
          }
        }
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out Flex Aura - the AI-powered fitness coach that helps you achieve your fitness goals! 💪',
        url: 'https://flexaura.fit/', // Replace with your actual app URL
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with your subscription or the app? We\'re here to help!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            Linking.openURL('mailto:info@aplotictech.com?subject=Flex Aura Subscription Support');
          }
        }
      ]
    );
  };

  const benefits = getSubscriptionBenefits(isProUser);
  const daysUntilRenewal = subscriptionInfo?.renewalDate ? getDaysUntilRenewal(subscriptionInfo.renewalDate) : null;
  const isExpiringSoon = subscriptionInfo?.renewalDate ? isSubscriptionExpiringSoon(subscriptionInfo.renewalDate) : false;

  return (
    <LinearGradient
      colors={['#e7f8f4', '#fce7e3']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#937AFD" />
          ) : (
            <Ionicons name="refresh" size={20} color="#937AFD" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {contextLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#937AFD" />
              <Text style={styles.loadingText}>Loading subscription details...</Text>
            </View>
          ) : (
            <>
              {/* Subscription Status */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Ionicons name="diamond" size={32} color="#937AFD" />
                  <Text style={styles.statusTitle}>
                    {isProUser ? 'Flex Aura Pro' : 'Flex Aura Free'}
                  </Text>
                </View>
                
                {subscriptionInfo && isProUser ? (
                  <View style={styles.subscriptionDetails}>
                    <View style={[styles.statusBadge, { backgroundColor: getSubscriptionStatusColor(subscriptionInfo.status) + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: getSubscriptionStatusColor(subscriptionInfo.status) }]} />
                      <Text style={[styles.statusText, { color: getSubscriptionStatusColor(subscriptionInfo.status) }]}>
                        {getSubscriptionStatusText(subscriptionInfo.status)}
                      </Text>
                    </View>
                    
                    {subscriptionInfo.renewalDate && (
                      <Text style={styles.renewalText}>
                        {subscriptionInfo.willRenew ? 'Renews' : 'Expires'} {formatRelativeTime(subscriptionInfo.renewalDate)}
                      </Text>
                    )}
                    
                    {isExpiringSoon && (
                      <View style={styles.warningBanner}>
                        <Ionicons name="warning" size={16} color="#F59E0B" />
                        <Text style={styles.warningText}>
                          Expires in {daysUntilRenewal} days
                        </Text>
                      </View>
                    )}
                  </View>
                ) : !isProUser ? (
                  <View style={styles.upgradePrompt}>
                    <Text style={styles.upgradeText}>
                      Upgrade to Pro for unlimited access to all features
                    </Text>
                    <TouchableOpacity style={styles.upgradeButton}>
                      <LinearGradient
                        colors={['#937AFD', '#b99bce']}
                        style={styles.upgradeButtonGradient}
                      >
                        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Subscription Details */}
              {subscriptionInfo && isProUser && (
                <View style={styles.detailsCard}>
                  <Text style={styles.cardTitle}>Subscription Details</Text>
                  
                  <View style={styles.detailsList}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Plan</Text>
                      <Text style={styles.detailValue}>{subscriptionInfo.title}</Text>
                    </View>
                    
                    {subscriptionInfo.billingPeriod && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Billing</Text>
                        <Text style={styles.detailValue}>{subscriptionInfo.billingPeriod}</Text>
                      </View>
                    )}
                    
                    {subscriptionInfo.purchaseDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Started</Text>
                        <Text style={styles.detailValue}>
                          {formatSubscriptionDate(subscriptionInfo.purchaseDate)}
                        </Text>
                      </View>
                    )}
                    
                    {subscriptionInfo.renewalDate && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          {subscriptionInfo.willRenew ? 'Next Renewal' : 'Expires'}
                        </Text>
                        <Text style={styles.detailValue}>
                          {formatSubscriptionDate(subscriptionInfo.renewalDate)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Auto-Renewal</Text>
                      <View style={styles.renewalStatus}>
                        <Ionicons 
                          name={subscriptionInfo.willRenew ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={subscriptionInfo.willRenew ? "#10B981" : "#EF4444"} 
                        />
                        <Text style={[styles.detailValue, { 
                          color: subscriptionInfo.willRenew ? "#10B981" : "#EF4444",
                          marginLeft: 4 
                        }]}>
                          {subscriptionInfo.willRenew ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Benefits */}
              <View style={styles.benefitsCard}>
                <Text style={styles.cardTitle}>
                  {isProUser ? 'Your Benefits' : 'Pro Benefits'}
                </Text>
                <View style={styles.benefitsList}>
                  {benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Ionicons 
                        name={isProUser ? "checkmark-circle" : "diamond-outline"} 
                        size={16} 
                        color={isProUser ? "#10B981" : "#937AFD"} 
                      />
                      <Text style={[styles.benefitText, { 
                        color: isProUser ? "#232323" : "#6B7280" 
                      }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsCard}>
                <Text style={styles.cardTitle}>Manage</Text>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleManageSubscription}>
                  <View style={styles.actionInfo}>
                    <Ionicons name="settings-outline" size={20} color="#937AFD" />
                    <Text style={styles.actionLabel}>Subscription Settings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
                  <View style={styles.actionInfo}>
                    <Ionicons name="refresh-outline" size={20} color="#10B981" />
                    <Text style={styles.actionLabel}>Restore Purchases</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.actionButton} onPress={handleShareApp}>
                  <View style={styles.actionInfo}>
                    <Ionicons name="share-outline" size={20} color="#6B7280" />
                    <Text style={styles.actionLabel}>Share Flex Aura</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
                  <View style={styles.actionInfo}>
                    <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                    <Text style={styles.actionLabel}>Contact Support</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232323',
    marginTop: 8,
  },
  subscriptionDetails: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  renewalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 6,
  },
  upgradePrompt: {
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 16,
  },
  detailsList: {
    // Container for details
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#232323',
    fontWeight: '600',
  },
  renewalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  benefitsList: {
    // Container for benefits
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    color: '#232323',
    marginLeft: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
});

export default SubscriptionScreen;
