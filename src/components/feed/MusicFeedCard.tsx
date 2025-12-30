import { useState, useEffect, useRef } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  User,
  Play,
  Pause,
  Music,
  Mic2,
} from 'lucide-react';
import {
  getUserMusicReaction,
  setMusicReaction,
  removeMusicReaction,
} from '../../lib/musicService';
import { getSafeDisplayName } from '../../lib/displayName';
import type { MusicContent, MusicReaction } from '../../lib/musicTypes';

interface MusicFeedCardProps {
  item: MusicContent;
  isActive: boolean;
  onSelect: () => void;
  onViewProfile?: (userId: string) => void;
  userId: string;
}

export function MusicFeedCard({
  item,
  isActive,
  onSelect,
  onViewProfile,
  userId,
}: MusicFeedCardProps) {
  const [reaction, setReaction] = useState<MusicReaction | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes_count ?? 0);
  const [dislikesCount, setDislikesCount] = useState(item.dislikes_count ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (userId && item.id) {
      loadReaction();
    }
  }, [userId, item.id]);

  // Auto-play when card becomes active
  useEffect(() => {
    if (isActive && audioRef.current) {
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // Autoplay blocked, user needs to interact
        });
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const loadReaction = async () => {
    try {
      const r = await getUserMusicReaction(userId, item.id);
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
          await removeMusicReaction(item.id);
          setReaction(null);
          if (type === 'like') setLikesCount((c) => c - 1);
          else setDislikesCount((c) => c - 1);
        } else {
          await setMusicReaction(item.id, type);
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
        await setMusicReaction(item.id, type);
        setReaction({
          id: '',
          user_id: userId,
          music_id: item.id,
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
    const shareUrl = `${window.location.origin}/music/${item.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description ?? undefined,
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

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
        {/* Animated music visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-32 items-end gap-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-white/20 transition-all duration-150"
                style={{
                  height: isPlaying ? `${Math.random() * 100 + 20}%` : '20%',
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={item.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Content type badge */}
      <div className="absolute left-4 top-4 z-10">
        <div className="flex items-center gap-1.5 rounded-full bg-pink-500/80 px-3 py-1.5 backdrop-blur-sm">
          <Music className="h-4 w-4 text-white" />
          <span className="text-sm font-medium capitalize text-white">Music</span>
        </div>
      </div>

      {/* Voice info */}
      {item.voice_clone && (
        <div className="absolute right-16 top-4 z-10">
          <div className="flex items-center gap-1.5 rounded-full bg-purple-500/80 px-3 py-1.5 backdrop-blur-sm">
            <Mic2 className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">{item.voice_clone.name}</span>
          </div>
        </div>
      )}

      {/* Center play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={handlePlayPause}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
        >
          {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="ml-2 h-10 w-10" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-48 left-4 right-20 z-10">
        <div className="mb-2 flex justify-between text-xs text-white/60">
          <span>{formatTime((progress / 100) * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${progress}%` }}
          />
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

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {item.genre && (
            <span className="rounded-full bg-purple-500/30 px-3 py-1 text-xs text-purple-300">
              {item.genre}
            </span>
          )}
          {item.mood && (
            <span className="rounded-full bg-pink-500/30 px-3 py-1 text-xs text-pink-300">
              {item.mood}
            </span>
          )}
          {item.tags?.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
              #{tag}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-bold text-white transition-all hover:from-purple-700 hover:to-pink-700"
        >
          <Music className="h-5 w-5" />
          View Details
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
          <span className="text-xs font-medium text-white">0</span>
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

export default MusicFeedCard;
