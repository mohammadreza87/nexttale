import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Loader,
  Share2,
  UserPlus,
  UserMinus,
  User,
  Flame,
  Star,
  CheckCircle,
  Trophy,
  Crown,
} from 'lucide-react';
import { supabase, getShareUrl } from '../lib/supabase';
import type { Story, UserProfile } from '../lib/types';
import { getPublicUserStoriesPaginated } from '../lib/storyService';
import { followUser, unfollowUser, isFollowing } from '../lib/followService';
import { getSafeDisplayName } from '../lib/displayName';

const STORIES_PER_PAGE = 4;

interface PublicProfileProps {
  profileUserId: string;
  onBack: () => void;
  onSelectStory: (storyId: string) => void;
}

export function PublicProfile({ profileUserId, onBack, onSelectStory }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [streak, setStreak] = useState<{ current_streak: number; longest_streak: number }>({
    current_streak: 0,
    longest_streak: 0,
  });
  const [points, setPoints] = useState(0);
  const [activeTab, setActiveTab] = useState<'created' | 'completed'>('created');

  // Created stories pagination
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalStories, setTotalStories] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Completed stories
  const [completedStories, setCompletedStories] = useState<
    { story: Story; completed_at: string }[]
  >([]);
  const [completedHasMore, setCompletedHasMore] = useState(true);
  const [completedLoadingMore, setCompletedLoadingMore] = useState(false);
  const [completedTotal, setCompletedTotal] = useState(0);
  const completedLoaderRef = useRef<HTMLDivElement>(null);

  const loadMoreStories = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result = await getPublicUserStoriesPaginated(
        profileUserId,
        STORIES_PER_PAGE,
        stories.length
      );
      setStories((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more stories:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, stories.length, profileUserId]);

  const loadMoreCompletedStories = useCallback(async () => {
    if (completedLoadingMore || !completedHasMore) return;

    setCompletedLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('user_story_progress')
        .select(
          `
          completed_at,
          story:stories(*)
        `
        )
        .eq('user_id', profileUserId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .range(completedStories.length, completedStories.length + STORIES_PER_PAGE - 1);

      if (error) throw error;

      const formatted =
        data?.map((item) => ({
          story: item.story as unknown as Story,
          completed_at: item.completed_at || '',
        })) || [];

      setCompletedStories((prev) => [...prev, ...formatted]);
      setCompletedHasMore(completedStories.length + formatted.length < completedTotal);
    } catch (error) {
      console.error('Error loading more completed stories:', error);
    } finally {
      setCompletedLoadingMore(false);
    }
  }, [
    completedLoadingMore,
    completedHasMore,
    completedStories.length,
    completedTotal,
    profileUserId,
  ]);

  // Intersection Observer for created stories infinite scroll
  useEffect(() => {
    if (activeTab !== 'created') return;

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
  }, [loadMoreStories, hasMore, loadingMore, loading, activeTab]);

  // Intersection Observer for completed stories infinite scroll
  useEffect(() => {
    if (activeTab !== 'completed') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && completedHasMore && !completedLoadingMore && !loading) {
          loadMoreCompletedStories();
        }
      },
      { threshold: 0.1 }
    );

    if (completedLoaderRef.current) {
      observer.observe(completedLoaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreCompletedStories, completedHasMore, completedLoadingMore, loading, activeTab]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) setCurrentUserId(session?.user?.id || null);

        const { data: prof } = await supabase
          .from('user_profiles')
          .select(
            'display_name, bio, avatar_url, username, total_points, subscription_tier, is_grandfathered'
          )
          .eq('id', profileUserId)
          .maybeSingle();
        if (!mounted) return;
        // Add default values for followers/following count since they're not in DB yet
        const profileWithDefaults = prof
          ? {
              ...prof,
              followers_count: 0,
              following_count: 0,
            }
          : null;
        setProfile(profileWithDefaults as UserProfile | null);
        setPoints(prof?.total_points || 0);

        // Load streak data
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', profileUserId)
          .maybeSingle();
        if (!mounted) return;
        if (streakData) {
          setStreak({
            current_streak: streakData.current_streak || 0,
            longest_streak: streakData.longest_streak || 0,
          });
        }

        const result = await getPublicUserStoriesPaginated(profileUserId, STORIES_PER_PAGE, 0);
        if (!mounted) return;
        setStories(result.data);
        setTotalStories(result.total);
        setHasMore(result.hasMore);

        // Load completed stories
        const { count: completedCount } = await supabase
          .from('user_story_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileUserId)
          .eq('completed', true);

        const { data: completedData } = await supabase
          .from('user_story_progress')
          .select(
            `
            completed_at,
            story:stories(*)
          `
          )
          .eq('user_id', profileUserId)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .range(0, STORIES_PER_PAGE - 1);

        if (!mounted) return;
        const formattedCompleted =
          completedData?.map((item) => ({
            story: item.story as unknown as Story,
            completed_at: item.completed_at || '',
          })) || [];
        setCompletedStories(formattedCompleted);
        setCompletedTotal(completedCount || 0);
        setCompletedHasMore(STORIES_PER_PAGE < (completedCount || 0));

        if (session?.user?.id && session.user.id !== profileUserId) {
          const followStatus = await isFollowing(profileUserId);
          if (mounted) setFollowing(followStatus);
        }
      } catch (error) {
        console.error('Error loading public profile', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [profileUserId]);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(profileUserId);
        setFollowing(false);
        setProfile((prev) =>
          prev ? { ...prev, followers_count: (prev.followers_count || 1) - 1 } : prev
        );
      } else {
        await followUser(profileUserId);
        setFollowing(true);
        setProfile((prev) =>
          prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : prev
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 pb-20">
        <div className="flex gap-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Profile Card */}
        <div
          className={`relative mb-6 rounded-3xl bg-white p-6 shadow-xl ${profile?.subscription_tier === 'pro' || profile?.is_grandfathered ? 'pt-12' : ''}`}
        >
          {(profile?.subscription_tier === 'pro' || profile?.is_grandfathered) && (
            <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-r from-blue-600 to-purple-600">
              <Crown className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white">PRO</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div
              className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${profile?.avatar_url ? '' : 'bg-gray-100'}`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-500" />
              )}
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h1 className="truncate text-xl font-bold text-gray-800">
                  {getSafeDisplayName(profile?.display_name || profile?.username, 'Reader')}
                </h1>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">
                      {profile?.followers_count || 0}
                    </p>
                    <p className="text-[10px] text-gray-500">Followers</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">
                      {profile?.following_count || 0}
                    </p>
                    <p className="text-[10px] text-gray-500">Following</p>
                  </div>
                </div>
                {/* Follow Button */}
                {currentUserId && currentUserId !== profileUserId && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all ${
                      following
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {followLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : following ? (
                      <UserMinus className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span>{following ? 'Unfollow' : 'Follow'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {profile?.bio && <p className="mt-4 break-words text-sm text-gray-700">{profile.bio}</p>}
        </div>

        {/* Stats Cards Row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {/* Points */}
          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500">
              <Star className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{points}</p>
            <p className="text-xs font-medium text-gray-500">Points</p>
          </div>

          {/* Current Streak */}
          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{streak.current_streak}</p>
            <p className="text-xs font-medium text-gray-500">Current Streak</p>
          </div>

          {/* Longest Streak */}
          <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{streak.longest_streak}</p>
            <p className="text-xs font-medium text-gray-500">Longest Streak</p>
          </div>
        </div>

        {/* Stories Section */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          {/* Tabs */}
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 rounded-xl px-4 py-3 text-center font-semibold transition-all ${
                activeTab === 'created'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 shadow-md hover:bg-gray-200'
              }`}
            >
              <span className="block text-lg font-bold">{totalStories}</span>
              <span className="text-xs">Stories</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 rounded-xl px-4 py-3 text-center font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 shadow-md hover:bg-gray-200'
              }`}
            >
              <span className="block text-lg font-bold">{completedTotal}</span>
              <span className="text-xs">Completed</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'completed' ? (
              completedStories.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-xl font-bold text-gray-800">No Completed Stories Yet</h3>
                  <p className="text-gray-600">This user hasn't completed any stories yet.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {completedStories.map((item, index) => (
                      <div
                        key={index}
                        className="transform cursor-pointer overflow-hidden rounded-2xl bg-gray-50 shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
                        onClick={() => onSelectStory(item.story.id)}
                      >
                        <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-green-200 via-blue-200 to-purple-200">
                          {item.story.cover_image_url ? (
                            <img
                              src={item.story.cover_image_url}
                              alt={item.story.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <CheckCircle className="h-12 w-12 text-white" />
                          )}
                          <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="mb-2 line-clamp-1 text-sm font-bold text-gray-800">
                            {item.story.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShare(item.story.id, item.story.title, e)}
                              className="rounded-lg p-1.5 text-[#1f2937] transition-colors hover:bg-gray-100"
                              title="Share"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Completed stories loader */}
                  <div ref={completedLoaderRef} className="flex justify-center py-6">
                    {completedLoadingMore && (
                      <div className="flex gap-2">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                    )}
                    {!completedHasMore && completedStories.length > 0 && (
                      <p className="text-sm text-gray-400">No more stories</p>
                    )}
                  </div>
                </>
              )
            ) : stories.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <User className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-bold text-gray-800">No Public Stories Yet</h3>
                <p className="text-gray-600">This user hasn't shared any public stories yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="transform cursor-pointer overflow-hidden rounded-2xl bg-gray-50 shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
                      onClick={() => onSelectStory(story.id)}
                    >
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200">
                        {story.cover_image_url ? (
                          <img
                            src={story.cover_image_url}
                            alt={story.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-white" />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="mb-2 line-clamp-1 text-sm font-bold text-gray-800">
                          {story.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleShare(story.id, story.title, e)}
                            className="rounded-lg p-1.5 text-[#1f2937] transition-colors hover:bg-gray-100"
                            title="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="flex justify-center py-6">
                  {loadingMore && (
                    <div className="flex gap-2">
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  )}
                  {!hasMore && stories.length > 0 && (
                    <p className="text-sm text-gray-400">No more stories</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
