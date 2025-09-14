import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from './OnboardingContext';
import { OnboardingData } from './onboardingService';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { generatePlanViaEdgeFunction, canGeneratePlan } from './planService';

export const useOnboardingNavigation = () => {
  const navigation = useNavigation();
  const { saveOnboardingData, completeOnboarding, error } = useOnboarding();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planGenerationStatus, setPlanGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [planGenerationError, setPlanGenerationError] = useState<string | null>(null);

  const navigateToNextStep = async (
    currentStep: number,
    stepData: Partial<OnboardingData>
  ): Promise<boolean> => {
    console.log('🎯 navigateToNextStep called with:', { currentStep, stepData });
    setIsSaving(true);

    try {
      const success = await saveOnboardingData(currentStep, stepData);
      console.log('📝 saveOnboardingData result:', success);

      if (success) {
        // Check if this is the final onboarding step (22)
        if (currentStep >= 22) {
          console.log('🏁 Completing onboarding and going to dashboard - currentStep:', currentStep);
          // Complete onboarding first
          console.log('📡 Calling completeOnboarding()');
          const completed = await completeOnboarding();
          console.log('📥 completeOnboarding result:', completed);
          if (completed) {
            console.log('✅ Onboarding completed, starting plan generation');
            // Now that onboarding is complete, start plan generation
            if (user) {
              console.log('🚀 Starting plan generation after onboarding completion');
              generatePlanForUser();
            }
            console.log('✅ Navigating to MainTabs');
            navigation.navigate('MainTabs' as never);
            return true;
          } else {
            console.error('❌ Failed to complete onboarding');
          }
        } else if (currentStep === 21) {
          console.log('🔥 Step 21 detected - navigating to screen 22');
          // Navigate to screen 22, but don't trigger plan generation yet
          // Plan generation will be triggered after onboarding is marked complete
          navigation.navigate(`OnboardingScreen${currentStep + 1}` as never);
          return true;
        } else if (currentStep < 22) {
          // Navigate to next onboarding step (only if we haven't reached the final step)
          const nextStep = currentStep + 1;
          console.log('➡️ Navigating to step:', nextStep);
          navigation.navigate(`OnboardingScreen${nextStep}` as never);
          return true;
        } else {
          // Fallback: if we're at step 22 or beyond, just complete onboarding
          console.log('🔄 Fallback: completing onboarding for step:', currentStep);
          const completed = await completeOnboarding();
          if (completed) {
            navigation.navigate('MainTabs' as never);
            return true;
          }
        }
      }

      return false;
    } catch (err) {
      console.error('❌ Navigation error:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const generatePlanForUser = async () => {
    console.log('🎯 generatePlanForUser called');
    if (!user) {
      console.error('❌ No user found for plan generation');
      setPlanGenerationError('User not authenticated');
      setPlanGenerationStatus('failed');
      return;
    }

    console.log('🔍 Checking if user can generate plan:', user.id);
    // Check if user can generate plan
    const canGenerate = await canGeneratePlan(user.id);
    console.log('📊 canGenerate result:', canGenerate);

    if (!canGenerate) {
      console.error('❌ User profile is incomplete for plan generation');
      setPlanGenerationError('User profile is incomplete for plan generation');
      setPlanGenerationStatus('failed');
      return;
    }

    console.log('🚀 Starting plan generation process');
    setIsGeneratingPlan(true);
    setPlanGenerationStatus('generating');
    setPlanGenerationError(null);

    try {
      console.log('📡 Calling generatePlanViaEdgeFunction with userId:', user.id);
      const response = await generatePlanViaEdgeFunction({
        userId: user.id,
        regenerate: false
      });

      console.log('📥 Edge function response:', response);

      if (response.success) {
        console.log('✅ Plan generation completed successfully');
        setPlanGenerationStatus('completed');
      } else {
        console.error('❌ Plan generation failed:', response.error);
        setPlanGenerationError(response.error || 'Failed to generate plan');
        setPlanGenerationStatus('failed');
      }
    } catch (err) {
      console.error('💥 Plan generation error:', err);
      setPlanGenerationError(err instanceof Error ? err.message : 'Unknown error occurred');
      setPlanGenerationStatus('failed');
    } finally {
      setIsGeneratingPlan(false);
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
      console.error('Complete onboarding error:', err);
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
      console.error(`Invalid onboarding step: ${step}. Valid steps are 1-22.`);
      return;
    }
    
    try {
      navigation.navigate(`OnboardingScreen${step}` as never);
    } catch (error) {
      console.warn(`Failed to navigate to OnboardingScreen${step}, retrying...`, error);
      // Retry after a short delay
      setTimeout(() => {
        try {
          navigation.navigate(`OnboardingScreen${step}` as never);
        } catch (retryError) {
          console.error(`Failed to navigate to OnboardingScreen${step} after retry:`, retryError);
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
    generatePlanForUser,
  };
};
