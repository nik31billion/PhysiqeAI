import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from './OnboardingContext';
import { OnboardingData } from './onboardingService';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { usePlanGeneration } from './PlanGenerationContext';
import { logOnboardingStep, logOnboardingCompleted, logPaymentScreenSkipped } from './analyticsService';
import { captureException, addBreadcrumb } from './sentryConfig';

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
    addBreadcrumb('Navigating to next onboarding step', 'onboarding', {
      currentStep,
      stepName: `OnboardingScreen${currentStep}`,
      hasData: Object.keys(stepData).length > 0,
    });
    
    setIsSaving(true);

    try {
      const success = await saveOnboardingData(currentStep, stepData);
      
      // Track onboarding step completion - fire and forget (no await)
      logOnboardingStep(currentStep, `OnboardingScreen${currentStep}`);
      
      if (success) {
        // Check if this is the final onboarding step (22)
        if (currentStep >= 22) {
          console.log('Final onboarding step reached');
          
          // Complete onboarding first
          const completed = await completeOnboarding();
          
          if (completed) {
            // Track onboarding completion - fire and forget (no await)
            logOnboardingCompleted(0, 22); // Will be calculated properly later
            
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
        } else if (currentStep === 20) {
          // PAYMENT SCREEN DISABLED - Skip Screen 21 (payment) and go directly to Screen 22 (welcome)
          console.log('Skipping payment screen, navigating directly to OnboardingScreen22');
          
          // Track payment screen skip - fire and forget (no await)
          logPaymentScreenSkipped();
          
          navigation.navigate('OnboardingScreen22' as never);
          return true;
        } else if (currentStep === 21) {
          // This should never be reached since Screen 21 is disabled, but keeping as fallback
          console.log('Warning: Screen 21 reached but should be disabled. Navigating to Screen 22');
          navigation.navigate('OnboardingScreen22' as never);
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
      captureException(err instanceof Error ? err : new Error(String(err)), {
        onboarding: {
          operation: 'navigateToNextStep',
          currentStep,
          stepName: `OnboardingScreen${currentStep}`,
          userId: user?.id,
          errorType: 'exception',
        },
      });
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
      captureException(err instanceof Error ? err : new Error(String(err)), {
        onboarding: {
          operation: 'completeOnboardingFlow',
          userId: user?.id,
          errorType: 'exception',
        },
      });
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
      addBreadcrumb('Navigating to onboarding step', 'onboarding', { step });
      navigation.navigate(`OnboardingScreen${step}` as never);
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        onboarding: {
          operation: 'goToStep',
          step,
          userId: user?.id,
          errorType: 'navigation',
        },
      });
      
      // Retry after a short delay
      setTimeout(() => {
        try {
          navigation.navigate(`OnboardingScreen${step}` as never);
        } catch (retryError) {
          captureException(retryError instanceof Error ? retryError : new Error(String(retryError)), {
            onboarding: {
              operation: 'goToStep',
              step,
              userId: user?.id,
              errorType: 'navigation_retry',
            },
          });
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
