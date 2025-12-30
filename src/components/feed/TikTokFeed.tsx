import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader, ChevronUp, ChevronDown } from 'lucide-react';
import {
  useSwipeGesture,
  useKeyboardNavigation,
  useWheelNavigation,
} from '../../hooks/useSwipeGesture';
import { getUnifiedFeed } from '../../lib/feedService';
import { FeedFilters } from './FeedFilters';
import { StoryFeedCard } from './StoryFeedCard';
import { InteractiveFeedCard } from './InteractiveFeedCard';
import type { FeedItem, FeedFilter } from '../../lib/interactiveTypes';

interface TikTokFeedProps {
  userId: string;
  initialFilter?: FeedFilter;
  onSelectStory: (storyId: string) => void;
  onSelectInteractive: (contentId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export function TikTokFeed({
  userId,
  initialFilter = 'all',
  onSelectStory,
  onSelectInteractive,
  onViewProfile,
}: TikTokFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load feed items
  const loadFeed = useCallback(
    async (reset: boolean = false) => {
      if (reset) {
        setLoading(true);
        setCurrentIndex(0);
      }

      try {
        const result = await getUnifiedFeed(filter, 10, reset ? 0 : items.length);

        if (reset) {
          setItems(result.data);
        } else {
          setItems((prev) => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, items.length]
  );

  // Initial load and filter change
  useEffect(() => {
    loadFeed(true);
  }, [filter]);

  // Load more when near end
  useEffect(() => {
    if (currentIndex >= items.length - 3 && hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      loadFeed(false);
    }
  }, [currentIndex, items.length, hasMore, loadingMore, loading, loadFeed]);

  // Navigate between items
  const navigate = useCallback(
    (direction: 'up' | 'down') => {
      if (isTransitioning) return;

      setIsTransitioning(true);

      if (direction === 'down' && currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (direction === 'up' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }

      setTimeout(() => setIsTransitioning(false), 400);
    },
    [currentIndex, items.length, isTransitioning]
  );

  // Handle swipe
  const handleSwipe = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (direction === 'up') {
        navigate('down'); // Swipe up = go to next (down in list)
      } else if (direction === 'down') {
        navigate('up'); // Swipe down = go to previous (up in list)
      }
    },
    [navigate]
  );

  // Attach gesture handlers
  useSwipeGesture(containerRef, handleSwipe);
  useKeyboardNavigation((dir) => navigate(dir === 'up' ? 'up' : 'down'));
  useWheelNavigation(containerRef, navigate);

  // Handle item selection
  const handleSelect = (item: FeedItem) => {
    if (item.feed_type === 'story') {
      onSelectStory(item.id);
    } else {
      onSelectInteractive(item.id);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="p-6 text-center">
          <p className="mb-2 text-lg text-white">No content yet</p>
          <p className="text-sm text-gray-400">Be the first to create something amazing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full justify-center bg-black">
      {/* Constrain feed width on desktop for better UX */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[480px] select-none overflow-hidden rounded-3xl bg-black"
        style={{ height: 'min(90vh, 820px)', aspectRatio: '4 / 5' }}
      >
        {/* Filter tabs */}
        <div className="absolute left-0 right-0 top-0 z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6 pt-2">
          <FeedFilters currentFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Feed cards container */}
        <div
          className="duration-400 h-full transition-transform ease-out"
          style={{
            transform: `translateY(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="relative h-full w-full">
              {item.feed_type === 'story' ? (
                <StoryFeedCard
                  item={item}
                  isActive={index === currentIndex}
                  onSelect={() => handleSelect(item)}
                  onViewProfile={onViewProfile}
                  userId={userId}
                />
              ) : (
                <InteractiveFeedCard
                  item={item}
                  isActive={index === currentIndex}
                  onSelect={() => handleSelect(item)}
                  onViewProfile={onViewProfile}
                  userId={userId}
                />
              )}
            </div>
          ))}
        </div>

        {/* Navigation hints */}
        <div className="absolute right-4 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2">
          {/* Up indicator */}
          {currentIndex > 0 && (
            <button
              onClick={() => navigate('up')}
              className="rounded-full bg-black/30 p-2 text-white/60 transition-all hover:bg-black/50 hover:text-white"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}

          {/* Progress dots */}
          <div className="flex flex-col gap-1 py-2">
            {items.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, i) => {
              const actualIndex = Math.max(0, currentIndex - 2) + i;
              return (
                <div
                  key={actualIndex}
                  className={`w-1.5 rounded-full transition-all duration-200 ${
                    actualIndex === currentIndex ? 'h-4 bg-white' : 'h-2 bg-white/30'
                  }`}
                />
              );
            })}
          </div>

          {/* Down indicator */}
          {currentIndex < items.length - 1 && (
            <button
              onClick={() => navigate('down')}
              className="rounded-full bg-black/30 p-2 text-white/60 transition-all hover:bg-black/50 hover:text-white"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="absolute bottom-20 left-1/2 z-40 -translate-x-1/2">
            <Loader className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        )}

        {/* Swipe hint for first-time users */}
        {currentIndex === 0 && items.length > 1 && (
          <div className="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 animate-bounce">
            <div className="flex flex-col items-center text-white/60">
              <ChevronUp className="h-6 w-6" />
              <span className="text-xs">Swipe up</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TikTokFeed;
