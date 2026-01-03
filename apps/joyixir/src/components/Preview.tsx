/**
 * Preview Component
 * Displays the live preview of the game with device sizing
 * Device toggles and refresh moved to BuilderHeader
 */

import { memo, useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, Monitor } from 'lucide-react';
import type { DeviceMode } from './builder/DeviceToggle';

interface PreviewProps {
  url: string | null;
  isLoading?: boolean;
  deviceMode?: DeviceMode;
  refreshKey?: number;
  className?: string;
}

const DEVICE_SIZES: Record<DeviceMode, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '667px' },
};

export const Preview = memo(function Preview({
  url,
  isLoading = false,
  deviceMode = 'desktop',
  refreshKey = 0,
  className = '',
}: PreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const deviceSize = DEVICE_SIZES[deviceMode];

  return (
    <div
      className={`
        relative flex flex-col bg-gray-900
        ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}
        ${className}
      `}
    >
      {/* Fullscreen toggle overlay - positioned in top-right corner */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        {url && (
          <button
            onClick={handleOpenExternal}
            className="rounded bg-gray-800/80 p-1.5 text-gray-400 backdrop-blur-sm transition-colors hover:bg-gray-700 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleFullscreen}
          className="rounded bg-gray-800/80 p-1.5 text-gray-400 backdrop-blur-sm transition-colors hover:bg-gray-700 hover:text-white"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Preview content */}
      <div className="relative flex-1 overflow-hidden">
        {url ? (
          <div className="flex h-full w-full items-center justify-center overflow-auto bg-gray-950 p-4">
            <div
              style={{
                width: deviceSize.width,
                height: deviceSize.height,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              className={`overflow-hidden rounded-lg bg-white shadow-2xl ${
                deviceMode !== 'desktop' ? 'border-8 border-gray-800' : ''
              }`}
            >
              <iframe
                key={refreshKey}
                src={url}
                className="h-full w-full"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              {isLoading ? (
                <>
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                  <p className="text-gray-400">Starting development server...</p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800">
                    <Monitor className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">No preview available</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate a project to see the live preview
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
