import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '../utils/RevenueCatContext';
import { 
  extractSubscriptionInfo, 
  formatSubscriptionDate, 
  getSubscriptionStatusColor, 
  getSubscriptionStatusText,
  formatRelativeTime,
  SubscriptionInfo 
} from '../utils/subscriptionService';
import Purchases, { CustomerInfo, EntitlementInfo } from 'react-native-purchases';

interface SubscriptionManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToFullScreen?: () => void;
}

// Using SubscriptionInfo from subscriptionService instead of local interface

export const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  visible,
  onClose,
  onNavigateToFullScreen,
}) => {
  const { customerInfo, isProUser, loading: contextLoading, restorePurchases } = useRevenueCat();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Extract subscription details from customerInfo
  useEffect(() => {
    if (customerInfo && visible) {
      extractSubscriptionDetails();
    }
  }, [customerInfo, visible]);

  const extractSubscriptionDetails = () => {
    const details = extractSubscriptionInfo(customerInfo);
    setSubscriptionDetails(details);
  };

  // Helper functions are now imported from subscriptionService

  const handleRestorePurchases = async () => {
    setRefreshing(true);
    try {
      const restoredInfo = await restorePurchases();
      if (restoredInfo) {
        Alert.alert(
          'Purchases Restored',
          'Your purchases have been successfully restored.',
          [{ text: 'OK' }]
        );
        // Refresh subscription details
        setTimeout(extractSubscriptionDetails, 500);
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, you\'ll be redirected to your device\'s subscription settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            // For iOS, open App Store subscription settings
            // For Android, open Google Play subscription settings
            const subscriptionUrl = Platform.OS === 'ios' 
              ? 'https://apps.apple.com/account/subscriptions'
              : 'https://play.google.com/store/account/subscriptions';
            
            Linking.openURL(subscriptionUrl).catch(() => {
              Alert.alert('Error', 'Could not open subscription settings.');
            });
          }
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: confirmCancelSubscription
        },
      ]
    );
  };

  const confirmCancelSubscription = () => {
    Alert.alert(
      'Redirect to Settings',
      'To cancel your subscription, you need to do so through your device\'s subscription settings. We\'ll redirect you there now.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Go to Settings', 
          onPress: () => {
            const subscriptionUrl = Platform.OS === 'ios' 
              ? 'https://apps.apple.com/account/subscriptions'
              : 'https://play.google.com/store/account/subscriptions';
            
            Linking.openURL(subscriptionUrl).catch(() => {
              Alert.alert('Error', 'Could not open subscription settings.');
            });
          }
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with your subscription? Our support team is here to help!\n\nEmail: info@aplotictech.com',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => {
            Linking.openURL('mailto:info@aplotictech.com?subject=Subscription Support - PhysiqeAI');
          },
        },
      ]
    );
  };

  // Status functions moved to subscriptionService

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient
        colors={['#e7f8f4', '#fce7e3']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#232323" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRestorePurchases}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#937AFD" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#937AFD" />
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
            ) : !isProUser ? (
              // No active subscription
              <View style={styles.noSubscriptionCard}>
                <Ionicons name="diamond-outline" size={48} color="#937AFD" />
                <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
                <Text style={styles.noSubscriptionText}>
                  You don't have an active premium subscription. Upgrade to unlock all premium features!
                </Text>
                {/* TODO: Re-enable when subscription functionality is ready */}
                {/* <TouchableOpacity style={styles.upgradeButton}>
                  <LinearGradient
                    colors={['#937AFD', '#b99bce']}
                    style={styles.upgradeButtonGradient}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity> */}
              </View>
            ) : subscriptionDetails ? (
              // Active subscription details
              <>
                {/* Subscription Status Card */}
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    <View style={styles.statusInfo}>
                      <Text style={styles.subscriptionTitle}>{subscriptionDetails.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getSubscriptionStatusColor(subscriptionDetails.status) + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: getSubscriptionStatusColor(subscriptionDetails.status) }]} />
                        <Text style={[styles.statusText, { color: getSubscriptionStatusColor(subscriptionDetails.status) }]}>
                          {getSubscriptionStatusText(subscriptionDetails.status)}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="diamond" size={24} color="#937AFD" />
                  </View>

                  {subscriptionDetails.isTrialPeriod && (
                    <View style={styles.trialBanner}>
                      <Ionicons name="time-outline" size={16} color="#F59E0B" />
                      <Text style={styles.trialText}>
                        Free trial ends on {formatSubscriptionDate(subscriptionDetails.trialEndDate)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Subscription Details */}
                <View style={styles.detailsCard}>
                  <Text style={styles.cardTitle}>Subscription Details</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan</Text>
                    <Text style={styles.detailValue}>{subscriptionDetails.title}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, { color: getSubscriptionStatusColor(subscriptionDetails.status) }]}>
                      {getSubscriptionStatusText(subscriptionDetails.status)}
                    </Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  {subscriptionDetails.purchaseDate && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Start Date</Text>
                        <Text style={styles.detailValue}>{formatSubscriptionDate(subscriptionDetails.purchaseDate)}</Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  )}
                  
                  {subscriptionDetails.renewalDate && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          {subscriptionDetails.willRenew ? 'Next Renewal' : 'Expires On'}
                        </Text>
                        <Text style={styles.detailValue}>{formatSubscriptionDate(subscriptionDetails.renewalDate)}</Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Auto-Renewal</Text>
                    <View style={styles.renewalStatus}>
                      <Ionicons 
                        name={subscriptionDetails.willRenew ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={subscriptionDetails.willRenew ? "#10B981" : "#EF4444"} 
                      />
                      <Text style={[styles.detailValue, { 
                        color: subscriptionDetails.willRenew ? "#10B981" : "#EF4444",
                        marginLeft: 4 
                      }]}>
                        {subscriptionDetails.willRenew ? 'On' : 'Off'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsCard}>
                  <Text style={styles.cardTitle}>Manage Subscription</Text>
                  
                  <TouchableOpacity style={styles.actionButton} onPress={handleManageSubscription}>
                    <View style={styles.actionInfo}>
                      <Ionicons name="settings-outline" size={20} color="#937AFD" />
                      <Text style={styles.actionLabel}>Manage Subscription</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
                  </TouchableOpacity>
                  
                  <View style={styles.divider} />
                  
                  <TouchableOpacity style={styles.actionButton} onPress={handleRestorePurchases}>
                    <View style={styles.actionInfo}>
                      <Ionicons name="refresh-outline" size={20} color="#10B981" />
                      <Text style={styles.actionLabel}>Restore Purchases</Text>
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
                  
                  {subscriptionDetails.status === 'active' && subscriptionDetails.willRenew && (
                    <>
                      <View style={styles.divider} />
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.dangerAction]} 
                        onPress={handleCancelSubscription}
                      >
                        <View style={styles.actionInfo}>
                          <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                          <Text style={[styles.actionLabel, styles.dangerText]}>Cancel Subscription</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            ) : (
              // Error state
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Could not load subscription details</Text>
                <Text style={styles.errorText}>Please check your internet connection and try again.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRestorePurchases}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
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
  closeButton: {
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  noSubscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  trialText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 6,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
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
  dangerAction: {
    // Additional styling for danger actions
  },
  dangerText: {
    color: '#EF4444',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#937AFD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SubscriptionManagementModal;
