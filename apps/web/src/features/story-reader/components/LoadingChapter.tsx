interface LoadingChapterProps {
  isPro?: boolean;
}

export function LoadingChapter({ isPro = false }: LoadingChapterProps) {
  const dotColor = isPro ? 'bg-purple-500' : 'bg-blue-500';

  return (
    <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
        <div className="space-y-1 text-center">
          <h3 className="text-lg font-bold text-white">Crafting your story...</h3>
          <p className="text-sm text-gray-400">The AI is writing what happens next</p>
        </div>
        <div className="flex gap-2">
          <div
            className={`h-2 w-2 animate-bounce rounded-full ${dotColor}`}
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className={`h-2 w-2 animate-bounce rounded-full ${dotColor}`}
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className={`h-2 w-2 animate-bounce rounded-full ${dotColor}`}
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
