import { useState } from 'react';
import {
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  User,
  Play,
  Clock,
} from 'lucide-react';
import {
  addReaction,
  updateReaction,
  removeReaction,
  getUserReaction,
} from '../../lib/storyService';
import { getShareUrl } from '../../lib/supabase';
import { getSafeDisplayName } from '../../lib/displayName';
import type { FeedItem } from '../../lib/interactiveTypes';
import type { StoryReaction } from '../../lib/types';
import { useEffect } from 'react';

interface StoryFeedCardProps {
  item: FeedItem;
  isActive: boolean;
  onSelect: () => void;
  onViewProfile?: (userId: string) => void;
  userId: string;
}

export function StoryFeedCard({
  item,
  isActive,
  onSelect,
  onViewProfile,
  userId,
}: StoryFeedCardProps) {
  const [reaction, setReaction] = useState<StoryReaction | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes_count);
  const [dislikesCount, setDislikesCount] = useState(item.dislikes_count);

  useEffect(() => {
    if (userId && item.id) {
      loadReaction();
    }
  }, [userId, item.id]);

  const loadReaction = async () => {
    const r = await getUserReaction(userId, item.id);
    setReaction(r);
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!userId) return;

    try {
      if (reaction) {
        if (reaction.reaction_type === type) {
          await removeReaction(userId, item.id);
          setReaction(null);
          if (type === 'like') setLikesCount((c) => c - 1);
          else setDislikesCount((c) => c - 1);
        } else {
          await updateReaction(userId, item.id, type);
          setReaction({ ...reaction, reaction_type: type });
          if (type === 'like') {
            setLikesCount((c) => c + 1);
            setDislikesCount((c) => c - 1);
          } else {
            setDislikesCount((c) => c + 1);
            setLikesCount((c) => c - 1);
          }
        }
      } else {
        await addReaction(userId, item.id, type);
        setReaction({
          id: '',
          user_id: userId,
          story_id: item.id,
          reaction_type: type,
          created_at: '',
        });
        if (type === 'like') setLikesCount((c) => c + 1);
        else setDislikesCount((c) => c + 1);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl(item.id);

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        {item.preview_url ? (
          <video
            src={item.preview_url}
            className="h-full w-full object-cover"
            autoPlay={isActive}
            loop
            muted
            playsInline
            poster={item.thumbnail_url || undefined}
          />
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <BookOpen className="h-24 w-24 text-white/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Content type badge */}
      <div className="absolute left-4 top-20 z-10">
        <div className="flex items-center gap-1.5 rounded-full bg-blue-500/80 px-3 py-1.5 backdrop-blur-sm">
          <BookOpen className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Story</span>
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-16 z-10 p-4">
        {/* Creator info */}
        {item.creator && (
          <button
            onClick={() => item.created_by && onViewProfile?.(item.created_by)}
            className="mb-3 flex items-center gap-2"
          >
            {item.creator.avatar_url ? (
              <img
                src={item.creator.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-semibold text-white">
              {getSafeDisplayName(item.creator.display_name)}
            </span>
          </button>
        )}

        {/* Title and description */}
        <h2 className="mb-2 line-clamp-2 text-xl font-bold text-white">{item.title}</h2>
        <p className="mb-3 line-clamp-2 text-sm text-white/80">{item.description}</p>

        {/* Duration */}
        <div className="flex items-center gap-1 text-sm text-white/60">
          <Clock className="h-4 w-4" />
          <span>{item.estimated_duration} min read</span>
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-bold text-white transition-all hover:from-blue-700 hover:to-cyan-700"
        >
          <Play className="h-5 w-5" />
          Start Reading
        </button>
      </div>

      {/* Right side actions */}
      <div className="absolute bottom-32 right-4 z-10 flex flex-col gap-4">
        {/* Like */}
        <button onClick={() => handleReaction('like')} className="flex flex-col items-center gap-1">
          <div
            className={`rounded-full p-3 transition-all ${
              reaction?.reaction_type === 'like'
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white backdrop-blur-sm'
            }`}
          >
            <ThumbsUp className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-white">{likesCount}</span>
        </button>

        {/* Dislike */}
        <button
          onClick={() => handleReaction('dislike')}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`rounded-full p-3 transition-all ${
              reaction?.reaction_type === 'dislike'
                ? 'bg-red-500 text-white'
                : 'bg-white/10 text-white backdrop-blur-sm'
            }`}
          >
            <ThumbsDown className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-white">{dislikesCount}</span>
        </button>

        {/* Comments */}
        <button onClick={onSelect} className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-white/10 p-3 text-white backdrop-blur-sm">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-white">{item.comment_count}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-white/10 p-3 text-white backdrop-blur-sm">
            <Share2 className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium text-white">Share</span>
        </button>
      </div>
    </div>
  );
}

export default StoryFeedCard;
