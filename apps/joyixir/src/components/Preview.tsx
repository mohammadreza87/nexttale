import { memo, useState } from 'react';
import { RefreshCw, Maximize2, Minimize2, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';

interface PreviewProps {
  url: string | null;
  isLoading?: boolean;
  className?: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceMode, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '667px' },
};

export const Preview = memo(function Preview({
  url,
  isLoading = false,
  className = '',
}: PreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const deviceSize = DEVICE_SIZES[deviceMode];

  return (
    <div
      className={`
        flex flex-col bg-gray-900
        ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}
        ${className}
      `}
    >
      {/* Preview toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`rounded p-1.5 transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Desktop"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`rounded p-1.5 transition-colors ${
                deviceMode === 'tablet'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Tablet"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`rounded p-1.5 transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Mobile"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {url && (
            <span className="max-w-[200px] truncate text-xs text-gray-500">
              {url}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={!url}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenExternal}
            disabled={!url}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
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
