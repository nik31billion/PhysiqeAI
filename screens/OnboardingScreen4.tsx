import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingNavigation } from '../utils/useOnboardingNavigation';
import { OnboardingErrorHandler } from '../components';

const { width, height } = Dimensions.get('window');

type GoalType = 'lose-fat' | 'gain-muscle' | 'maintain-weight' | null;

const OnboardingScreen4: React.FC = () => {
  const navigation = useNavigation();
  const { navigateToNextStep, isSaving, error } = useOnboardingNavigation();
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(null);
  const [showValidationError, setShowValidationError] = useState(false);


  const goals = [
    {
      id: 'lose-fat' as GoalType,
      title: 'Lose Fat',
      backgroundColor: '#E0F8E9',
      icon: '🔥',
    },
    {
      id: 'gain-muscle' as GoalType,
      title: 'Gain Muscle',
      backgroundColor: '#FFF8D5',
      icon: '💪',
    },
    {
      id: 'maintain-weight' as GoalType,
      title: 'Maintain Weight',
      backgroundColor: '#D9F2FF',
      icon: '⚖️',
    },
  ];

  const handleGoalSelect = (goalId: GoalType) => {
    setSelectedGoal(goalId);
  };

  const handleContinue = async () => {
    if (!selectedGoal) {
      setShowValidationError(true);
      return;
    }
    
    setShowValidationError(false);
    const success = await navigateToNextStep(4, {
      fitness_goal: selectedGoal,
    });
    
    if (!success) {
      
    }
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
          colors={['#D1F5E7', '#F6EADB']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Main Card */}
        <View style={styles.card}>
        {/* Title */}
        <Text style={styles.title}>What is your primary goal?</Text>

        {/* Goal Selection Grid */}
        <View style={styles.goalsGrid}>
          {goals.map((goal, index) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                { backgroundColor: goal.backgroundColor },
                selectedGoal === goal.id && styles.goalCardSelected,
              ]}
              onPress={() => handleGoalSelect(goal.id)}
            >
              {selectedGoal === goal.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text style={styles.goalTitle}>{goal.title}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* Validation Error Message */}
        {showValidationError && (
          <Text style={styles.validationError}>
            Please select a fitness goal before continuing
          </Text>
        )}

        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={!selectedGoal || isSaving}
        >
          <LinearGradient
            colors={
              selectedGoal
                ? ['#E6FFF9', '#FFF9CA'] 
                : ['#E0E0E0', '#C0C0C0']
            }
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedGoal && styles.disabledButtonText
            ]}>
              Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        </View>

      {/* Mascot at bottom right */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../assets/mascot/mascot thumbs up no bg.png')}
          style={styles.mascot}
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
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    margin: width * 0.04,
    marginTop: height * 0.06,
    marginBottom: height * 0.08,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 32,
  },
  goalsGrid: {
    flexDirection: 'column',
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  goalCard: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  goalCardSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalIcon: {
    fontSize: 36,
    marginRight: 20,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222222',
    textAlign: 'left',
    flex: 1,
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
    bottom: 30,
    right: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 70,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default OnboardingScreen4;
