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
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

const OnboardingScreen7: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  
  // Simple state management
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft-in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);

  const handleHeightUnitChange = (unit: 'cm' | 'ft-in') => {
    setHeightUnit(unit);
    setHeight('');
    setFeet('');
    setInches('');
  };

  const handleWeightUnitChange = (unit: 'kg' | 'lb') => {
    setWeightUnit(unit);
  };

  const validateAndContinue = async () => {
    setShowValidationError(false);
    
    let isValid = true;
    let heightCm = 0;
    let weightKg = 0;

    // Validate height
    if (heightUnit === 'cm') {
      const heightNum = parseFloat(height);
      if (!height || isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
        isValid = false;
      } else {
        heightCm = heightNum;
      }
    } else {
      const feetNum = parseFloat(feet);
      const inchesNum = parseFloat(inches);
      if (!feet || !inches || isNaN(feetNum) || isNaN(inchesNum) || 
          feetNum < 0 || feetNum > 8 || inchesNum < 0 || inchesNum >= 12) {
        isValid = false;
      } else {
        heightCm = (feetNum * 30.48) + (inchesNum * 2.54);
      }
    }
    
    // Validate weight
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      isValid = false;
    } else {
      weightKg = weightUnit === 'lb' ? weightNum * 0.453592 : weightNum;
    }

    if (!isValid) {
      setShowValidationError(true);
      return;
    }
    
    const success = await navigateToNextStep(7, {
      height_cm: Math.round(heightCm),
      weight_kg: parseFloat(weightKg.toFixed(2)),
    });
    
    if (!success) {
      console.error('Failed to save onboarding data');
    }
  };

  const isFormValid = () => {
    if (heightUnit === 'cm') {
      const heightNum = parseFloat(height);
      return height && !isNaN(heightNum) && heightNum > 0 && heightNum <= 300;
    } else {
      const feetNum = parseFloat(feet);
      const inchesNum = parseFloat(inches);
      return feet && inches && !isNaN(feetNum) && !isNaN(inchesNum) && 
             feetNum >= 0 && feetNum <= 8 && inchesNum >= 0 && inchesNum < 12;
    }
  };

  const isWeightValid = () => {
    const weightNum = parseFloat(weight);
    return weight && !isNaN(weightNum) && weightNum > 0 && weightNum <= 500;
  };

  return (
    <OnboardingErrorHandler 
      error={error} 
      loading={isSaving}
      onRetry={() => validateAndContinue()}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <LinearGradient
          colors={['#D1F5E7', '#F6EADB']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.card}>
        <Text style={styles.heading}>Tell us about your{'\n'}body stats</Text>

          {/* Height Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Height</Text>
            
        {heightUnit === 'cm' ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
            value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="Enter height"
                  placeholderTextColor="#C7C7CC"
                />
                <View style={styles.unitContainer}>
                  <TouchableOpacity
                    style={[styles.unitButton, heightUnit === 'cm' ? styles.unitButtonActive : null]}
                    onPress={() => handleHeightUnitChange('cm')}
                  >
                    <Text style={[styles.unitText, heightUnit === 'cm' ? styles.unitTextActive : null]}>cm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, heightUnit === 'ft-in' ? styles.unitButtonActive : null]}
                    onPress={() => handleHeightUnitChange('ft-in')}
                  >
                    <Text style={[styles.unitText, heightUnit === 'ft-in' ? styles.unitTextActive : null]}>ft-in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.inputContainer}>
                  <View style={styles.feetInchesContainer}>
                    <View style={styles.feetInchesInput}>
                      <TextInput
                        style={styles.feetInchesTextInput}
                        value={feet}
                        onChangeText={setFeet}
                        keyboardType="numeric"
                        placeholder="5"
                        placeholderTextColor="#C7C7CC"
                      />
                      <Text style={styles.feetInchesLabel}>ft</Text>
                    </View>
                    <View style={styles.feetInchesInput}>
                      <TextInput
                        style={styles.feetInchesTextInput}
                        value={inches}
                        onChangeText={setInches}
                        keyboardType="numeric"
                        placeholder="8"
                        placeholderTextColor="#C7C7CC"
                      />
                      <Text style={styles.feetInchesLabel}>in</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.unitContainerBelow}>
                  <TouchableOpacity
                    style={[styles.unitButton, heightUnit === 'cm' ? styles.unitButtonActive : null]}
                    onPress={() => handleHeightUnitChange('cm')}
                  >
                    <Text style={[styles.unitText, heightUnit === 'cm' ? styles.unitTextActive : null]}>cm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, heightUnit === 'ft-in' ? styles.unitButtonActive : null]}
                    onPress={() => handleHeightUnitChange('ft-in')}
                  >
                    <Text style={[styles.unitText, heightUnit === 'ft-in' ? styles.unitTextActive : null]}>ft-in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Weight Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Weight</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
          value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Enter weight"
                placeholderTextColor="#C7C7CC"
              />
              <View style={styles.unitContainer}>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'kg' ? styles.unitButtonActive : null]}
                  onPress={() => handleWeightUnitChange('kg')}
                >
                  <Text style={[styles.unitText, weightUnit === 'kg' ? styles.unitTextActive : null]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'lb' ? styles.unitButtonActive : null]}
                  onPress={() => handleWeightUnitChange('lb')}
                >
                  <Text style={[styles.unitText, weightUnit === 'lb' ? styles.unitTextActive : null]}>lb</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Validation Error */}
        {showValidationError && (
            <Text style={styles.errorText}>
              Please enter valid height and weight values
          </Text>
        )}

        {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={validateAndContinue}
            disabled={!isFormValid() || !isWeightValid() || isSaving}
          >
            <LinearGradient
              colors={
                (isFormValid() && isWeightValid())
                  ? ['#E6FFF9', '#FFF9CA'] 
                  : ['#E0E0E0', '#C0C0C0']
              }
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[
                styles.continueButtonText,
                (!isFormValid() || !isWeightValid()) && styles.continueButtonTextDisabled
              ]}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        <Text style={styles.noteText}>Please enter your height and weight</Text>
        </View>

        {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/measuring tape no bg.png')}
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
    top: height * 0.08,
    left: width * 0.08,
    right: width * 0.08,
    bottom: height * 0.22,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 34,
  },
  section: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 60,
    justifyContent: 'space-between',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
    paddingRight: 15,
    marginRight: 15,
  },
  unitContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  unitContainerBelow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 10,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  unitButtonActive: {
    backgroundColor: '#D8FFF1',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  unitTextActive: {
    color: '#2D2D2D',
  },
  feetInchesContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 15,
    justifyContent: 'center',
  },
  feetInchesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  feetInchesTextInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
    minWidth: 30,
  },
  feetInchesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 5,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  continueButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  continueButtonTextDisabled: {
    color: '#999999',
  },
  noteText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.05,
    right: width * 0.05,
    zIndex: 10,
  },
  mascotImage: {
    width: 120,
    height: 120,
  },
});

export default OnboardingScreen7;