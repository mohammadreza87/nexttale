import { Loader, Sparkles } from 'lucide-react';

interface ChapterImageProps {
  imageUrl: string | null | undefined;
  isGenerating: boolean;
  chapterNumber: number;
  isPro: boolean;
  alt?: string;
}

export function ChapterImage({
  imageUrl,
  isGenerating,
  chapterNumber,
  isPro,
  alt = 'Chapter illustration',
}: ChapterImageProps) {
  const gradientClass = isPro
    ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50'
    : 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50';

  const iconClass = isPro ? 'text-purple-400' : 'text-blue-400';
  const textClass = isPro ? 'text-purple-300' : 'text-blue-300';
  const badgeClass = isPro
    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
    : 'bg-gradient-to-r from-blue-600 to-cyan-600';

  return (
    <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl">
      {/* Gradient placeholder background */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center ${gradientClass}`}
      >
        {isGenerating ? (
          <>
            <Loader className={`h-6 w-6 animate-spin ${iconClass}`} />
            <span className={`mt-2 text-sm font-medium ${textClass}`}>Creating illustration...</span>
          </>
        ) : (
          !imageUrl && <Sparkles className={`h-10 w-10 ${isPro ? 'text-purple-500' : 'text-blue-500'}`} />
        )}
      </div>

      {/* Actual image - shown when available */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          className="relative z-[1] h-full w-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {/* Chapter number badge */}
      <div
        className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ${badgeClass}`}
      >
        {chapterNumber}
      </div>
    </div>
  );
}
