/**
 * Credits Panel Component
 * Credits indicator with "Add credits" button
 */

import { Zap, X } from 'lucide-react';

interface CreditsPanelProps {
  creditsRemaining: number;
  onAddCredits: () => void;
  onDismiss: () => void;
  isDismissed?: boolean;
}

export function CreditsPanel({
  creditsRemaining,
  onAddCredits,
  onDismiss,
  isDismissed = false,
}: CreditsPanelProps) {
  if (isDismissed) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/80 px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-gray-400">
          <span className="font-medium text-gray-300">{creditsRemaining}</span>{' '}
          credits remaining
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAddCredits}
          className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-500"
        >
          Add credits
        </button>
        <button
          onClick={onDismiss}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
