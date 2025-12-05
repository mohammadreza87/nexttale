import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Loader, Share2, UserPlus, UserMinus, User, Flame, Star, CheckCircle, Trophy, Crown } from 'lucide-react';
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
    longest_streak: 0
  });
  const [points, setPoints] = useState(0);
  const [activeTab, setActiveTab] = useState<'created' | 'completed'>('created');

  // Created stories pagination
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalStories, setTotalStories] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Completed stories
  const [completedStories, setCompletedStories] = useState<{ story: Story; completed_at: string }[]>([]);
  const [completedHasMore, setCompletedHasMore] = useState(true);
  const [completedLoadingMore, setCompletedLoadingMore] = useState(false);
  const [completedTotal, setCompletedTotal] = useState(0);
  const completedLoaderRef = useRef<HTMLDivElement>(null);

  const loadMoreStories = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result = await getPublicUserStoriesPaginated(profileUserId, STORIES_PER_PAGE, stories.length);
      setStories(prev => [...prev, ...result.data]);
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
        .select(`
          completed_at,
          story:stories(*)
        `)
        .eq('user_id', profileUserId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .range(completedStories.length, completedStories.length + STORIES_PER_PAGE - 1);

      if (error) throw error;

      const formatted = data?.map(item => ({
        story: item.story as unknown as Story,
        completed_at: item.completed_at || ''
      })) || [];

      setCompletedStories(prev => [...prev, ...formatted]);
      setCompletedHasMore(completedStories.length + formatted.length < completedTotal);
    } catch (error) {
      console.error('Error loading more completed stories:', error);
    } finally {
      setCompletedLoadingMore(false);
    }
  }, [completedLoadingMore, completedHasMore, completedStories.length, completedTotal, profileUserId]);

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
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setCurrentUserId(session?.user?.id || null);

        const { data: prof } = await supabase
          .from('user_profiles')
          .select('display_name, bio, avatar_url, username, followers_count, following_count, total_points, subscription_tier, is_grandfathered')
          .eq('id', profileUserId)
          .maybeSingle();
        if (!mounted) return;
        setProfile(prof as UserProfile | null);
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
            longest_streak: streakData.longest_streak || 0
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
          .select(`
            completed_at,
            story:stories(*)
          `)
          .eq('user_id', profileUserId)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .range(0, STORIES_PER_PAGE - 1);

        if (!mounted) return;
        const formattedCompleted = completedData?.map(item => ({
          story: item.story as unknown as Story,
          completed_at: item.completed_at || ''
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
        setProfile(prev => prev ? { ...prev, followers_count: (prev.followers_count || 1) - 1 } : prev);
      } else {
        await followUser(profileUserId);
        setFollowing(true);
        setProfile(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : prev);
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
      <div className="min-h-screen bg-gray-50 pb-20 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Profile Card */}
        <div className={`bg-white rounded-3xl shadow-xl p-6 mb-6 relative ${(profile?.subscription_tier === 'pro' || profile?.is_grandfathered) ? 'pt-12' : ''}`}>
          {(profile?.subscription_tier === 'pro' || profile?.is_grandfathered) && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center gap-2 rounded-t-3xl">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">PRO</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${profile?.avatar_url ? '' : 'bg-gray-100'}`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-800 truncate">
                  {getSafeDisplayName(profile?.display_name || profile?.username, 'Reader')}
                </h1>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">{profile?.followers_count || 0}</p>
                    <p className="text-[10px] text-gray-500">Followers</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-800">{profile?.following_count || 0}</p>
                    <p className="text-[10px] text-gray-500">Following</p>
                  </div>
                </div>
                {/* Follow Button */}
                {currentUserId && currentUserId !== profileUserId && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 shadow-lg ${
                      following
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : following ? (
                      <UserMinus className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{following ? 'Unfollow' : 'Follow'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-gray-700 text-sm mt-4 break-words">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Points */}
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{points}</p>
            <p className="text-xs text-gray-500 font-medium">Points</p>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{streak.current_streak}</p>
            <p className="text-xs text-gray-500 font-medium">Current Streak</p>
          </div>

          {/* Longest Streak */}
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{streak.longest_streak}</p>
            <p className="text-xs text-gray-500 font-medium">Longest Streak</p>
          </div>
        </div>

        {/* Stories Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 py-3 px-4 font-semibold transition-all text-center rounded-xl ${
                activeTab === 'created'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-md'
              }`}
            >
              <span className="block text-lg font-bold">{totalStories}</span>
              <span className="text-xs">Stories</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-4 font-semibold transition-all text-center rounded-xl ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-md'
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
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Completed Stories Yet</h3>
                  <p className="text-gray-600">
                    This user hasn't completed any stories yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {completedStories.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-2xl shadow-md overflow-hidden transform transition-all duration-300 active:scale-95 hover:shadow-lg cursor-pointer"
                        onClick={() => onSelectStory(item.story.id)}
                      >
                        <div className="aspect-square bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 flex items-center justify-center relative">
                          {item.story.cover_image_url ? (
                            <img
                              src={item.story.cover_image_url}
                              alt={item.story.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CheckCircle className="w-12 h-12 text-white" />
                          )}
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-2">
                            {item.story.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShare(item.story.id, item.story.title, e)}
                              className="p-1.5 text-[#1f2937] hover:bg-gray-100 rounded-lg transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Completed stories loader */}
                  <div ref={completedLoaderRef} className="py-6 flex justify-center">
                    {completedLoadingMore && (
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                    {!completedHasMore && completedStories.length > 0 && (
                      <p className="text-gray-400 text-sm">No more stories</p>
                    )}
                  </div>
                </>
              )
            ) : (
              stories.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Public Stories Yet</h3>
                  <p className="text-gray-600">
                    This user hasn't shared any public stories yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-gray-50 rounded-2xl shadow-md overflow-hidden transform transition-all duration-300 active:scale-95 hover:shadow-lg cursor-pointer"
                        onClick={() => onSelectStory(story.id)}
                      >
                        <div className="aspect-square bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center">
                          {story.cover_image_url ? (
                            <img
                              src={story.cover_image_url}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-12 h-12 text-white" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-2">
                            {story.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShare(story.id, story.title, e)}
                              className="p-1.5 text-[#1f2937] hover:bg-gray-100 rounded-lg transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Infinite scroll loader */}
                  <div ref={loaderRef} className="py-6 flex justify-center">
                    {loadingMore && (
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                    {!hasMore && stories.length > 0 && (
                      <p className="text-gray-400 text-sm">No more stories</p>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
