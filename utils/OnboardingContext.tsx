import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { OnboardingService, OnboardingData, UserProfile } from './onboardingService';
import { useAuth } from './AuthContext';
import { ensureUserHasCalorieData } from './onboardingCalorieService';

interface OnboardingContextType {
  // State
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isOnboardingComplete: boolean;
  currentStep: number;
  
  // Actions
  saveOnboardingData: (step: number, data: Partial<OnboardingData>) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  resetOnboarding: () => Promise<boolean>;
  
  // Utility functions
  getNextStep: () => number;
  isStepCompleted: (step: number) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(4);

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setUserProfile(null);
      setIsOnboardingComplete(false);
      setCurrentStep(4);
      setLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await OnboardingService.getUserProfile(user.id);
      
      if (error) {
        console.error('Error loading user profile:', error);
        setError('Failed to load profile data');
        return;
      }

      if (data) {
        // Profile exists, load it
        setUserProfile(data);
        setIsOnboardingComplete(data.onboarding_complete || false);
        setCurrentStep(data.onboarding_step || 4);
      } else {
        // Profile doesn't exist, create it
        console.log('User profile does not exist, creating new one...');
        const { data: newProfile, error: createError } = await OnboardingService.createUserProfile(user);
        
        if (createError) {
          console.error('Error creating user profile:', createError);
          setError('Failed to create profile');
        } else {
          setUserProfile(newProfile);
          setIsOnboardingComplete(false);
          setCurrentStep(4);
        }
      }
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingData = async (step: number, data: Partial<OnboardingData>): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setError(null);

    try {
      // Save the current step data, but set the onboarding_step to the NEXT step
      // This way, when the user reloads, they'll be taken to the next incomplete screen
      const nextStep = step + 1;
      const { data: updatedProfile, error } = await OnboardingService.saveOnboardingStep(
        user.id,
        nextStep,
        data
      );

      if (error) {
        console.error('Error saving onboarding data:', error);
        setError('Failed to save data. Please try again.');
        return false;
      }

      // Calculate calorie data when all required data is available
      // For maintain weight goals, we can calculate after step 10 (when we have basic data)
      // For other goals, we need to wait until step 12 (when target weight is collected)
      const isMaintainWeight = updatedProfile?.fitness_goal === 'maintain-weight';
      const shouldCalculateCalories = updatedProfile && 
        !updatedProfile.bmr && 
        !updatedProfile.tdee && 
        !updatedProfile.target_calories &&
        ((isMaintainWeight && step >= 10) || (!isMaintainWeight && step >= 12));

      if (shouldCalculateCalories) {
        setTimeout(async () => {
          try {
            await ensureUserHasCalorieData(user.id);
            console.log('Calorie data calculation completed');
          } catch (calorieError) {
            console.error('Failed to calculate calorie data:', calorieError);
            // Don't show error to user since this is a background operation
          }
        }, 100);
      }

      setUserProfile(updatedProfile);
      setCurrentStep(nextStep);
      return true;
    } catch (err) {
      console.error('Unexpected error saving data:', err);
      setError('An unexpected error occurred');
      return false;
    }
  };

  const completeOnboarding = async (): Promise<boolean> => {
    console.log('🏁 completeOnboarding called for user:', user?.id);
    if (!user) {
      console.error('❌ No user found for onboarding completion');
      setError('User not authenticated');
      return false;
    }

    setError(null);

    try {
      console.log('📡 Calling OnboardingService.completeOnboarding');
      const { data: updatedProfile, error } = await OnboardingService.completeOnboarding(user.id);
      console.log('📥 completeOnboarding response:', { data: updatedProfile, error });

      if (error) {
        console.error('❌ Error completing onboarding:', error);
        setError('Failed to complete onboarding. Please try again.');
        return false;
      }

      console.log('✅ Onboarding completed successfully');
      setUserProfile(updatedProfile);
      setIsOnboardingComplete(true);
      setCurrentStep(22);
      return true;
    } catch (err) {
      console.error('💥 Unexpected error completing onboarding:', err);
      setError('An unexpected error occurred');
      return false;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await loadUserProfile();
  };

  const resetOnboarding = async (): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setError(null);

    try {
      const { data: updatedProfile, error } = await OnboardingService.resetOnboarding(user.id);

      if (error) {
        console.error('Error resetting onboarding:', error);
        setError('Failed to reset onboarding. Please try again.');
        return false;
      }

      setUserProfile(updatedProfile);
      setIsOnboardingComplete(false);
      setCurrentStep(4);
      return true;
    } catch (err) {
      console.error('Unexpected error resetting onboarding:', err);
      setError('An unexpected error occurred');
      return false;
    }
  };

  const getNextStep = (): number => {
    if (!userProfile) return 4;
    if (isOnboardingComplete) return -1; // Go to dashboard
    // Return the current step (which is already the next incomplete step)
    return Math.min(22, currentStep);
  };

  const isStepCompleted = (step: number): boolean => {
    if (!userProfile) return false;
    // A step is completed if the current step is greater than the step being checked
    return currentStep > step;
  };

  const value: OnboardingContextType = {
    // State
    userProfile,
    loading,
    error,
    isOnboardingComplete,
    currentStep,
    
    // Actions
    saveOnboardingData,
    completeOnboarding,
    refreshProfile,
    resetOnboarding,
    
    // Utility functions
    getNextStep,
    isStepCompleted,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
