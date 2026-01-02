import { Play, Pause, Sparkles, Loader, Pen, Film, Save, X } from 'lucide-react';
import type { StoryNode } from '../../../lib/types';

interface ChapterCardProps {
  chapterIndex: number;
  node: StoryNode;
  imageUrl?: string | null;
  generatingImage?: boolean;
  videoUrl?: string | null;
  generatingVideo?: boolean;
  isPro: boolean;
  isOwner: boolean;
  hasEditMode: boolean;
  hasVideoClips: boolean;
  videoEnabled?: boolean;
  narratorEnabled?: boolean;
  isEditMode: boolean;
  isPlaying: boolean;
  isAudioLoading: boolean;
  currentWordIndex: number;
  playingChapterId: string | null;
  storyTitle?: string;
  // Edit mode props
  isEditing?: boolean;
  editedContent?: string;
  onContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  // Action callbacks
  onToggleSpeech: (text: string, nodeId: string) => void;
  onStartEditing: () => void;
  onShowUpgrade: () => void;
  onStartVideoGeneration: (nodeId: string, imageUrl: string, prompt: string) => void;
}

export function ChapterCard({
  chapterIndex,
  node,
  imageUrl,
  generatingImage,
  videoUrl,
  generatingVideo,
  isPro,
  isOwner,
  hasEditMode,
  hasVideoClips,
  videoEnabled,
  narratorEnabled,
  isEditMode,
  isPlaying,
  isAudioLoading,
  currentWordIndex,
  playingChapterId,
  storyTitle,
  isEditing = false,
  editedContent = '',
  onContentChange,
  onSaveEdit,
  onCancelEdit,
  onToggleSpeech,
  onStartEditing,
  onShowUpgrade,
  onStartVideoGeneration,
}: ChapterCardProps) {
  const nodeVideoUrl = videoUrl || node.video_url;

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
      <div className="p-6">
        {/* Image placeholder - always shown */}
        <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl">
          {/* Gradient placeholder background */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${isPro ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50'}`}
          >
            {generatingImage ? (
              <>
                <Loader
                  className={`h-6 w-6 animate-spin ${isPro ? 'text-purple-400' : 'text-blue-400'}`}
                />
                <span
                  className={`mt-2 text-sm font-medium ${isPro ? 'text-purple-300' : 'text-blue-300'}`}
                >
                  Creating illustration...
                </span>
              </>
            ) : (
              !imageUrl && (
                <Sparkles className={`h-10 w-10 ${isPro ? 'text-purple-500' : 'text-blue-500'}`} />
              )
            )}
          </div>
          {/* Actual image - shown when available */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`Chapter ${chapterIndex + 1} illustration`}
              className="relative z-[1] h-full w-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {/* Chapter number badge */}
          <div
            className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
          >
            {chapterIndex + 1}
          </div>
        </div>

        {/* Video section - Max plan users only */}
        {hasVideoClips && videoEnabled && imageUrl && (
          <div className="mb-6">
            {nodeVideoUrl ? (
              <div className="overflow-hidden rounded-2xl">
                <video
                  src={nodeVideoUrl}
                  className="aspect-video w-full object-cover"
                  controls
                  playsInline
                  loop
                  muted
                  poster={imageUrl}
                />
              </div>
            ) : generatingVideo ? (
              <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                <Film className="mb-2 h-8 w-8 text-purple-400" />
                <Loader className="mb-2 h-5 w-5 animate-spin text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Creating video clip...</span>
                <span className="mt-1 text-xs text-purple-400">This may take a few minutes</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (imageUrl) {
                    onStartVideoGeneration(
                      node.id,
                      imageUrl,
                      `Cinematic scene from ${storyTitle || 'story'}: ${node.content.substring(0, 100)}`
                    );
                  }
                }}
                className="group flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-pink-900/30 transition-all hover:bg-purple-900/40"
              >
                <Film className="h-10 w-10 text-purple-400 transition-transform group-hover:scale-110" />
                <span className="mt-2 text-sm font-medium text-purple-300">Generate Video Clip</span>
                <span className="text-xs text-purple-400">Pro feature</span>
              </button>
            )}
          </div>
        )}

        {/* Edit mode UI */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Chapter Content
              </label>
              <textarea
                value={editedContent}
                onChange={(e) => onContentChange?.(e.target.value)}
                className="h-48 w-full rounded-xl border-2 border-gray-700 bg-gray-800 p-4 text-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="Enter chapter content..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSaveEdit}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Content with word highlighting */}
            <div className="prose max-w-none">
              <p className="text-base leading-relaxed text-gray-300">
                {node.content.split(/\s+/).map((word, index) => (
                  <span key={index}>
                    <span
                      className={`transition-all duration-200 ${
                        playingChapterId === node.id && index === currentWordIndex
                          ? 'rounded bg-yellow-300 px-1 font-semibold text-gray-900'
                          : ''
                      }`}
                    >
                      {word}
                    </span>{' '}
                  </span>
                ))}
              </p>
            </div>

            {/* Action buttons at bottom */}
            <div className="mt-4 flex items-center justify-end gap-2">
              {isOwner && (
                <button
                  onClick={() => {
                    if (hasEditMode) {
                      onStartEditing();
                    } else {
                      onShowUpgrade();
                    }
                  }}
                  className={`rounded-full p-2 transition-colors ${hasEditMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:opacity-90' : 'border-2 border-dashed border-blue-500 text-blue-500 hover:bg-blue-900/30'}`}
                  aria-label="Edit chapter"
                >
                  <Pen className="h-4 w-4" />
                </button>
              )}
              {!isEditMode && narratorEnabled && (
                <button
                  onClick={() => onToggleSpeech(node.content, node.id)}
                  className={`rounded-full p-2 text-white shadow-md transition-colors hover:opacity-90 ${
                    isPro
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  }`}
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
          </>
        )}

        {/* The End text */}
        {node.is_ending && (
          <div className="mt-6 text-center">
            <span className="text-base font-extrabold text-white">*THE END*</span>
          </div>
        )}
      </div>
    </div>
  );
}
