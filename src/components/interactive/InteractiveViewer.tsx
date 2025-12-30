import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Loader,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RotateCcw,
  ArrowLeft,
  PhoneOff,
} from 'lucide-react';

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
  const [isLandscape, setIsLandscape] = useState(false);

  // Calculate scale to fit frame in container
  const calculateScale = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const safeTop =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
    const safeBottom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0;

    const viewportHeight = window.visualViewport?.height ?? rect.height;
    // Account for side buttons (~80px on right) and some padding
    const availableWidth = Math.max(rect.width - 100, 280);
    // Reserve space for filter bar + bottom actions
    const availableHeight = Math.max(viewportHeight - safeTop - safeBottom - 120, 320);

    const scaleX = availableWidth / FRAME_WIDTH;
    const scaleY = availableHeight / FRAME_HEIGHT;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(Math.max(newScale, 0.25));
  }, []);

  // Recalculate scale on resize
  useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    const viewport = window.visualViewport;
    const handleViewport = () => {
      const vpWidth = viewport?.width ?? window.innerWidth;
      const vpHeight = viewport?.height ?? window.innerHeight;
      const isWide = vpWidth > vpHeight && vpWidth < 1024; // avoid blocking desktop landscape
      setIsLandscape(isWide);
      calculateScale();
    };
    viewport?.addEventListener('resize', handleViewport);

    const orientation = window.screen.orientation;
    orientation?.addEventListener('change', handleViewport);

    handleViewport();

    return () => {
      window.removeEventListener('resize', calculateScale);
      viewport?.removeEventListener('resize', handleViewport);
      orientation?.removeEventListener('change', handleViewport);
    };
  }, [calculateScale]);

  // Observe container size for dynamic scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => calculateScale());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculateScale]);

  // Create blob URL from HTML content with share polyfill
  useEffect(() => {
    if (!htmlContent) {
      setError('No content to display');
      setLoading(false);
      return;
    }

    // Inject a polyfill that redirects share/clipboard calls to parent via postMessage
    const sharePolyfill = `
<script>
(function() {
  // Override navigator.share to use postMessage
  const originalShare = navigator.share?.bind(navigator);
  navigator.share = function(data) {
    return new Promise((resolve, reject) => {
      window.parent.postMessage({
        type: 'INTERACTIVE_SHARE',
        data: data
      }, '*');
      // Resolve after a short delay (assume parent handles it)
      setTimeout(resolve, 100);
    });
  };

  // Also override clipboard.writeText for fallback
  const originalWriteText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
  if (navigator.clipboard) {
    navigator.clipboard.writeText = function(text) {
      return new Promise((resolve, reject) => {
        window.parent.postMessage({
          type: 'INTERACTIVE_COPY',
          text: text
        }, '*');
        setTimeout(resolve, 100);
      });
    };
  }
})();
</script>`;

    // Inject polyfill right after <head> or at the start of the document
    let modifiedHtml = htmlContent;
    if (modifiedHtml.includes('<head>')) {
      modifiedHtml = modifiedHtml.replace('<head>', '<head>' + sharePolyfill);
    } else if (modifiedHtml.includes('<html>')) {
      modifiedHtml = modifiedHtml.replace('<html>', '<html><head>' + sharePolyfill + '</head>');
    } else {
      modifiedHtml = sharePolyfill + modifiedHtml;
    }

    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent, key]);

  // Listen for share/copy messages from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'INTERACTIVE_SHARE') {
        const shareData = event.data.data;
        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            // Fallback to clipboard
            const text = shareData.url || shareData.text || shareData.title || '';
            await navigator.clipboard.writeText(text);
          }
        } catch (err) {
          // User cancelled or share failed - that's ok
          if ((err as Error).name !== 'AbortError') {
            console.error('Share failed:', err);
          }
        }
      } else if (event.data?.type === 'INTERACTIVE_COPY') {
        try {
          await navigator.clipboard.writeText(event.data.text);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  const scaledWidth = FRAME_WIDTH * scale;
  const scaledHeight = FRAME_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden bg-gray-950 ${className}`}
    >
      {/* Orientation hint */}
      {isLandscape && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-white shadow-lg">
            <PhoneOff className="h-5 w-5" />
            <span className="text-sm font-semibold">Rotate your device for the best view</span>
          </div>
        </div>
      )}

      {/* Back button */}
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
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
          aria-label="Reload content"
          className="rounded-lg bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          title="Reload"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="rounded-lg bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
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
          width: scaledWidth,
          height: scaledHeight,
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
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
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
