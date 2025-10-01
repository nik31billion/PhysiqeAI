import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from './OnboardingContext';
import { OnboardingData } from './onboardingService';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { usePlanGeneration } from './PlanGenerationContext';

export const useOnboardingNavigation = () => {
  const navigation = useNavigation();
  const { saveOnboardingData, completeOnboarding, error } = useOnboarding();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { startPlanGeneration, isGeneratingPlan, planGenerationStatus, planGenerationError } = usePlanGeneration();

  const navigateToNextStep = async (
    currentStep: number,
    stepData: Partial<OnboardingData>
  ): Promise<boolean> => {
    
    setIsSaving(true);

    try {
      const success = await saveOnboardingData(currentStep, stepData);
      
      if (success) {
        // Check if this is the final onboarding step (22)
        if (currentStep >= 22) {
          console.log('Final onboarding step reached');
          
          // Complete onboarding first
          const completed = await completeOnboarding();
          
          if (completed) {
            // Now that onboarding is complete, ensure plan generation has started
            if (user && planGenerationStatus === 'idle') {
              startPlanGeneration(user.id);
            }
            
            navigation.navigate('MainTabs' as never);
            return true;
          } else {
            console.log('Failed to complete onboarding');
          }
        } else if (currentStep === 17) {
          // Start plan generation early at screen 17
          console.log('Starting early plan generation at screen 17');
          if (user && planGenerationStatus === 'idle') {
            console.log('Starting plan generation in background');
            startPlanGeneration(user.id);
          }
          
          // Navigate to next screen
          navigation.navigate(`OnboardingScreen${currentStep + 1}` as never);
          return true;
        } else if (currentStep === 21) {
          // Navigate to screen 22
          navigation.navigate(`OnboardingScreen${currentStep + 1}` as never);
          return true;
        } else if (currentStep < 22) {
          // Navigate to next onboarding step
          const nextStep = currentStep + 1;
          navigation.navigate(`OnboardingScreen${nextStep}` as never);
          return true;
        } else {
          // Fallback: if we're at step 22 or beyond, just complete onboarding
          console.log('Completing onboarding (fallback)');
          const completed = await completeOnboarding();
          if (completed) {
            navigation.navigate('MainTabs' as never);
            return true;
          }
        }
      }

      return false;
    } catch (err) {
      console.error('Error in navigateToNextStep:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };


  const completeOnboardingFlow = async (finalData: Partial<OnboardingData>): Promise<boolean> => {
    setIsSaving(true);
    
    try {
      // Save final step data
      const success = await saveOnboardingData(22, finalData);
      
      if (success) {
        // Complete onboarding
        const completed = await completeOnboarding();
        if (completed) {
          navigation.navigate('MainTabs' as never);
          return true;
        }
      }
      
      return false;
    } catch (err) {
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const goToStep = (step: number) => {
    // Only allow navigation to existing onboarding screens (1-22)
    if (step < 1 || step > 22) {
      
      return;
    }
    
    try {
      navigation.navigate(`OnboardingScreen${step}` as never);
    } catch (error) {
      
      // Retry after a short delay
      setTimeout(() => {
        try {
          navigation.navigate(`OnboardingScreen${step}` as never);
        } catch (retryError) {
          
        }
      }, 200);
    }
  };

  return {
    navigateToNextStep,
    completeOnboardingFlow,
    goBack,
    goToStep,
    isSaving,
    error,
    // Plan generation related
    isGeneratingPlan,
    planGenerationStatus,
    planGenerationError,
  };
};
