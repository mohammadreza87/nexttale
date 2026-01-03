/**
 * Resizable Panels Component
 * Two-panel layout with draggable divider for resizing (Lovable-style)
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number; // in pixels
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 420,
  minLeftWidth = 320,
  maxLeftWidth = 600,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Clamp to min/max bounds
      const clampedWidth = Math.min(Math.max(newWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(clampedWidth);
    },
    [isResizing, minLeftWidth, maxLeftWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove document listeners for drag
  useState(() => {
    if (typeof document === 'undefined') return;

    const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onMouseUp = () => handleMouseUp();

    if (isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  });

  // Use effect for proper event handling
  const dragHandlers = useRef({
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  });
  dragHandlers.current = { onMouseMove: handleMouseMove, onMouseUp: handleMouseUp };

  // Attach listeners when resizing starts
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ev.clientX - containerRect.left;
      const clampedWidth = Math.min(Math.max(newWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(clampedWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [minLeftWidth, maxLeftWidth]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* Left Panel */}
      <div
        className="flex h-full shrink-0 flex-col overflow-hidden"
        style={{ width: leftWidth }}
      >
        {leftPanel}
      </div>

      {/* Resizable Divider */}
      <div
        onMouseDown={startResize}
        className={`group relative flex h-full w-1 shrink-0 cursor-col-resize items-center justify-center bg-gray-800 transition-colors hover:bg-violet-500 ${
          isResizing ? 'bg-violet-500' : ''
        }`}
      >
        {/* Visual indicator */}
        <div
          className={`absolute h-8 w-1 rounded-full bg-gray-600 transition-colors group-hover:bg-violet-400 ${
            isResizing ? 'bg-violet-400' : ''
          }`}
        />
      </div>

      {/* Right Panel */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
