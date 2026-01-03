/**
 * Dependency Banner Component
 * Shows warning when dependencies are outdated
 */

import { useState } from 'react';
import { AlertTriangle, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { OutdatedDependency } from '../../lib/webcontainer';

interface DependencyBannerProps {
  outdated: OutdatedDependency[];
  isUpdating: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function DependencyBanner({
  outdated,
  isUpdating,
  onUpdate,
  onDismiss,
}: DependencyBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (outdated.length === 0) return null;

  return (
    <div className="border-b border-yellow-800/50 bg-yellow-900/20">
      {/* Main banner */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-200">
            {outdated.length} package{outdated.length !== 1 ? 's' : ''} can be updated
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"
          >
            {isExpanded ? (
              <>
                Hide details <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show details <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUpdate}
            disabled={isUpdating}
            className="flex items-center gap-1.5 rounded-lg bg-yellow-600/20 px-3 py-1 text-xs font-medium text-yellow-300 transition-colors hover:bg-yellow-600/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Update All'}
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-yellow-500 transition-colors hover:bg-yellow-600/20 hover:text-yellow-300"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-yellow-800/30 px-4 py-3">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="font-medium text-yellow-400">Package</div>
            <div className="font-medium text-yellow-400">Current</div>
            <div className="font-medium text-yellow-400">Wanted</div>
            <div className="font-medium text-yellow-400">Latest</div>
          </div>
          <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {outdated.map((dep) => (
              <div key={dep.name} className="grid grid-cols-4 gap-2 text-xs">
                <div className="truncate text-yellow-200" title={dep.name}>
                  {dep.name}
                </div>
                <div className="text-gray-400">{dep.current}</div>
                <div className="text-yellow-300">{dep.wanted}</div>
                <div className="text-green-400">{dep.latest}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
