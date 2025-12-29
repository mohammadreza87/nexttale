import { useRef, useEffect, useState } from 'react';
import { Loader, AlertTriangle, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

interface InteractiveViewerProps {
  htmlContent: string;
  title: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function InteractiveViewer({
  htmlContent,
  title,
  onLoad,
  onError,
  className = '',
}: InteractiveViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [key, setKey] = useState(0); // For forcing reload

  // Create blob URL from HTML content
  useEffect(() => {
    if (!htmlContent) {
      setError('No content to display');
      setLoading(false);
      return;
    }

    // Wrap HTML with viewport meta if not present
    let processedHtml = htmlContent;
    if (!processedHtml.includes('viewport')) {
      processedHtml = processedHtml.replace(
        '<head>',
        `<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
      );
    }

    // Add responsive base styles
    const responsiveStyles = `<style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      background: #0a0a0a;
      color: #fff;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: 100dvh;
      padding: 16px;
    }
    /* Make content fill available space */
    #app, #root, #game, .container, .game-container, main {
      width: 100%;
      max-width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    /* Responsive canvas */
    canvas {
      max-width: 100%;
      height: auto;
      touch-action: manipulation;
    }
    /* Touch-friendly buttons */
    button, .btn, [role="button"] {
      min-height: 44px;
      min-width: 44px;
      padding: 12px 24px;
      font-size: 16px;
      touch-action: manipulation;
      cursor: pointer;
    }
    /* Prevent text selection during gameplay */
    .no-select {
      -webkit-user-select: none;
      user-select: none;
    }
  </style>`;

    if (!processedHtml.includes('box-sizing: border-box')) {
      processedHtml = processedHtml.replace('</head>', `${responsiveStyles}\n</head>`);
    }

    const blob = new Blob([processedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent, key]);

  // Handle iframe load
  const handleLoad = () => {
    setLoading(false);
    setError(null);
    onLoad?.();
  };

  // Handle iframe error
  const handleError = () => {
    const errorMsg = 'Failed to load interactive content';
    setError(errorMsg);
    setLoading(false);
    onError?.(errorMsg);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reload content
  const handleReload = () => {
    setLoading(true);
    setError(null);
    setKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-gray-900 ${className}`}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-gray-400">Loading {title}...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <p className="font-semibold text-white">Something went wrong</p>
            <p className="text-sm text-gray-400">{error}</p>
            <button
              onClick={handleReload}
              className="mt-2 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute right-3 top-3 z-20 flex gap-2">
        <button
          onClick={handleReload}
          className="rounded-lg bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          title="Reload"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-lg bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Sandboxed iframe */}
      {blobUrl && (
        <iframe
          ref={iframeRef}
          key={key}
          src={blobUrl}
          title={title}
          className="h-full w-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts"
          // SECURITY: Strict sandbox with only scripts allowed
          // Disabled: allow-same-origin, allow-forms, allow-popups, allow-top-navigation
        />
      )}
    </div>
  );
}

export default InteractiveViewer;
