/**
 * Onboarding Tour Component
 * Multi-step guided tour with spotlight effect
 */

import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { OnboardingStep } from '../hooks/useOnboarding';

interface OnboardingTourProps {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function OnboardingTour({
  isActive,
  currentStep,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Find target element and calculate position
  const updatePosition = useCallback(() => {
    if (!currentStep) return;

    const targetElement = document.querySelector(currentStep.target);
    if (!targetElement) {
      // If target not found, position tooltip in center
      setTargetRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    setTargetRect(rect);

    // Calculate tooltip position based on step's position preference
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
      default:
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPosition({ top, left });
  }, [currentStep]);

  // Update position on step change or window resize
  useEffect(() => {
    if (!isActive) return;

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, updatePosition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onNext, onPrev, onSkip]);

  if (!isActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0">
        {targetRect ? (
          <svg className="h-full w-full">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#spotlight-mask)"
            />
          </svg>
        ) : (
          <div className="h-full w-full bg-black/75" />
        )}
      </div>

      {/* Spotlight border highlight */}
      {targetRect && (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute z-10 w-80 rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl transition-all duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute right-3 top-3 rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="mb-3 flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i === stepNumber ? 'bg-violet-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="mb-2 text-lg font-semibold text-white">
          {currentStep.title}
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-gray-400">
          {currentStep.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 transition-colors hover:text-gray-300"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {stepNumber > 0 && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              {stepNumber === totalSteps - 1 ? 'Done' : 'Next'}
              {stepNumber < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
