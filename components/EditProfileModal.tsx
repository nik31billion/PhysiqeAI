import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../utils/profileService';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updatedData: Partial<UserProfile>) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    age: '',
    height_cm: '',
    weight_kg: '',
    target_weight_kg: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age?.toString() || '',
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        target_weight_kg: profile.target_weight_kg?.toString() || '',
      });
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 13 || age > 120) {
      newErrors.age = 'Please enter a valid age between 13 and 120';
    }

    // Height validation
    const height = parseInt(formData.height_cm);
    if (!formData.height_cm || isNaN(height) || height < 100 || height > 250) {
      newErrors.height_cm = 'Please enter a valid height between 100-250 cm';
    }

    // Weight validation
    const weight = parseFloat(formData.weight_kg);
    if (!formData.weight_kg || isNaN(weight) || weight < 30 || weight > 300) {
      newErrors.weight_kg = 'Please enter a valid weight between 30-300 kg';
    }

    // Target weight validation
    const targetWeight = parseFloat(formData.target_weight_kg);
    if (!formData.target_weight_kg || isNaN(targetWeight) || targetWeight < 30 || targetWeight > 300) {
      newErrors.target_weight_kg = 'Please enter a valid goal weight between 30-300 kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updatedData: Partial<UserProfile> = {
        age: parseInt(formData.age),
        height_cm: parseInt(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        target_weight_kg: parseFloat(formData.target_weight_kg),
      };

      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#e7f8f4', '#fce7e3']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#a2b2b7" />
              </TouchableOpacity>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#b99bce" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                {/* Age */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={[styles.input, errors.age && styles.inputError]}
                    value={formData.age}
                    onChangeText={(value) => handleInputChange('age', value)}
                    placeholder="Enter your age"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
                </View>

                {/* Height */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={[styles.input, errors.height_cm && styles.inputError]}
                    value={formData.height_cm}
                    onChangeText={(value) => handleInputChange('height_cm', value)}
                    placeholder="Enter your height in cm"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  {errors.height_cm && <Text style={styles.errorText}>{errors.height_cm}</Text>}
                </View>

                {/* Current Weight */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, errors.weight_kg && styles.inputError]}
                    value={formData.weight_kg}
                    onChangeText={(value) => handleInputChange('weight_kg', value)}
                    placeholder="Enter your current weight"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  {errors.weight_kg && <Text style={styles.errorText}>{errors.weight_kg}</Text>}
                </View>

                {/* Goal Weight */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Goal Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, errors.target_weight_kg && styles.inputError]}
                    value={formData.target_weight_kg}
                    onChangeText={(value) => handleInputChange('target_weight_kg', value)}
                    placeholder="Enter your goal weight"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  {errors.target_weight_kg && <Text style={styles.errorText}>{errors.target_weight_kg}</Text>}
                </View>
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle-outline" size={20} color="#b99bce" />
                  <Text style={styles.infoTitle}>Note</Text>
                </View>
                <Text style={styles.infoText}>
                  Updating your profile information may affect your personalized fitness plan. 
                  Consider regenerating your plan after making significant changes.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
  },
  saveButton: {
    backgroundColor: '#b99bce',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#f8fafd',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#b99bce',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default EditProfileModal;
