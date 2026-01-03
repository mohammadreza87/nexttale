/**
 * Onboarding State Hook
 * Tracks whether user has seen the onboarding tour
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'joyixir-onboarding-completed';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'chat-input',
    target: '[data-onboarding="chat-input"]',
    title: 'Describe your game idea',
    description: 'Type what kind of game you want to create. Be as specific as you like - the AI will understand!',
    position: 'right',
  },
  {
    id: 'templates',
    target: '[data-onboarding="templates"]',
    title: 'Or start from a template',
    description: 'Choose from pre-built game templates to get started quickly.',
    position: 'top',
  },
  {
    id: 'preview',
    target: '[data-onboarding="preview"]',
    title: 'See your game live',
    description: 'Your game appears here in real-time as the AI builds it. You can interact with it immediately!',
    position: 'left',
  },
  {
    id: 'code-button',
    target: '[data-onboarding="code-button"]',
    title: 'View and edit the code',
    description: 'Click here to see the generated code. You can make manual edits if you want.',
    position: 'top',
  },
  {
    id: 'publish',
    target: '[data-onboarding="publish"]',
    title: 'Share your creation',
    description: 'When you\'re happy with your game, publish it to share with others!',
    position: 'bottom',
  },
];

export interface UseOnboardingReturn {
  hasSeenOnboarding: boolean;
  isOnboardingActive: boolean;
  currentStep: number;
  currentStepData: OnboardingStep | null;
  totalSteps: number;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Persist completion state
  useEffect(() => {
    if (hasSeenOnboarding) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [hasSeenOnboarding]);

  const startOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Last step - complete onboarding
      setIsOnboardingActive(false);
      setHasSeenOnboarding(true);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setHasSeenOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setHasSeenOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSeenOnboarding(false);
    setCurrentStep(0);
    setIsOnboardingActive(false);
  }, []);

  return {
    hasSeenOnboarding,
    isOnboardingActive,
    currentStep,
    currentStepData: isOnboardingActive ? ONBOARDING_STEPS[currentStep] : null,
    totalSteps: ONBOARDING_STEPS.length,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}
