import { Loader } from 'lucide-react';

interface StoryProgressProps {
  chaptersCount: number;
  hasLoadingChapter: boolean;
  isPro: boolean;
  onChapterClick: (index: number) => void;
}

export function StoryProgress({
  chaptersCount,
  hasLoadingChapter,
  isPro,
  onChapterClick,
}: StoryProgressProps) {
  const dotClass = isPro
    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
    : 'bg-gradient-to-r from-blue-600 to-cyan-600';

  const lineClass = isPro
    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
    : 'bg-gradient-to-r from-blue-600 to-cyan-600';

  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-900 p-3 shadow-xl sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="shrink-0 text-xs font-semibold text-gray-300 sm:text-sm">Chapter</span>
        <div className="flex flex-wrap items-center gap-y-2">
          {Array.from({ length: chaptersCount }).map((_, idx) => (
            <div key={idx} className="flex items-center">
              <button
                onClick={() => onChapterClick(idx)}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110 sm:h-6 sm:w-6 sm:text-xs ${dotClass}`}
              >
                {idx + 1}
              </button>
              {idx < chaptersCount - 1 && (
                <div className={`h-0.5 w-2 sm:w-3 ${lineClass}`} />
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {hasLoadingChapter && (
            <>
              {chaptersCount > 0 && <div className="h-0.5 w-2 bg-gray-700 sm:w-3" />}
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 sm:h-6 sm:w-6">
                <Loader className="h-3 w-3 animate-spin text-gray-400" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
