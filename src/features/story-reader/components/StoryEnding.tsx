import { ThumbsUp, ThumbsDown, Share2, User } from 'lucide-react';
import type { Story, StoryReaction } from '../../../lib/types';
import { getSafeDisplayName } from '../../../lib/displayName';
import { getShareUrl } from '../../../lib/supabase';

interface StoryEndingProps {
  story: Story;
  userReaction: StoryReaction | null;
  likesCount: number;
  dislikesCount: number;
  isPro: boolean;
  userId: string;
  onReaction: (type: 'like' | 'dislike') => void;
  onRemoveReaction: () => void;
  onViewProfile: (userId: string) => void;
  onRestart: () => void;
  onComplete: () => void;
}

export function StoryEnding({
  story,
  userReaction,
  likesCount,
  dislikesCount,
  isPro,
  userId,
  onReaction,
  onRemoveReaction,
  onViewProfile,
  onRestart,
  onComplete,
}: StoryEndingProps) {
  const handleShare = async () => {
    const shareUrl = getShareUrl(story.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: `Check out this interactive story: ${story.title}`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleLike = () => {
    if (!userId) {
      alert('Please sign in to react to stories');
      return;
    }
    if (userReaction?.reaction_type === 'like') {
      onRemoveReaction();
    } else {
      onReaction('like');
    }
  };

  const handleDislike = () => {
    if (!userId) {
      alert('Please sign in to react to stories');
      return;
    }
    if (userReaction?.reaction_type === 'dislike') {
      onRemoveReaction();
    } else {
      onReaction('dislike');
    }
  };

  const buttonGradient = isPro
    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600';

  return (
    <>
      {/* Main Card Container */}
      <div className="mt-6 space-y-4 rounded-3xl bg-white p-4 shadow-xl">
        {/* Creator Card */}
        {story.creator && (
          <button
            onClick={() => {
              if (story.created_by) {
                onViewProfile(story.created_by);
              }
            }}
            className="flex w-full items-center gap-4 rounded-2xl bg-gray-50 p-4 shadow-md transition-all hover:bg-gray-100 hover:shadow-lg"
          >
            {story.creator.avatar_url ? (
              <img
                src={story.creator.avatar_url}
                alt={getSafeDisplayName(story.creator.display_name, 'Creator')}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-xs text-gray-500">Created by</p>
              <p className="text-base font-bold text-gray-800">
                {getSafeDisplayName(story.creator.display_name, 'Anonymous')}
              </p>
            </div>
            <div className="text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}

        {/* Reaction Card */}
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="mb-3 text-center text-sm font-medium text-gray-600">
            Did you enjoy this story?
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              className={`flex w-16 items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                userReaction?.reaction_type === 'like'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
              }`}
              onClick={handleLike}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              className={`flex w-16 items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                userReaction?.reaction_type === 'dislike'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
              }`}
              onClick={handleDislike}
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm font-medium">{dislikesCount}</span>
            </button>

            <button
              className="flex w-10 items-center justify-center rounded-xl bg-gray-100 py-2 text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4 pb-4">
        <button
          onClick={onRestart}
          className="flex-1 rounded-2xl bg-gray-200 py-3 text-sm font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-300 hover:shadow-lg"
        >
          Read Again
        </button>
        <button
          onClick={onComplete}
          className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl ${buttonGradient}`}
        >
          Explore More
        </button>
      </div>
    </>
  );
}
