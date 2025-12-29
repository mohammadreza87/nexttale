import { useEffect, useRef, type RefObject } from 'react';

interface SwipeConfig {
  threshold?: number; // Minimum distance for swipe detection (default: 50px)
  velocityThreshold?: number; // Minimum velocity for swipe detection (default: 0.3)
}

type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export function useSwipeGesture(
  ref: RefObject<HTMLElement>,
  onSwipe: (direction: SwipeDirection) => void,
  config: SwipeConfig = {}
) {
  const { threshold = 50, velocityThreshold = 0.3 } = config;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      touchEndRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Calculate velocity
      const velocityX = absX / deltaTime;
      const velocityY = absY / deltaTime;

      // Determine if this is a vertical or horizontal swipe
      if (absY > absX) {
        // Vertical swipe
        if (absY >= threshold || velocityY >= velocityThreshold) {
          if (deltaY < 0) {
            onSwipe('up');
          } else {
            onSwipe('down');
          }
        }
      } else {
        // Horizontal swipe
        if (absX >= threshold || velocityX >= velocityThreshold) {
          if (deltaX < 0) {
            onSwipe('left');
          } else {
            onSwipe('right');
          }
        }
      }

      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Also handle mouse events for desktop testing
    let isMouseDown = false;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      touchStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      touchEndRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
    };

    const handleMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      handleTouchEnd();
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [ref, onSwipe, threshold, velocityThreshold]);
}

// Hook for keyboard navigation (useful for desktop)
export function useKeyboardNavigation(onNavigate: (direction: 'up' | 'down') => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        onNavigate('up');
      } else if (e.key === 'ArrowDown' || e.key === 'j' || e.key === ' ') {
        e.preventDefault();
        onNavigate('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);
}

// Hook for scroll wheel navigation
export function useWheelNavigation(
  ref: RefObject<HTMLElement>,
  onNavigate: (direction: 'up' | 'down') => void,
  debounceMs: number = 300
) {
  const lastScrollTime = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < debounceMs) return;

      if (Math.abs(e.deltaY) > 30) {
        lastScrollTime.current = now;
        if (e.deltaY > 0) {
          onNavigate('down');
        } else {
          onNavigate('up');
        }
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [ref, onNavigate, debounceMs]);
}
