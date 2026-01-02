import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { getShareUrl } from '../../../lib/supabase';
import type { StoryReaction } from '../../../lib/types';

interface StoryActionsProps {
  storyId: string;
  storyTitle?: string | null;
  userId: string;
  userReaction: StoryReaction | null;
  likesCount: number;
  dislikesCount: number;
  onReactionChange: (reaction: 'like' | 'dislike' | null) => void;
}

export function StoryActions({
  storyId,
  storyTitle,
  userId,
  userReaction,
  likesCount,
  dislikesCount,
  onReactionChange,
}: StoryActionsProps) {
  const handleLike = () => {
    if (!userId) {
      alert('Please sign in to react to stories');
      return;
    }

    if (userReaction?.reaction_type === 'like') {
      onReactionChange(null);
    } else {
      onReactionChange('like');
    }
  };

  const handleDislike = () => {
    if (!userId) {
      alert('Please sign in to react to stories');
      return;
    }

    if (userReaction?.reaction_type === 'dislike') {
      onReactionChange(null);
    } else {
      onReactionChange('dislike');
    }
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl(storyId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: storyTitle || 'Story',
          text: `Check out this interactive story: ${storyTitle}`,
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

  return (
    <div className="rounded-2xl bg-gray-800 p-4">
      <p className="mb-3 text-center text-sm font-medium text-gray-300">
        Did you enjoy this story?
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          className={`flex w-16 items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
            userReaction?.reaction_type === 'like'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-gray-700 text-gray-400 hover:bg-green-900/30'
          }`}
          onClick={handleLike}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

        <button
          className={`flex w-16 items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
            userReaction?.reaction_type === 'dislike'
              ? 'bg-red-900/50 text-red-400'
              : 'bg-gray-700 text-gray-400 hover:bg-red-900/30'
          }`}
          onClick={handleDislike}
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="text-sm font-medium">{dislikesCount}</span>
        </button>

        <button
          className="flex w-10 items-center justify-center rounded-xl bg-gray-700 py-2 text-gray-400 transition-all hover:bg-blue-900/30 hover:text-blue-400"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
