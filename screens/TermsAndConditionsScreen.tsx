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

const TermsAndConditionsScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:info@aplotictech.com');
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.dateText}>Effective Date: 13th September 2025</Text>
            <Text style={styles.dateText}>Last Updated: 13th September 2025</Text>
          </View>

          {/* 1. Acceptance of Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By downloading, accessing, or using Flex Aura, you agree to these Terms and our Privacy Policy. If you do not agree, you must stop using the app.
            </Text>
          </View>

          {/* 2. Service Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Service Description</Text>
            <Text style={styles.sectionText}>
              Flex Aura provides fitness-related content, personalized workout and meal plans, goal tracking, aura points, and other features designed to improve your health and lifestyle.
            </Text>
            <View style={styles.warningCard}>
              <Ionicons name="medical" size={20} color="#ff6b6b" />
              <Text style={styles.warningText}>
                This app is intended for general wellness and is not a substitute for medical advice. Always consult a doctor before starting any fitness program.
              </Text>
            </View>
          </View>

          {/* 3. Eligibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Eligibility</Text>
            <Text style={styles.sectionText}>
              Flex Aura can be used by individuals of any age, but users under 16 must use it with parental consent. By using the app, you represent that you are legally allowed to use such services in your region.
            </Text>
          </View>

          {/* 4. Account Registration & Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Account Registration & Security</Text>
            <Text style={styles.sectionText}>
              You must create an account to use Flex Aura. You agree to:
            </Text>
            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Provide accurate and updated information</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Keep your login credentials secure</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.listText}>Be responsible for all activity under your account</Text>
              </View>
            </View>
            <Text style={styles.sectionText}>
              We may suspend or terminate accounts that violate these terms.
            </Text>
          </View>

          {/* 5. Subscriptions, Billing & Payments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Subscriptions, Billing & Payments</Text>
            <Text style={styles.sectionText}>
              Flex Aura operates on a paid subscription model (hard paywall).
            </Text>
            
            <View style={styles.subscriptionCard}>
              <Text style={styles.subscriptionTitle}>Plans currently available:</Text>
              
              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Ionicons name="calendar" size={20} color="#937AFD" />
                  <Text style={styles.planName}>Monthly Plan</Text>
                </View>
                <Text style={styles.planPrice}>₹300 / ~USD 4</Text>
              </View>

              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Ionicons name="calendar-outline" size={20} color="#937AFD" />
                  <Text style={styles.planName}>Yearly Plan</Text>
                </View>
                <Text style={styles.planPrice}>₹2500 / ~USD 30</Text>
              </View>
            </View>

            <Text style={styles.sectionText}>
              Subscriptions are processed through RevenueCat which integrates with Google Play and Apple In-App Purchase systems.
            </Text>
            
            <Text style={styles.sectionText}>
              Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.
            </Text>

            <View style={styles.refundCard}>
              <Ionicons name="card" size={20} color="#ff6b6b" />
              <Text style={styles.refundText}>
                Refunds: All payments are handled by the app stores (Google / Apple). We do not process refunds directly. Please refer to their policies for refunds.
              </Text>
            </View>
          </View>

          {/* 6. Use of Personal Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Use of Personal Data</Text>
            <Text style={styles.sectionText}>
              Use of your data is governed by our Privacy Policy. By using Flex Aura, you consent to our data collection and usage as described there.
            </Text>
          </View>

          {/* 7. User Conduct */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. User Conduct</Text>
            <Text style={styles.sectionText}>You agree not to:</Text>
            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>Misuse the app or interfere with its operation</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>Upload harmful, illegal, or abusive content</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#ff6b6b" />
                <Text style={styles.listText}>Attempt to reverse engineer or copy the app</Text>
              </View>
            </View>
          </View>

          {/* 8. Intellectual Property */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
            <Text style={styles.sectionText}>
              All content, features, logos, and designs in the app are owned by Aplotic Technologies Private Limited. You are granted a limited, non-exclusive, non-transferable license to use the app solely for personal use.
            </Text>
          </View>

          {/* 9. Disclaimers & Limitation of Liability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Disclaimers & Limitation of Liability</Text>
            <View style={styles.disclaimerCard}>
              <Ionicons name="warning" size={20} color="#ff6b6b" />
              <Text style={styles.disclaimerText}>
                Flex Aura provides guidance and motivation only. Results are not guaranteed and vary per individual.
              </Text>
            </View>
            <Text style={styles.sectionText}>
              We are not liable for any injuries, losses, or damages arising from use of the app.
            </Text>
            <Text style={styles.sectionText}>
              Use the app at your own risk and consult a healthcare provider before starting new fitness routines.
            </Text>
          </View>

          {/* 10. Governing Law */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Governing Law</Text>
            <Text style={styles.sectionText}>
              These Terms are governed by the laws of India. However, we aim to comply with international standards including GDPR and CCPA. Any disputes shall be subject to the exclusive jurisdiction of courts in Ranchi, Jharkhand, India.
            </Text>
          </View>

          {/* 11. Termination */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Termination</Text>
            <Text style={styles.sectionText}>
              We may suspend or terminate your account at any time for violations of these Terms or illegal activity. You may stop using the app at any time.
            </Text>
          </View>

          {/* 12. Changes to Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We may update these Terms occasionally. We will notify you via in-app notice or email. The updated version will be effective as of its posted date.
            </Text>
          </View>

          {/* 13. Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Contact</Text>
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
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 4,
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
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
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: 'rgba(147, 122, 253, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#937AFD',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#232323',
    marginLeft: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#937AFD',
  },
  refundCard: {
    flexDirection: 'row',
    backgroundColor: '#f8d7da',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  refundText: {
    fontSize: 14,
    color: '#721c24',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
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

export default TermsAndConditionsScreen;
