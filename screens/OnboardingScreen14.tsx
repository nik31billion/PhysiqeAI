import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface MedicalCondition {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  iconName: string;
  iconColor: string;
}

const OnboardingScreen14: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherConditionText, setOtherConditionText] = useState<string>('');

  const handleConditionSelect = (conditionId: string) => {
    if (conditionId === 'none') {
      // If "None" is selected, clear all other selections
      setSelectedConditions(['none']);
      setOtherConditionText('');
    } else if (conditionId === 'other') {
      // Handle "Other" selection
      setSelectedConditions(prev => {
        const filtered = prev.filter(id => id !== 'none'); // Remove 'none' if selected
        if (filtered.includes('other')) {
          // If already selected, deselect it
          setOtherConditionText('');
          return filtered.filter(id => id !== 'other');
        } else {
          // If not selected, select it
          return [...filtered, 'other'];
        }
      });
    } else {
      // Handle regular conditions
      setSelectedConditions(prev => {
        const filtered = prev.filter(id => id !== 'none'); // Remove 'none' if selected
        if (filtered.includes(conditionId)) {
          // Remove if already selected
          return filtered.filter(id => id !== conditionId);
        } else {
          // Add if not selected
          return [...filtered, conditionId];
        }
      });
    }
  };

  const handleContinue = async () => {
    // Prepare medical conditions data
    let medicalConditionsData = selectedConditions;
    
    // If "other" is selected and there's text, include it
    if (selectedConditions.includes('other') && otherConditionText.trim()) {
      medicalConditionsData = selectedConditions.map(condition => 
        condition === 'other' ? `other: ${otherConditionText.trim()}` : condition
      );
    }
    
    const success = await navigateToNextStep(14, {
      medical_conditions: medicalConditionsData,
    });
    
    if (!success) {
      
    }
  };

  const medicalConditions: MedicalCondition[] = [
    {
      id: 'none',
      label: 'None',
      color: '#FFFFFF',
      borderColor: '#E8F5E8',
      iconName: 'checkmark-circle',
      iconColor: '#4CAF50',
    },
    {
      id: 'diabetes',
      label: 'Diabetes',
      color: '#FFFFFF',
      borderColor: '#B8F2C9',
      iconName: 'medical',
      iconColor: '#4CAF50',
    },
    {
      id: 'thyroid',
      label: 'Thyroid',
      color: '#FFFFFF',
      borderColor: '#E4D2FF',
      iconName: 'pulse',
      iconColor: '#9C27B0',
    },
    {
      id: 'pcos',
      label: 'PCOS',
      color: '#FFFFFF',
      borderColor: '#DAF0FF',
      iconName: 'female',
      iconColor: '#2196F3',
    },
    {
      id: 'other',
      label: 'Other',
      color: '#FFFFFF',
      borderColor: '#FFF6E2',
      iconName: 'ellipsis-horizontal',
      iconColor: '#FF9800',
    },
  ];

  const renderConditionIcon = (condition: MedicalCondition) => (
    <View style={[
      styles.iconContainer, 
      { backgroundColor: condition.borderColor }
    ]}>
      <Ionicons 
        name={condition.iconName as any} 
        size={24} 
        color={condition.iconColor} 
      />
    </View>
  );

  const renderCheckmark = (conditionId: string) => {
    const condition = medicalConditions.find(c => c.id === conditionId);
    if (!condition) return null;

    return (
      <View style={[
        styles.checkmarkContainer,
        { backgroundColor: condition.borderColor }
      ]}>
        <Ionicons 
          name="checkmark" 
          size={16} 
          color={condition.iconColor} 
        />
      </View>
    );
  };

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => handleContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#E6F7F2', '#FAF7E6', '#EFEAFF']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Heading */}
          <Text style={styles.heading}>
            Do you have any medical{'\n'}conditions we should know about?
          </Text>

          {/* Medical Condition Options */}
          <View style={styles.optionsContainer}>
            {medicalConditions.map((condition) => {
              // If "other" is selected, show text input instead of the other card
              if (condition.id === 'other' && selectedConditions.includes('other')) {
                return (
                  <View key={condition.id} style={styles.customOtherCardContainer}>
                    <View style={[
                      styles.customOtherCard,
                      { 
                        borderColor: condition.borderColor,
                        shadowColor: condition.iconColor,
                      }
                    ]}>
                      {/* Icon */}
                      {renderConditionIcon(condition)}
                      
                      {/* Text Input */}
                      <TextInput
                        style={styles.customOtherCardInput}
                        placeholder="Please specify your condition..."
                        placeholderTextColor="#999999"
                        value={otherConditionText}
                        onChangeText={setOtherConditionText}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                        autoFocus={true}
                      />
                      
                      {/* Cancel button */}
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setSelectedConditions(prev => prev.filter(id => id !== 'other'));
                          setOtherConditionText('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              
              // Regular condition cards
              return (
                <TouchableOpacity
                  key={condition.id}
                  style={[
                    styles.conditionOption,
                    { backgroundColor: condition.color },
                    selectedConditions.includes(condition.id) && [
                      styles.selectedOption,
                      { 
                        borderColor: condition.borderColor,
                        shadowColor: condition.iconColor,
                      }
                    ],
                  ]}
                  onPress={() => handleConditionSelect(condition.id)}
                  activeOpacity={0.8}
                >
                  {/* Icon */}
                  {renderConditionIcon(condition)}

                  {/* Label */}
                  <Text style={styles.optionLabel}>{condition.label}</Text>

                  {/* Checkmark for selected items */}
                  {selectedConditions.includes(condition.id) && renderCheckmark(condition.id)}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Helper Text */}
          <Text style={styles.helperText}>
            {selectedConditions.includes('none') 
              ? "No medical conditions selected" 
              : "Select all that apply, or choose 'None'"
            }
          </Text>

          {/* Continue Button */}
          <LinearGradient
            colors={['#E6FFF9', '#C1F5FF']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              disabled={isSaving}
            >
              <Text style={[styles.continueButtonText, isSaving && styles.buttonTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        </View>

      {/* Doctor Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/doctor no bg.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>
      </View>
    </OnboardingErrorHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    position: 'absolute',
    top: height * 0.06,
    left: width * 0.06,
    right: width * 0.06,
    bottom: height * 0.08,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
    elevation: 20,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 25,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 15,
  },
  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 60,
  },
  selectedOption: {
    backgroundColor: '#FAFFFE',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 3,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    flex: 1,
  },
  checkmarkContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  customOtherCardContainer: {
    width: '100%',
  },
  customOtherCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFFFE',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    minHeight: 60,
  },
  customOtherCardInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginLeft: 14,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    minHeight: 40,
  },
  cancelButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFE6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 2,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 8,
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#C1F5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: 0.3,
  },
  buttonTextDisabled: {
    color: '#8E8E93',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    right: width * 0.01,
    zIndex: 10,
  },
  mascotImage: {
    width: 110,
    height: 110,
    zIndex: 2,
  },
});

export default OnboardingScreen14;
