import React, { createContext, useContext, useState, useCallback } from 'react';
import { generatePlanViaEdgeFunction, canGeneratePlan } from './planService';

interface PlanGenerationContextType {
  isGeneratingPlan: boolean;
  planGenerationStatus: 'idle' | 'generating' | 'completed' | 'failed';
  planGenerationError: string | null;
  planGenerationStartTime: number | null;
  startPlanGeneration: (userId: string) => Promise<void>;
  resetPlanGeneration: () => void;
}

const PlanGenerationContext = createContext<PlanGenerationContextType | null>(null);

export const usePlanGeneration = () => {
  const context = useContext(PlanGenerationContext);
  if (!context) {
    throw new Error('usePlanGeneration must be used within a PlanGenerationProvider');
  }
  return context;
};

export const PlanGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planGenerationStatus, setPlanGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [planGenerationError, setPlanGenerationError] = useState<string | null>(null);
  const [planGenerationStartTime, setPlanGenerationStartTime] = useState<number | null>(null);

  const startPlanGeneration = useCallback(async (userId: string) => {
    // Check if already generating
    if (isGeneratingPlan) {
      console.log('Plan generation already in progress');
      return;
    }

    // Check if user can generate plan
    const canGenerate = await canGeneratePlan(userId);
    console.log('Can generate plan:', canGenerate);

    if (!canGenerate) {
      console.error('Cannot generate plan: User profile incomplete');
      setPlanGenerationError('User profile is incomplete for plan generation');
      setPlanGenerationStatus('failed');
      return;
    }

    setIsGeneratingPlan(true);
    setPlanGenerationStatus('generating');
    setPlanGenerationError(null);
    setPlanGenerationStartTime(Date.now());

    try {
      console.log('Calling plan generation edge function');
      const response = await generatePlanViaEdgeFunction({
        userId,
        regenerate: false
      });

      console.log('Plan generation response:', response);

      if (response.success) {
        console.log('Plan generation completed successfully');
        setPlanGenerationStatus('completed');
      } else {
        console.error('Plan generation failed:', response.error);
        setPlanGenerationError(response.error || 'Failed to generate plan');
        setPlanGenerationStatus('failed');
      }
    } catch (err) {
      console.error('Error during plan generation:', err);
      setPlanGenerationError(err instanceof Error ? err.message : 'Unknown error occurred');
      setPlanGenerationStatus('failed');
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [isGeneratingPlan]);

  const resetPlanGeneration = useCallback(() => {
    setIsGeneratingPlan(false);
    setPlanGenerationStatus('idle');
    setPlanGenerationError(null);
    setPlanGenerationStartTime(null);
  }, []);

  return (
    <PlanGenerationContext.Provider
      value={{
        isGeneratingPlan,
        planGenerationStatus,
        planGenerationError,
        planGenerationStartTime,
        startPlanGeneration,
        resetPlanGeneration,
      }}
    >
      {children}
    </PlanGenerationContext.Provider>
  );
};
