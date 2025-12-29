import { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  User,
  Play,
  Clock,
  Gamepad2,
  Wrench,
  LayoutGrid,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import {
  getInteractiveReaction,
  addInteractiveReaction,
  updateInteractiveReaction,
  removeInteractiveReaction,
  getInteractiveShareUrl,
} from '../../lib/interactiveService';
import { getSafeDisplayName } from '../../lib/displayName';
import { InteractiveViewer } from '../interactive/InteractiveViewer';
import type { FeedItem, ContentType, InteractiveReaction } from '../../lib/interactiveTypes';

interface InteractiveFeedCardProps {
  item: FeedItem;
  isActive: boolean;
  onSelect: () => void;
  onViewProfile?: (userId: string) => void;
  userId: string;
}

const TYPE_CONFIG: Record<
  Exclude<ContentType, 'story'>,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  game: {
    icon: <Gamepad2 className="h-4 w-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/80',
  },
  tool: {
    icon: <Wrench className="h-4 w-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/80',
  },
  widget: {
    icon: <LayoutGrid className="h-4 w-4" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/80',
  },
  quiz: {
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/80',
  },
  visualization: {
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/80',
  },
};

export function InteractiveFeedCard({
  item,
  isActive,
  onSelect,
  onViewProfile,
  userId,
}: InteractiveFeedCardProps) {
  const [reaction, setReaction] = useState<InteractiveReaction | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes_count);
  const [dislikesCount, setDislikesCount] = useState(item.dislikes_count);
  const [showPreview, setShowPreview] = useState(false);

  const typeConfig =
    TYPE_CONFIG[item.feed_type as Exclude<ContentType, 'story'>] || TYPE_CONFIG.game;

  useEffect(() => {
    if (userId && item.id) {
      loadReaction();
    }
  }, [userId, item.id]);

  // Auto-show preview when card becomes active
  useEffect(() => {
    if (isActive && item.html_content) {
      const timer = setTimeout(() => setShowPreview(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowPreview(false);
    }
  }, [isActive, item.html_content]);

  const loadReaction = async () => {
    try {
      const r = await getInteractiveReaction(userId, item.id);
      setReaction(r);
    } catch (error) {
      console.error('Error loading reaction:', error);
    }
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!userId) return;

    try {
      if (reaction) {
        if (reaction.reaction_type === type) {
          await removeInteractiveReaction(userId, item.id);
          setReaction(null);
          if (type === 'like') setLikesCount((c) => c - 1);
          else setDislikesCount((c) => c - 1);
        } else {
          await updateInteractiveReaction(userId, item.id, type);
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
        await addInteractiveReaction(userId, item.id, type);
        setReaction({
          id: '',
          user_id: userId,
          content_id: item.id,
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
    const shareUrl = getInteractiveShareUrl(item.id);

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
      {/* Background - either preview or thumbnail */}
      <div className="absolute inset-0">
        {showPreview && item.html_content ? (
          <InteractiveViewer
            htmlContent={item.html_content}
            title={item.title}
            className="h-full w-full"
          />
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
            <div className="text-white/30">{typeConfig.icon}</div>
          </div>
        )}
        {/* Gradient overlay - only show when not previewing */}
        {!showPreview && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        )}
      </div>

      {/* Content type badge */}
      <div className="absolute left-4 top-20 z-10">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 ${typeConfig.bgColor} rounded-full backdrop-blur-sm`}
        >
          {typeConfig.icon}
          <span className="text-sm font-medium capitalize text-white">{item.feed_type}</span>
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="absolute right-16 top-20 z-10 flex gap-1">
          {item.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="rounded-full bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom content - only show when not in preview mode */}
      {!showPreview && (
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
            <span>{item.estimated_duration} min</span>
          </div>

          {/* CTA Button */}
          <button
            onClick={onSelect}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-bold text-white transition-all hover:from-purple-700 hover:to-pink-700"
          >
            <Play className="h-5 w-5" />
            Try It Now
          </button>
        </div>
      )}

      {/* Tap to interact hint when previewing */}
      {showPreview && (
        <div className="absolute bottom-24 left-4 right-16 z-10">
          <button
            onClick={onSelect}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black/60 py-3 font-bold text-white backdrop-blur-sm transition-all hover:bg-black/80"
          >
            <Play className="h-5 w-5" />
            Open Full Screen
          </button>
        </div>
      )}

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

export default InteractiveFeedCard;
