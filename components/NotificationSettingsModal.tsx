import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, NotificationPreferences } from '../utils/notificationService';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
  userId,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getDefaultPreferences()
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadPreferences();
    }
  }, [visible, userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await notificationService.loadPreferences(userId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await notificationService.savePreferences(userId, preferences);
      await notificationService.scheduleRecurringNotifications(userId, preferences);
      Alert.alert('Success', 'Notification settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const formatTimeForDisplay = (time24: string): string => {
    return notificationService.formatTimeForDisplay(time24);
  };

  const parseTimeFromDisplay = (time12: string): string => {
    return notificationService.parseTimeFromDisplay(time12);
  };

  const TimePicker = ({ 
    label, 
    value, 
    onValueChange 
  }: { 
    label: string; 
    value: string; 
    onValueChange: (value: string) => void;
  }) => {
    const [hours, minutes] = value.split(':').map(Number);
    const [displayTime, setDisplayTime] = useState(formatTimeForDisplay(value));

    const handleTimeChange = (newTime: string) => {
      setDisplayTime(newTime);
      const time24 = parseTimeFromDisplay(newTime);
      onValueChange(time24);
    };

    const incrementHour = () => {
      const newHours = (hours + 1) % 24;
      const newTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      handleTimeChange(formatTimeForDisplay(newTime));
    };

    const decrementHour = () => {
      const newHours = hours === 0 ? 23 : hours - 1;
      const newTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      handleTimeChange(formatTimeForDisplay(newTime));
    };

    const incrementMinute = () => {
      const newMinutes = (minutes + 15) % 60;
      const newTime = `${hours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
      handleTimeChange(formatTimeForDisplay(newTime));
    };

    const decrementMinute = () => {
      const newMinutes = minutes < 15 ? 45 : minutes - 15;
      const newTime = `${hours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
      handleTimeChange(formatTimeForDisplay(newTime));
    };

    return (
      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerLabel}>{label}</Text>
        <View style={styles.timePicker}>
          <View style={styles.timeSection}>
            <TouchableOpacity style={styles.timeButton} onPress={incrementHour}>
              <Ionicons name="chevron-up" size={20} color="#B7FCE7" />
            </TouchableOpacity>
            <Text style={styles.timeDisplay}>{displayTime}</Text>
            <TouchableOpacity style={styles.timeButton} onPress={decrementHour}>
              <Ionicons name="chevron-down" size={20} color="#B7FCE7" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B7FCE7" />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#F8EFFF', '#D6F5EC']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Notification Settings</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Expo Go Warning */}
              {Constants.appOwnership === 'expo' && (
                <View style={styles.expoGoWarning}>
                  <Ionicons name="information-circle" size={20} color="#F59E0B" />
                  <Text style={styles.expoGoWarningText}>
                    System notifications are not fully supported in Expo Go. Use a development build for full functionality.
                  </Text>
                </View>
              )}

              {/* Master Toggle */}
              <View style={styles.section}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Enable Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Turn on/off all Flex Aura notifications
                    </Text>
                  </View>
                  <Switch
                    value={preferences.enabled}
                    onValueChange={(value) => updatePreference('enabled', value)}
                    trackColor={{ false: '#E5E7EB', true: '#B7FCE7' }}
                    thumbColor={preferences.enabled ? '#10B981' : '#9CA3AF'}
                  />
                </View>
              </View>

              {preferences.enabled && (
                <>
                  {/* Workout Reminders */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Workout Reminders</Text>
                    
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>Workout Reminders</Text>
                        <Text style={styles.settingDescription}>
                          Get reminded about your daily workouts
                        </Text>
                      </View>
                      <Switch
                        value={preferences.workoutReminders}
                        onValueChange={(value) => updatePreference('workoutReminders', value)}
                        trackColor={{ false: '#E5E7EB', true: '#B7FCE7' }}
                        thumbColor={preferences.workoutReminders ? '#10B981' : '#9CA3AF'}
                      />
                    </View>

                    {preferences.workoutReminders && (
                      <TimePicker
                        label="Workout Time"
                        value={preferences.workoutTime}
                        onValueChange={(value) => updatePreference('workoutTime', value)}
                      />
                    )}
                  </View>

                  {/* Meal Reminders */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Meal Reminders</Text>
                    
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>Meal Reminders</Text>
                        <Text style={styles.settingDescription}>
                          Get reminded about your meal plan
                        </Text>
                      </View>
                      <Switch
                        value={preferences.mealReminders}
                        onValueChange={(value) => updatePreference('mealReminders', value)}
                        trackColor={{ false: '#E5E7EB', true: '#B7FCE7' }}
                        thumbColor={preferences.mealReminders ? '#10B981' : '#9CA3AF'}
                      />
                    </View>

                    {preferences.mealReminders && (
                      <TimePicker
                        label="Meal Time"
                        value={preferences.mealTime}
                        onValueChange={(value) => updatePreference('mealTime', value)}
                      />
                    )}
                  </View>

                  {/* Streak Reminders */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Streak Reminders</Text>
                    
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>Streak Reminders</Text>
                        <Text style={styles.settingDescription}>
                          Get reminded to maintain your streak
                        </Text>
                      </View>
                      <Switch
                        value={preferences.streakReminders}
                        onValueChange={(value) => updatePreference('streakReminders', value)}
                        trackColor={{ false: '#E5E7EB', true: '#B7FCE7' }}
                        thumbColor={preferences.streakReminders ? '#10B981' : '#9CA3AF'}
                      />
                    </View>

                    {preferences.streakReminders && (
                      <TimePicker
                        label="Streak Time"
                        value={preferences.streakTime}
                        onValueChange={(value) => updatePreference('streakTime', value)}
                      />
                    )}
                  </View>

                  {/* Celebration Notifications */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Celebrations</Text>
                    
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>Milestone Celebrations</Text>
                        <Text style={styles.settingDescription}>
                          Get notified when you hit milestones
                        </Text>
                      </View>
                      <Switch
                        value={preferences.milestoneCelebrations}
                        onValueChange={(value) => updatePreference('milestoneCelebrations', value)}
                        trackColor={{ false: '#E5E7EB', true: '#B7FCE7' }}
                        thumbColor={preferences.milestoneCelebrations ? '#10B981' : '#9CA3AF'}
                      />
                    </View>

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>Coach Glow Messages</Text>
                        <Text style={styles.settingDescription}>
                          Get motivational messages from Coach Glow
                        </Text>
                      </View>
                      <Switch
                        value={preferences.coachGlowMessages}
                        onValueChange={(value) => updatePreference('coachGlowMessages', value)}
                        trackColor={{ false: '#E5E7EB', true: '#B7FCE7' }}
                        thumbColor={preferences.coachGlowMessages ? '#10B981' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={savePreferences}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  timePickerContainer: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(183, 252, 231, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(183, 252, 231, 0.3)',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  timePicker: {
    alignItems: 'center',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(183, 252, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(183, 252, 231, 0.4)',
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 100,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#B7FCE7',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  expoGoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  expoGoWarningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default NotificationSettingsModal;
