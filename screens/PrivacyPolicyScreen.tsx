import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:info@aplotictech.com');
  };

  const handleWebsitePress = () => {
    // You can add your website URL here when available
    // Linking.openURL('https://yourwebsite.com');
  };

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Date Section - Simple */}
          <View style={styles.simpleDateSection}>
            <Text style={styles.simpleDateText}>Effective Date: 13th September 2025</Text>
            <Text style={styles.simpleDateText}>Last Updated: 13th September 2025</Text>
          </View>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.sectionText}>
              This Privacy Policy describes how Flex Aura Fitness App ("we," "our," or "us") collects, uses, and protects your personal information. Flex Aura is developed and operated by Aplotic Technologies Private Limited, located at:
            </Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>
                806, 8th Floor, Mahabir Tower{'\n'}
                Main Road, Ranchi, Ranchi G.P.O.{'\n'}
                Ranchi – 834001, Jharkhand, India
              </Text>
              <TouchableOpacity style={styles.emailButton} onPress={handleEmailPress}>
                <Ionicons name="mail" size={16} color="#ff6b6b" />
                <Text style={styles.emailText}>info@aplotictech.com</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionText}>
              By using Flex Aura, you agree to this Privacy Policy.
            </Text>
          </View>

          {/* Information We Collect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect the following information directly from you during onboarding and while using the app:
            </Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Personal Details</Text>
              <Text style={styles.infoText}>Name, email, age, gender</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Fitness Profile</Text>
              <Text style={styles.infoText}>
                Height, weight, body measurements, activity levels, fitness experience, goal weight, diet preferences, allergies, medical conditions (if any, for plan personalization), preferred meal timings, number of meals, preferred workout timing, motivational blockers
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>App Usage & Device Data</Text>
              <Text style={styles.infoText}>
                Device model, OS version, IP address, app version, usage events, crash logs, analytics data
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Health & Progress Data</Text>
              <Text style={styles.infoText}>
                Workout logs, meal plans, daily progress updates, progress photos, aura points earned
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Payment & Account Data</Text>
              <Text style={styles.infoText}>
                Subscription status, payment history (via RevenueCat), account credentials (passwords are hashed and not visible to us)
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Notifications & Preferences</Text>
              <Text style={styles.infoText}>
                Push notification tokens, preferences for reminders, and communications
              </Text>
            </View>

            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color="#ff6b6b" />
              <Text style={styles.warningText}>
                We do not knowingly collect data from children under 13. If you are under 16, use the app only with parental consent.
              </Text>
            </View>
          </View>

          {/* How We Collect Your Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Collect Your Data</Text>
            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Directly from you (when creating your account, filling onboarding info, or using features)</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Automatically via SDKs (Firebase, Mixpanel, Microsoft Clarity)</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Through our backend and cloud services (Supabase)</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Through our payment platform (RevenueCat) when you purchase a subscription</Text>
              </View>
            </View>
          </View>

          {/* How We Use Your Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. How We Use Your Data</Text>
            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <Ionicons name="fitness" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>To personalize your workout and meal plans</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="analytics" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>To track your progress and show analytics</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="notifications" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>To send push notifications, reminders, and important updates</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="card" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>To process your subscription and payments</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="bug" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>To monitor app performance, detect bugs, and improve features</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="shield-checkmark" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>To comply with applicable laws and regulations</Text>
              </View>
            </View>
          </View>

          {/* How We Share Your Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. How We Share Your Data</Text>
            <Text style={styles.sectionText}>
              We may share data with trusted service providers solely to operate the app:
            </Text>
            
            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Analytics</Text>
              <Text style={styles.shareText}>Firebase, Mixpanel, Clarity</Text>
            </View>

            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Cloud Storage</Text>
              <Text style={styles.shareText}>Supabase</Text>
            </View>

            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Payments</Text>
              <Text style={styles.shareText}>RevenueCat (which connects with Google Play Billing / Apple In-App Purchase)</Text>
            </View>

            <View style={styles.noSellCard}>
              <Ionicons name="hand-left" size={20} color="#4CAF50" />
              <Text style={styles.noSellText}>
                We do not sell your personal data. We may share aggregated, anonymized data (not personally identifiable) for analytics or marketing.
              </Text>
            </View>
          </View>

          {/* Data Retention & Deletion */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Retention & Deletion</Text>
            <Text style={styles.sectionText}>
              We store your data until you delete your account or request deletion.
            </Text>
            <View style={styles.deletionCard}>
              <Ionicons name="trash" size={20} color="#ff6b6b" />
              <Text style={styles.deletionText}>
                When you delete your account, all personal and fitness data is permanently deleted from our systems immediately.
              </Text>
            </View>
            <Text style={styles.sectionText}>
              You may request account deletion directly from the app's Settings.
            </Text>
          </View>

          {/* Your Rights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Your Rights</Text>
            <Text style={styles.sectionText}>
              Depending on your region (e.g. GDPR, CCPA), you may:
            </Text>
            <View style={styles.rightsList}>
              <View style={styles.rightsItem}>
                <Ionicons name="eye" size={16} color="#937AFD" />
                <Text style={styles.rightsText}>Access, correct, or update your data</Text>
              </View>
              <View style={styles.rightsItem}>
                <Ionicons name="trash" size={16} color="#937AFD" />
                <Text style={styles.rightsText}>Request data deletion</Text>
              </View>
              <View style={styles.rightsItem}>
                <Ionicons name="download" size={16} color="#937AFD" />
                <Text style={styles.rightsText}>Export a copy of your data</Text>
              </View>
              <View style={styles.rightsItem}>
                <Ionicons name="settings" size={16} color="#937AFD" />
                <Text style={styles.rightsText}>Withdraw consent for optional data collection (like analytics or notifications)</Text>
              </View>
            </View>
            <Text style={styles.contactText}>
              Contact us at{' '}
              <Text style={styles.emailLink} onPress={handleEmailPress}>
                info@aplotictech.com
              </Text>
              {' '}to exercise these rights.
            </Text>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Security</Text>
            <View style={styles.securityCard}>
              <Ionicons name="shield" size={20} color="#4CAF50" />
              <Text style={styles.securityText}>
                We use encryption (TLS) and secure cloud hosting to protect your data in transit and at rest. However, no system is 100% secure, and you use the app at your own risk.
              </Text>
            </View>
          </View>

          {/* International Users */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. International Users</Text>
            <Text style={styles.sectionText}>
              Your data may be processed and stored on servers outside your country. By using the app, you consent to this transfer.
            </Text>
          </View>

          {/* Policy Updates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Policy Updates</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy periodically. We will notify you through the app or by email if major changes are made. The latest version will always be available on our website.
            </Text>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact</Text>
            <View style={styles.contactCard}>
              <Text style={styles.companyName}>Aplotic Technologies Private Limited</Text>
              <Text style={styles.contactAddress}>
                806, 8th Floor, Mahabir Tower{'\n'}
                Main Road, Ranchi – 834001, Jharkhand, India
              </Text>
              <TouchableOpacity style={styles.contactEmailButton} onPress={handleEmailPress}>
                <Ionicons name="mail" size={18} color="#ffffff" />
                <Text style={styles.contactEmailText}>info@aplotictech.com</Text>
              </TouchableOpacity>
            </View>
          </View>

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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  simpleDateSection: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  simpleDateText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 12,
  },
  addressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  emailText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginLeft: 6,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#937AFD',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  listText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  shareCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 4,
  },
  shareText: {
    fontSize: 14,
    color: '#666',
  },
  noSellCard: {
    flexDirection: 'row',
    backgroundColor: '#d4edda',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  noSellText: {
    fontSize: 14,
    color: '#155724',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  deletionCard: {
    flexDirection: 'row',
    backgroundColor: '#f8d7da',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  deletionText: {
    fontSize: 14,
    color: '#721c24',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  rightsList: {
    marginTop: 8,
  },
  rightsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
  },
  rightsText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 14,
    color: '#444',
    marginTop: 12,
    lineHeight: 20,
  },
  emailLink: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: '#d1ecf1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  securityText: {
    fontSize: 14,
    color: '#0c5460',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
    textAlign: 'center',
    marginBottom: 12,
  },
  contactAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  contactEmailText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default PrivacyPolicyScreen;
