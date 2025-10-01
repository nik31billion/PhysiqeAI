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
import Slider from '@react-native-community/slider';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

interface TimelineOption {
  id: string;
  label: string;
  color: string;
}

const timelineOptions: TimelineOption[] = [
  { id: '4', label: '4 weeks', color: '#DFF7ED' },
  { id: '8', label: '8 weeks', color: '#E5E2F9' },
  { id: '12', label: '12 weeks', color: '#E3EDFA' },
  { id: '16', label: '16 weeks', color: '#FFE3D7' },
  { id: 'custom', label: 'Custom', color: '#FFF9D6' },
];

const OnboardingScreen12: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [goalWeight, setGoalWeight] = useState<number>(145);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [isMaintain, setIsMaintain] = useState<boolean>(false);
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [customWeeks, setCustomWeeks] = useState<string>('');
  const [showValidationError, setShowValidationError] = useState(false);

  const handleUnitToggle = () => {
    const newUnit = unit === 'kg' ? 'lb' : 'kg';
    setUnit(newUnit);
    
    // Convert weight when changing units
    if (newUnit === 'lb') {
      setGoalWeight(Math.round(goalWeight * 2.20462));
    } else {
      setGoalWeight(Math.round(goalWeight / 2.20462));
    }
  };

  const handleMaintainToggle = () => {
    setIsMaintain(!isMaintain);
  };

  const handleTimelineSelect = (timelineId: string) => {
    setSelectedTimeline(timelineId);
    if (timelineId !== 'custom') {
      setCustomWeeks('');
    }
  };

  const handleContinue = async () => {
    if (!isValidSelection()) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    
    // Convert weight to kg for storage
    let targetWeightKg = goalWeight;
    if (unit === 'lb') {
      targetWeightKg = goalWeight * 0.453592;
    }
    
    const timelineWeeks = selectedTimeline === 'custom' ? parseInt(customWeeks) : parseInt(selectedTimeline);
    
    const success = await navigateToNextStep(12, {
      target_weight_kg: isMaintain ? undefined : parseFloat(targetWeightKg.toFixed(2)),
      target_timeline_weeks: timelineWeeks,
    });
    
    if (!success) {
      
    }
  };

  const isValidSelection = () => {
    return (isMaintain || goalWeight) && 
           (selectedTimeline && (selectedTimeline !== 'custom' || customWeeks.trim() !== ''));
  };

  const getWeightRange = () => {
    return unit === 'kg' ? { min: 30, max: 200 } : { min: 66, max: 440 };
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
          colors={['#E9F6F3', '#FCF4ED']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Heading */}
          <Text style={styles.heading}>What's your goal weight</Text>

          {/* Goal Weight Selector */}
          <View style={styles.weightSelectorContainer}>
            <View style={styles.weightSelector}>
              {/* Weight Display and Unit Toggle */}
              <View style={styles.weightDisplayRow}>
                <Text style={styles.weightNumber}>{isMaintain ? '—' : goalWeight}</Text>
                <TouchableOpacity 
                  style={styles.unitButton} 
                  onPress={handleUnitToggle}
                  disabled={isMaintain}
                >
                  <Text style={[styles.unitText, isMaintain && styles.disabledText]}>{unit}</Text>
                </TouchableOpacity>
              </View>

              {/* Slider */}
              {!isMaintain && (
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={getWeightRange().min}
                    maximumValue={getWeightRange().max}
                    value={goalWeight}
                    onValueChange={setGoalWeight}
                    minimumTrackTintColor="#4FC3F7"
                    maximumTrackTintColor="#E8F4FD"
                    thumbTintColor="#4FC3F7"
                    step={1}
                  />
                </View>
              )}

              {/* Maintain Toggle */}
              <View style={styles.maintainContainer}>
                <TouchableOpacity 
                  style={[styles.maintainToggle, isMaintain && styles.maintainToggleActive]}
                  onPress={handleMaintainToggle}
                  activeOpacity={0.8}
                >
                  <View style={[styles.maintainDot, isMaintain && styles.maintainDotActive]} />
                </TouchableOpacity>
                <Text style={styles.maintainLabel}>Maintain</Text>
              </View>
            </View>
          </View>

          {/* Timeline Selector */}
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineHeading}>How fast you you want to achieve it?</Text>
            
            <View style={styles.timelineOptions}>
              {timelineOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.timelineButton,
                    { backgroundColor: option.color },
                    selectedTimeline === option.id && styles.selectedTimelineButton,
                  ]}
                  onPress={() => handleTimelineSelect(option.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timelineButtonText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Input */}
            {selectedTimeline === 'custom' && (
              <TextInput
                style={styles.customInput}
                placeholder="Custom"
                placeholderTextColor="#999999"
                value={customWeeks}
                onChangeText={setCustomWeeks}
                keyboardType="numeric"
                maxLength={3}
              />
            )}
          </View>

          {/* Validation Error Message */}
          {showValidationError && (
            <Text style={styles.validationError}>
              Please set your goal weight and timeline before continuing
            </Text>
          )}

          {/* Continue Button */}
          <LinearGradient
            colors={isValidSelection() ? ['#E6FFF9', '#B9E5FF'] : ['#E0E0E0', '#C0C0C0']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              disabled={!isValidSelection() || isSaving}
            >
              <Text style={[
                styles.continueButtonText,
                (!isValidSelection() || isSaving) && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>

        </View>
        </View>

      {/* Medal Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/medal no bg.png')}
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
  weightSelectorContainer: {
    width: '100%',
    marginBottom: 20,
  },
  weightSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 25,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
    minHeight: 120,
  },
  weightDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  weightNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2D2D2D',
    minWidth: 120,
    textAlign: 'center',
  },
  unitButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E2F9',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  disabledText: {
    color: '#999999',
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 50,
  },
  sliderThumb: {
    backgroundColor: '#4FC3F7',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  maintainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  maintainToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  maintainToggleActive: {
    backgroundColor: '#E5E2F9',
  },
  maintainDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  maintainDotActive: {
    alignSelf: 'flex-end',
    backgroundColor: '#937AFD',
  },
  maintainLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  timelineContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  timelineHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 20,
  },
  timelineOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 15,
  },
  timelineButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimelineButton: {
    shadowColor: '#2196F3',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  timelineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  customInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
    minWidth: 120,
  },
  continueButtonGradient: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#B9E5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 8,
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
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#999999',
  },
  validationError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
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

export default OnboardingScreen12;
