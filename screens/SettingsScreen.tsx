import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { NotificationSettingsModal } from '../components';

const SettingsScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationSettingsVisible, setNotificationSettingsVisible] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.\n\nAll your progress, data, and subscriptions will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance to cancel. Your account and all data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Delete Forever',
          style: 'destructive',
          onPress: deleteAccount,
        },
      ],
    );
  };

  const deleteAccount = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    setIsDeleting(true);

    try {
      // Call the Supabase function to delete all user data and the account
      const { data, error } = await supabase.functions.invoke('delete-user-data', {
        body: { user_id: user.id }
      });

      if (error) {
        console.error('Error deleting account:', error);
        Alert.alert('Error', 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        return;
      }

      // Sign out the user
      await signOut();
      
      // Navigate to onboarding
      navigation.navigate('OnboardingScreen1' as never);
      
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContactUs = () => {
    Alert.alert(
      'Contact Support',
      'Need help? We\'re here to assist you!\n\nEmail: info@aplotictech.com\n\nWe typically respond within 24 hours.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Email',
          onPress: () => {
            Linking.openURL('mailto:info@aplotictech.com?subject=PhysiqeAI Support Request');
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.sectionCard}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Ionicons name="person-outline" size={20} color="#a2b2b7" />
                  <Text style={styles.settingLabel}>Email</Text>
                </View>
                <Text style={styles.settingValue}>{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* App Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            
            <View style={styles.sectionCard}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setNotificationSettingsVisible(true)}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="notifications-outline" size={20} color="#a2b2b7" />
                  <Text style={styles.settingLabel}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <View style={styles.sectionCard}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleContactUs}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="mail-outline" size={20} color="#a2b2b7" />
                  <Text style={styles.settingLabel}>Contact Us</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('TermsAndConditionsScreen' as never)}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="document-text-outline" size={20} color="#a2b2b7" />
                  <Text style={styles.settingLabel}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PrivacyPolicyScreen' as never)}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#a2b2b7" />
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#a2b2b7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            
            <View style={styles.sectionCard}>
              <TouchableOpacity 
                style={[styles.settingItem, styles.dangerItem]} 
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                <View style={styles.settingInfo}>
                  <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                  <Text style={[styles.settingLabel, styles.dangerText]}>
                    {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                  </Text>
                </View>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ff6b6b" />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#ff6b6b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        visible={notificationSettingsVisible}
        onClose={() => setNotificationSettingsVisible(false)}
        userId={user?.id || ''}
      />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#232323',
    marginLeft: 12,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#a2b2b7',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 52,
  },
  dangerItem: {
    // Additional styling for danger items if needed
  },
  dangerText: {
    color: '#ff6b6b',
  },
});

export default SettingsScreen;
