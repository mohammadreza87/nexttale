/**
 * Device Toggle Component
 * Desktop/Tablet/Mobile toggle group for preview device mode
 */

import { Monitor, Tablet, Smartphone, RefreshCw } from 'lucide-react';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface DeviceToggleProps {
  mode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DeviceToggle({
  mode,
  onChange,
  onRefresh,
  isLoading = false,
  disabled = false,
}: DeviceToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Device mode buttons */}
      <div className="flex items-center rounded-lg bg-gray-800 p-1">
        <button
          onClick={() => onChange('desktop')}
          disabled={disabled}
          className={`rounded p-1.5 transition-colors ${
            mode === 'desktop'
              ? 'bg-violet-600 text-white'
              : 'text-gray-400 hover:text-white'
          } disabled:opacity-50`}
          title="Desktop"
        >
          <Monitor className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChange('tablet')}
          disabled={disabled}
          className={`rounded p-1.5 transition-colors ${
            mode === 'tablet'
              ? 'bg-violet-600 text-white'
              : 'text-gray-400 hover:text-white'
          } disabled:opacity-50`}
          title="Tablet"
        >
          <Tablet className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChange('mobile')}
          disabled={disabled}
          className={`rounded p-1.5 transition-colors ${
            mode === 'mobile'
              ? 'bg-violet-600 text-white'
              : 'text-gray-400 hover:text-white'
          } disabled:opacity-50`}
          title="Mobile"
        >
          <Smartphone className="h-4 w-4" />
        </button>
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={disabled}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
          title="Refresh preview"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
