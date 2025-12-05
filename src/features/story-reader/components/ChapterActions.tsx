import { Play, Pause, Pen, Loader } from 'lucide-react';

interface ChapterActionsProps {
  isPro: boolean;
  isOwner: boolean;
  isEditMode: boolean;
  narratorEnabled: boolean;
  isPlaying: boolean;
  isAudioLoading: boolean;
  onPlay: () => void;
  onEdit: () => void;
}

export function ChapterActions({
  isPro,
  isOwner,
  isEditMode,
  narratorEnabled,
  isPlaying,
  isAudioLoading,
  onPlay,
  onEdit,
}: ChapterActionsProps) {
  const buttonBaseClass = isPro
    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
    : 'bg-gradient-to-r from-blue-600 to-cyan-600';

  const editButtonClass = isPro
    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-md'
    : 'border-2 border-dashed border-blue-500 text-blue-500 hover:bg-blue-900/30';

  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      {isOwner && (
        <button
          onClick={onEdit}
          className={`rounded-full p-2 transition-colors ${editButtonClass}`}
          aria-label="Edit chapter"
        >
          <Pen className="h-4 w-4" />
        </button>
      )}

      {!isEditMode && narratorEnabled && (
        <button
          onClick={onPlay}
          className={`rounded-full p-2 text-white shadow-md transition-colors hover:opacity-90 ${buttonBaseClass}`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isAudioLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
