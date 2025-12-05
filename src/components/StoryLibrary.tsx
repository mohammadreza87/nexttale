import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Users, Loader, ThumbsUp, ThumbsDown, User, UserPlus, Book, Share2, Eye, MessageCircle } from 'lucide-react';
import { getStoriesPaginated, addReaction, updateReaction, removeReaction, followUser, unfollowUser, isFollowing } from '../lib/storyService';
import { supabase, getShareUrl } from '../lib/supabase';
import type { Story, StoryReaction } from '../lib/types';
import { getSafeDisplayName } from '../lib/displayName';

interface StoryLibraryProps {
  onSelectStory: (storyId: string) => void;
  onViewProfile?: (profileUserId: string) => void;
  userId: string;
  isPro?: boolean;
}

interface StoryWithLoading extends Story {
  generatingCover?: boolean;
}

const getLanguageFlag = (languageCode: string | null | undefined): string => {
  const flagMap: Record<string, string> = {
    'en': '🇺🇸',
    'tr': '🇹🇷',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'ar': '🇸🇦',
    'fa': '🇮🇷',
    'zh': '🇨🇳',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'ru': '🇷🇺',
    'pt': '🇵🇹',
    'it': '🇮🇹',
    'nl': '🇳🇱',
    'pl': '🇵🇱',
    'sv': '🇸🇪',
    'hi': '🇮🇳',
    'bn': '🇧🇩',
    'ur': '🇵🇰',
    'id': '🇮🇩',
    'vi': '🇻🇳',
    'th': '🇹🇭',
    'uk': '🇺🇦',
    'ro': '🇷🇴',
    'el': '🇬🇷',
    'cs': '🇨🇿',
    'da': '🇩🇰',
    'fi': '🇫🇮',
    'no': '🇳🇴',
  };

  return flagMap[languageCode || 'en'] || '🌍';
};

const STORIES_PER_PAGE = 4;

export function StoryLibrary({ onSelectStory, onViewProfile, userId, isPro = false }: StoryLibraryProps) {
  const [stories, setStories] = useState<StoryWithLoading[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, StoryReaction>>({});
  const [followingUsers, setFollowingUsers] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMoreStories = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result = await getStoriesPaginated(STORIES_PER_PAGE, stories.length);
      setStories(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more stories:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, stories.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreStories();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreStories, hasMore, loadingMore, loading]);

  useEffect(() => {
    loadStories();
    loadUserReactions();

    const channel = supabase
      .channel('story_reactions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'story_reactions',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadUserReactions();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_follows',
        filter: `follower_id=eq.${userId}`
      }, () => {
        loadFollowingStatus(stories);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadUserReactions = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('story_reactions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const reactionsMap: Record<string, StoryReaction> = {};
      data?.forEach((reaction) => {
        reactionsMap[reaction.story_id] = reaction;
      });
      setUserReactions(reactionsMap);
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  };

  const loadFollowingStatus = async (storiesToCheck: Story[] = []) => {
    if (!userId) return;

    try {
      const followingMap: Record<string, boolean> = {};

      for (const story of storiesToCheck) {
        if (story.created_by && story.created_by !== userId && !followingUsers[story.created_by]) {
          const following = await isFollowing(userId, story.created_by);
          followingMap[story.created_by] = following;
        }
      }

      setFollowingUsers(prev => ({ ...prev, ...followingMap }));
    } catch (error) {
      console.error('Error loading following status:', error);
    }
  };

  const loadStories = async () => {
    try {
      const result = await getStoriesPaginated(STORIES_PER_PAGE, 0);
      setStories(result.data);
      setHasMore(result.hasMore);
      loadFollowingStatus(result.data);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (storyId: string, storyTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const shareUrl = getShareUrl(storyId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: storyTitle,
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

  const handleReaction = async (storyId: string, reactionType: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      alert('Please sign in to react to stories');
      return;
    }

    try {
      const currentReaction = userReactions[storyId];

      if (currentReaction) {
        if (currentReaction.reaction_type === reactionType) {
          await removeReaction(userId, storyId);
        } else {
          await updateReaction(userId, storyId, reactionType);
        }
      } else {
        await addReaction(userId, storyId, reactionType);
      }

      await loadUserReactions();
      await loadStories();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleFollowToggle = async (creatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      alert('Please sign in to follow creators');
      return;
    }

    if (creatorId === userId) return;

    setFollowLoading(creatorId);
    try {
      if (followingUsers[creatorId]) {
        await unfollowUser(creatorId);
        setFollowingUsers(prev => ({ ...prev, [creatorId]: false }));
      } else {
        await followUser(creatorId);
        setFollowingUsers(prev => ({ ...prev, [creatorId]: true }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="max-w-md mx-auto px-4 pt-4 pb-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Stories</h1>
          <p className="text-sm text-gray-400">Explore interactive adventures created by our community</p>
        </div>

        <div className="space-y-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-gray-900 rounded-3xl shadow-xl overflow-hidden transform transition-all duration-300 active:scale-95 border border-gray-800"
              onClick={() => onSelectStory(story.id)}
            >
              <div className="h-40 bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-200 flex items-center justify-center relative overflow-hidden">
                {story.generatingCover ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 gap-2">
                    <span className="text-xs text-gray-600 font-medium">Creating cover...</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : story.cover_video_url ? (
                  <video
                    src={story.cover_video_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={story.cover_image_url || undefined}
                    onError={(e) => {
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : story.cover_image_url ? (
                  <img
                    src={story.cover_image_url}
                    alt={`${story.title} cover`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${story.cover_image_url || story.cover_video_url ? 'hidden' : ''}`}>
                  <Book className="w-16 h-16 text-white opacity-80" />
                </div>
                {story.generation_status && story.generation_status !== 'fully_generated' && story.generation_progress !== undefined && story.generation_progress < 100 && !story.is_user_generated && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    {story.generation_progress}%
                  </div>
                )}
                {story.creator && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full p-1">
                    <button
                      className="flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (story.created_by && onViewProfile) {
                          onViewProfile(story.created_by);
                        }
                      }}
                    >
                      {story.creator.avatar_url ? (
                        <img
                          src={story.creator.avatar_url}
                          alt={story.creator.display_name || 'Creator'}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-white">{getSafeDisplayName(story.creator.display_name)}</span>
                    </button>
                    {story.created_by && story.created_by !== userId && followingUsers[story.created_by] === false && (
                      <button
                        onClick={(e) => handleFollowToggle(story.created_by!, e)}
                        disabled={followLoading === story.created_by}
                        className="flex items-center justify-center w-5 h-5 rounded-full transition-all bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      >
                        {followLoading === story.created_by ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {story.title}
                </h3>

                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {story.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{story.estimated_duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Ages {story.age_range}</span>
                  </div>
                  <div className={`flex items-center gap-1 font-medium ${
                    story.completion_count && story.completion_count > 0
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    <Eye className="w-3 h-3" />
                    <span>{story.completion_count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                        userReactions[story.id]?.reaction_type === 'like'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-green-900/30'
                      }`}
                      onClick={(e) => handleReaction(story.id, 'like', e)}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{story.likes_count || 0}</span>
                    </button>

                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                        userReactions[story.id]?.reaction_type === 'dislike'
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-red-900/30'
                      }`}
                      onClick={(e) => handleReaction(story.id, 'dislike', e)}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm font-medium">{story.dislikes_count || 0}</span>
                    </button>

                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all bg-gray-800 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStory(story.id);
                      }}
                      title="View comments"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{story.comment_count || 0}</span>
                    </button>

                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all bg-gray-800 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400"
                      onClick={(e) => handleShare(story.id, story.title, e)}
                      title="Share story"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-2xl" title={`Language: ${story.language || 'en'}`}>
                    {getLanguageFlag(story.language)}
                  </div>
                </div>

                <button
                  className={`w-full py-3 text-white font-semibold rounded-2xl shadow-md active:scale-95 transition-all duration-200 ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStory(story.id);
                  }}
                >
                  Start Adventure
                </button>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">No stories available yet.</p>
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
          {!hasMore && stories.length > 0 && (
            <p className="text-gray-400 text-sm">You've seen all stories</p>
          )}
        </div>
      </div>
    </div>
  );
}
