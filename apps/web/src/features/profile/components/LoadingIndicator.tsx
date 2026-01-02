interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
}

export function LoadingIndicator({
  size = 'md',
  colorClass = 'bg-gray-400'
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className="flex gap-2">
      <div
        className={`animate-bounce rounded-full ${sizeClasses[size]} ${colorClass}`}
        style={{ animationDelay: '0ms' }}
      ></div>
      <div
        className={`animate-bounce rounded-full ${sizeClasses[size]} ${colorClass}`}
        style={{ animationDelay: '150ms' }}
      ></div>
      <div
        className={`animate-bounce rounded-full ${sizeClasses[size]} ${colorClass}`}
        style={{ animationDelay: '300ms' }}
      ></div>
    </div>
  );
}

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  itemCount: number;
  loaderRef: React.RefObject<HTMLDivElement>;
  noMoreText?: string;
}

export function InfiniteScrollLoader({
  isLoading,
  hasMore,
  itemCount,
  loaderRef,
  noMoreText = 'No more items',
}: InfiniteScrollLoaderProps) {
  return (
    <div ref={loaderRef} className="flex justify-center py-6">
      {isLoading && <LoadingIndicator size="sm" />}
      {!hasMore && itemCount > 0 && (
        <p className="text-sm text-gray-400">{noMoreText}</p>
      )}
    </div>
  );
}
