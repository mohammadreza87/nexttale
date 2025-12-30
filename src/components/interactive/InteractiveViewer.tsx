import { useRef, useEffect, useState, useCallback } from 'react';
import { Loader, AlertTriangle, Maximize2, Minimize2, RotateCcw, ArrowLeft } from 'lucide-react';

// Fixed frame dimensions (Instagram portrait ratio 4:5)
const FRAME_WIDTH = 1080;
const FRAME_HEIGHT = 1350;

interface InteractiveViewerProps {
  htmlContent: string;
  title: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function InteractiveViewer({
  htmlContent,
  title,
  onLoad,
  onError,
  onBack,
  showBackButton = false,
  className = '',
}: InteractiveViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameWrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState(1);

  // Calculate scale to fit frame in container
  const calculateScale = useCallback(() => {
    if (!frameWrapperRef.current) return;

    const container = frameWrapperRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth - 32; // padding
    const containerHeight = container.clientHeight - 32;

    const scaleX = containerWidth / FRAME_WIDTH;
    const scaleY = containerHeight / FRAME_HEIGHT;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    setScale(newScale);
  }, []);

  // Recalculate scale on resize
  useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [calculateScale]);

  // Create blob URL from HTML content
  useEffect(() => {
    if (!htmlContent) {
      setError('No content to display');
      setLoading(false);
      return;
    }

    // Don't add responsive styles - content is designed for fixed 1080x1350
    const blob = new Blob([htmlContent], { type: 'text/html' });
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
    calculateScale();
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
      // Recalculate scale after fullscreen change
      setTimeout(calculateScale, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [calculateScale]);

  // Reload content
  const handleReload = () => {
    setLoading(true);
    setError(null);
    setKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden bg-gray-950 ${className}`}
    >
      {/* Back button */}
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-white transition-colors hover:bg-black/70"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-gray-400">Loading {title}...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950">
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

      {/* Fixed frame wrapper with scaling */}
      <div
        ref={frameWrapperRef}
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Sandboxed iframe at fixed size */}
        {blobUrl && (
          <iframe
            ref={iframeRef}
            key={key}
            src={blobUrl}
            title={title}
            className="border-0"
            style={{
              width: FRAME_WIDTH,
              height: FRAME_HEIGHT,
            }}
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
}

export default InteractiveViewer;
