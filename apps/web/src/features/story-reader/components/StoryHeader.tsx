import { forwardRef } from 'react';
import { Loader } from 'lucide-react';

interface StoryChapter {
  node: {
    id: string;
  };
}

interface StoryHeaderProps {
  title?: string | null;
  description?: string | null;
  chapters: StoryChapter[];
  isPro?: boolean;
  onChapterClick: (index: number) => void;
}

export const StoryHeader = forwardRef<HTMLDivElement, StoryHeaderProps>(
  ({ title, description, chapters, isPro = false, onChapterClick }, ref) => {
    const realChapters = chapters.filter((ch) => ch.node.id !== 'loading');
    const hasLoadingChapter = chapters.some((ch) => ch.node.id === 'loading');

    const gradientClass = isPro
      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
      : 'bg-gradient-to-r from-blue-600 to-cyan-600';

    return (
      <div ref={ref} className="sticky top-0 z-20 bg-gray-950 pb-2 pt-4">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          {/* Title */}
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">
              {title || 'Reading Story'}
            </h1>
            <p className="text-sm text-gray-400">
              {description || 'Your adventure awaits'}
            </p>
          </div>

          {/* Chapter Progress Card */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-3 shadow-xl sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="shrink-0 text-xs font-semibold text-gray-300 sm:text-sm">
                Chapter
              </span>
              <div className="flex flex-wrap items-center gap-y-2">
                {realChapters.map((_, idx, arr) => (
                  <div key={idx} className="flex items-center">
                    <button
                      onClick={() => onChapterClick(idx)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110 sm:h-6 sm:w-6 sm:text-xs ${gradientClass}`}
                    >
                      {idx + 1}
                    </button>
                    {idx < arr.length - 1 && (
                      <div className={`h-0.5 w-2 sm:w-3 ${gradientClass}`}></div>
                    )}
                  </div>
                ))}
                {hasLoadingChapter && (
                  <>
                    {realChapters.length > 0 && (
                      <div className="h-0.5 w-2 bg-gray-700 sm:w-3"></div>
                    )}
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 sm:h-6 sm:w-6">
                      <Loader className="h-3 w-3 animate-spin text-gray-400" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoryHeader.displayName = 'StoryHeader';
