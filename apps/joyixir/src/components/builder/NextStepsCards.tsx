/**
 * Next Steps Cards Component
 * Card-style suggestion buttons with arrows
 */

import { ArrowRight, Wand2 } from 'lucide-react';
import type { NextStep } from '../../types';

interface NextStepsCardsProps {
  steps: NextStep[];
  onStepClick: (prompt: string) => void;
}

export function NextStepsCards({ steps, onStepClick }: NextStepsCardsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
      <p className="mb-3 text-xs font-medium text-gray-400">
        Next steps you might want
      </p>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => onStepClick(step.prompt)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:border-violet-500/50 hover:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-violet-400" />
              <span>{step.label}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
