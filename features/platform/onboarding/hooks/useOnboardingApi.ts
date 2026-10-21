'use client';

import { useRouter } from 'next/navigation';
import { completeOnboarding, runOnboardingAction, startOnboarding, updateOnboardingStatus } from '../actions/onboarding';
import type { OnboardingStep, TemplateType } from './useOnboardingState';

interface OnboardingApiProps {
  selectedTemplate: TemplateType;
  setStep: (step: OnboardingStep) => void;
  setProgressMessage: (message: string) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAllLoading: () => void;
  setAllCompleted: () => void;
  resetOnboardingState: () => void;
}

export function useOnboardingApi({
  selectedTemplate,
  setStep,
  setProgressMessage,
  setError,
  setIsLoading,
  setAllLoading,
  setAllCompleted,
  resetOnboardingState,
}: OnboardingApiProps) {
  const router = useRouter();

  const runOnboarding = async () => {
    resetOnboardingState();
    setIsLoading(true);
    setStep('progress');
    setProgressMessage('Creating your pharmacy...');
    setAllLoading();

    await startOnboarding();

    const result = await runOnboardingAction(selectedTemplate);
    if (!result.success) {
      await updateOnboardingStatus('not_started');
      resetOnboardingState();
      setError(result.error || 'Setup failed');
      setStep('template');
      setIsLoading(false);
      return;
    }

    await completeOnboarding();
    setAllCompleted();
    setProgressMessage('Onboarding complete!');
    setStep('done');
    setIsLoading(false);
    router.refresh();
  };

  return { runOnboarding };
}
