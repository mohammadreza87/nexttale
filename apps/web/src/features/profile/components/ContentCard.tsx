import {
  Loader,
  Trash2,
  Globe,
  Lock,
  Share2,
  CheckCircle,
  AlertCircle,
  User,
  Gamepad2,
  Music,
  Play,
} from 'lucide-react';

type ContentType = 'story' | 'completed' | 'interactive' | 'music';

interface ContentCardProps {
  id: string;
  title: string;
  type: ContentType;
  imageUrl?: string | null;
  isPro: boolean;
  isPublic?: boolean;
  // Type-specific props
  contentTypeLabel?: string; // For interactive
  genre?: string; // For music
  audioUrl?: string; // For music
  generationStatus?: string; // For story
  isCompleted?: boolean; // For completed stories
  // Actions
  isDeleting?: boolean;
  isUpdatingVisibility?: boolean;
  canToggleVisibility?: boolean;
  onClick?: () => void;
  onShare?: (e: React.MouseEvent) => void;
  onToggleVisibility?: () => void;
  onDelete?: () => void;
}

export function ContentCard({
  id,
  title,
  type,
  imageUrl,
  isPro,
  isPublic = true,
  contentTypeLabel,
  genre,
  audioUrl,
  generationStatus,
  isCompleted,
  isDeleting,
  isUpdatingVisibility,
  canToggleVisibility = true,
  onClick,
  onShare,
  onToggleVisibility,
  onDelete,
}: ContentCardProps) {
  const gradientClass = isPro
    ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900'
    : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900';

  const renderIcon = () => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-white" />;
      case 'interactive':
        return <Gamepad2 className="h-12 w-12 text-white" />;
      case 'music':
        return <Music className="h-12 w-12 text-white" />;
      default:
        return <User className="h-12 w-12 text-white" />;
    }
  };

  return (
    <div
      key={id}
      className={`overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-md transition-all duration-300 ${onClick ? 'transform cursor-pointer hover:shadow-lg active:scale-95' : ''}`}
      onClick={onClick}
    >
      <div className={`relative flex aspect-square items-center justify-center ${gradientClass}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          renderIcon()
        )}

        {/* Type badge for interactive */}
        {type === 'interactive' && contentTypeLabel && (
          <div className="absolute left-2 top-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
            {contentTypeLabel}
          </div>
        )}

        {/* Genre badge for music */}
        {type === 'music' && genre && (
          <div className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-medium text-white">
            {genre}
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Failed status overlay */}
        {generationStatus === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/70">
            <div className="text-center text-white">
              <AlertCircle className="mx-auto mb-1 h-8 w-8" />
              <span className="text-xs font-semibold">Failed</span>
            </div>
          </div>
        )}

        {/* Play button overlay for interactive */}
        {type === 'interactive' && onClick && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
              <Play className="h-8 w-8 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Audio player for music */}
        {type === 'music' && audioUrl && (
          <audio
            src={audioUrl}
            controls
            className="absolute bottom-2 left-2 right-2 h-8"
            style={{ opacity: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      <div className="p-3">
        <h3 className="mb-2 line-clamp-1 text-sm font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Share button */}
          {onShare && (
            <button
              onClick={onShare}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}

          {/* Visibility toggle */}
          {onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canToggleVisibility) {
                  onToggleVisibility();
                }
              }}
              disabled={isUpdatingVisibility || !canToggleVisibility}
              className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 disabled:opacity-50 ${!canToggleVisibility ? 'cursor-not-allowed' : ''}`}
              title={
                canToggleVisibility
                  ? isPublic
                    ? 'Public (tap to change)'
                    : 'Private (tap to change)'
                  : 'Pro only: change visibility'
              }
            >
              {isUpdatingVisibility ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : isPublic ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
              title="Delete"
            >
              {isDeleting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
