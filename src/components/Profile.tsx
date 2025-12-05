import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Trophy, Loader, LogOut, User, Edit2, Trash2, Globe, Lock, Crown, Share2, Menu, X, AlertCircle, Flame, Star, Volume2, VolumeX } from 'lucide-react';
import { supabase, getShareUrl } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { ProfileEdit } from './ProfileEdit';
import { StoryEditor } from './StoryEditor';
import { getUserStoriesPaginated, deleteStory, updateStoryVisibility, getFollowerCount, getFollowingCount } from '../lib/storyService';
import type { Story, UserProfile as UserProfileType } from '../lib/types';
import { getUserSubscription, createCustomerPortalSession, type UserSubscription } from '../lib/subscriptionService';
import { getSafeDisplayName } from '../lib/displayName';
import { getQuests } from '../lib/questsService';
import UpgradeModal from './UpgradeModal';
import { getAutoNarration, setAutoNarration } from '../lib/settingsService';

const STORIES_PER_PAGE = 4;

interface ProfileProps {
  userId: string;
  onSelectStory: (storyId: string) => void;
}

interface CompletedStory {
  story: Story;
  completed_at: string;
  path_taken: string[];
}

interface UserProfile {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export function Profile({ userId, onSelectStory }: ProfileProps) {
  const { user, signOut } = useAuth();
  const [completedStories, setCompletedStories] = useState<CompletedStory[]>([]);
  const [createdStories, setCreatedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'completed' | 'created'>('created');
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [autoNarrationEnabled, setAutoNarrationEnabled] = useState(true);
  const [streak, setStreak] = useState<{ current_streak: number; longest_streak: number }>({
    current_streak: 0,
    longest_streak: 0
  });

  // Pagination states
  const [createdHasMore, setCreatedHasMore] = useState(true);
  const [createdLoadingMore, setCreatedLoadingMore] = useState(false);
  const [completedHasMore, setCompletedHasMore] = useState(true);
  const [completedLoadingMore, setCompletedLoadingMore] = useState(false);
  const [createdTotal, setCreatedTotal] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);

  const createdLoaderRef = useRef<HTMLDivElement>(null);
  const completedLoaderRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('username, display_name, bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const data = await getUserSubscription(user.id);
      if (data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleManageSubscription = async () => {
    const url = await createCustomerPortalSession();
    if (url) {
      window.location.href = url;
    } else {
      alert('Unable to open subscription management. Please try again.');
    }
  };

  const loadCompletedStories = async () => {
    try {
      const { count: total } = await supabase
        .from('user_story_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true);

      const { data, error } = await supabase
        .from('user_story_progress')
        .select(`
          completed_at,
          path_taken,
          story:stories(*)
        `)
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .range(0, STORIES_PER_PAGE - 1);

      if (error) throw error;

      const formatted = data?.map(item => ({
        story: item.story as unknown as Story,
        completed_at: item.completed_at || '',
        path_taken: item.path_taken || []
      })) || [];

      setCompletedStories(formatted);
      setCompletedTotal(total || 0);
      setCompletedHasMore(STORIES_PER_PAGE < (total || 0));
    } catch (error) {
      console.error('Error loading completed stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreCompletedStories = useCallback(async () => {
    if (completedLoadingMore || !completedHasMore) return;

    setCompletedLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('user_story_progress')
        .select(`
          completed_at,
          path_taken,
          story:stories(*)
        `)
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .range(completedStories.length, completedStories.length + STORIES_PER_PAGE - 1);

      if (error) throw error;

      const formatted = data?.map(item => ({
        story: item.story as unknown as Story,
        completed_at: item.completed_at || '',
        path_taken: item.path_taken || []
      })) || [];

      setCompletedStories(prev => [...prev, ...formatted]);
      setCompletedHasMore(completedStories.length + formatted.length < completedTotal);
    } catch (error) {
      console.error('Error loading more completed stories:', error);
    } finally {
      setCompletedLoadingMore(false);
    }
  }, [completedLoadingMore, completedHasMore, completedStories.length, completedTotal, userId]);

  const loadCreatedStories = async () => {
    try {
      const result = await getUserStoriesPaginated(userId, STORIES_PER_PAGE, 0);
      setCreatedStories(result.data);
      setCreatedTotal(result.total);
      setCreatedHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading created stories:', error);
    }
  };

  const loadMoreCreatedStories = useCallback(async () => {
    if (createdLoadingMore || !createdHasMore) return;

    setCreatedLoadingMore(true);
    try {
      const result = await getUserStoriesPaginated(userId, STORIES_PER_PAGE, createdStories.length);
      setCreatedStories(prev => [...prev, ...result.data]);
      setCreatedHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more created stories:', error);
    } finally {
      setCreatedLoadingMore(false);
    }
  }, [createdLoadingMore, createdHasMore, createdStories.length, userId]);

  // Initial data load
  useEffect(() => {
    loadProfile();
    loadCompletedStories();
    loadCreatedStories();
    loadFollowCounts();
    loadSubscription();
    loadQuestData();
    setAutoNarrationEnabled(getAutoNarration());

    const channel = supabase
      .channel('profile-points-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          loadSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Intersection Observer for created stories infinite scroll
  useEffect(() => {
    if (activeTab !== 'created') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && createdHasMore && !createdLoadingMore && !loading) {
          loadMoreCreatedStories();
        }
      },
      { threshold: 0.1 }
    );

    if (createdLoaderRef.current) {
      observer.observe(createdLoaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreCreatedStories, createdHasMore, createdLoadingMore, loading, activeTab]);

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

  const loadFollowCounts = async () => {
    try {
      const [followers, following] = await Promise.all([
        getFollowerCount(userId),
        getFollowingCount(userId)
      ]);
      setFollowersCount(followers);
      setFollowingCount(following);
    } catch (error) {
      console.error('Error loading follow counts:', error);
    }
  };

  const loadQuestData = async () => {
    try {
      const { streak } = await getQuests();
      setStreak({ current_streak: streak.current_streak || 0, longest_streak: streak.longest_streak || 0 });
    } catch (error) {
      console.error('Error loading quest data:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    setDeletingStoryId(storyId);
    try {
      await deleteStory(storyId);
      setCreatedStories(prev => prev.filter(s => s.id !== storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    } finally {
      setDeletingStoryId(null);
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

  const handleToggleVisibility = async (storyId: string, currentVisibility: boolean) => {
    setUpdatingVisibilityId(storyId);
    try {
      await updateStoryVisibility(storyId, !currentVisibility);
      setCreatedStories(prev =>
        prev.map(s => s.id === storyId ? { ...s, is_public: !currentVisibility } : s)
      );
    } catch (error) {
      console.error('Error updating story visibility:', error);
      alert('Failed to update story visibility. Please try again.');
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  const isPro = subscription?.subscription_tier === 'pro' || subscription?.is_grandfathered;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-16 gap-3 bg-gray-950">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
        <div className={`bg-gray-900 rounded-3xl shadow-xl p-6 mb-6 relative border border-gray-800 ${isPro ? 'pt-12' : ''}`}>
          {isPro && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 rounded-t-3xl">
              <Crown className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">PRO</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${profile?.avatar_url ? '' : 'bg-gray-800'}`}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white truncate">
                    {getSafeDisplayName(profile?.display_name || user?.user_metadata?.full_name || user?.email || '', 'User')}
                  </h1>
                </div>
                {/* Hamburger Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {showProfileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </button>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute top-full right-0 mt-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50 min-w-[200px]">
                        {/* Subscription Info - Clickable */}
                        {subscription && (
                          <button
                            onClick={() => {
                              if (subscription.subscription_tier === 'pro' && subscription.stripe_customer_id && !subscription.is_grandfathered) {
                                handleManageSubscription();
                              } else if (subscription.subscription_tier !== 'pro' && !subscription.is_grandfathered) {
                                setShowUpgradeModal(true);
                              }
                              setShowProfileMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-700 border-b border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">Subscription</span>
                              {subscription.subscription_tier === 'pro' || subscription.is_grandfathered ? (
                                <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  Pro {subscription.is_grandfathered && '(Lifetime)'}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Free</span>
                              )}
                            </div>
                            {subscription.subscription_tier === 'pro' || subscription.is_grandfathered ? (
                              <p className="text-[10px] text-gray-500">Unlimited stories {!subscription.is_grandfathered && subscription.stripe_customer_id && '• Tap to manage'}</p>
                            ) : (
                              <p className="text-[10px] text-gray-500">Tap to upgrade</p>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </button>
                        <div className="px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            {autoNarrationEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            <span>Auto Narration</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">
                              {autoNarrationEnabled ? 'On' : 'Off'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = !autoNarrationEnabled;
                                setAutoNarrationEnabled(newValue);
                                setAutoNarration(newValue);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                autoNarrationEnabled
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                                  autoNarrationEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="border-t border-gray-700 mt-1 pt-1">
                          <a
                            href="/terms"
                            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span>Terms of Service</span>
                          </a>
                          <a
                            href="/privacy"
                            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span>Privacy Policy</span>
                          </a>
                        </div>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{followersCount}</p>
                  <p className="text-[10px] text-gray-500">Followers</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{followingCount}</p>
                  <p className="text-[10px] text-gray-500">Following</p>
                </div>
              </div>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-gray-300 text-sm mt-4 break-words">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Points */}
          <button
            onClick={() => setShowPointsPopup(true)}
            className="bg-gray-900 rounded-2xl shadow-lg p-4 text-center hover:shadow-xl transition-shadow border border-gray-800"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{subscription?.total_points || 0}</p>
            <p className="text-xs text-gray-400 font-medium">Points</p>
          </button>

          {/* Current Streak */}
          <div className="bg-gray-900 rounded-2xl shadow-lg p-4 text-center border border-gray-800">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{streak.current_streak}</p>
            <p className="text-xs text-gray-400 font-medium">Current Streak</p>
          </div>

          {/* Longest Streak */}
          <div className="bg-gray-900 rounded-2xl shadow-lg p-4 text-center border border-gray-800">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{streak.longest_streak}</p>
            <p className="text-xs text-gray-400 font-medium">Longest Streak</p>
          </div>
        </div>

        {/* Points Breakdown Popup */}
        {showPointsPopup && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowPointsPopup(false)}>
            <div className="bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-gray-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className={`w-6 h-6 ${isPro ? 'text-purple-400' : 'text-blue-400'}`} />
                  <h3 className="text-xl font-bold text-white">Points Breakdown</h3>
                </div>
                <button
                  onClick={() => setShowPointsPopup(false)}
                  className="p-2 text-gray-400 hover:bg-gray-800 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-900/30 rounded-xl">
                  <span className="text-gray-300 font-medium">Reading Points</span>
                  <span className="text-xl font-bold text-green-400">{subscription?.reading_points || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-900/30 rounded-xl">
                  <span className="text-gray-300 font-medium">Creating Points</span>
                  <span className="text-xl font-bold text-purple-400">{subscription?.creating_points || 0}</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-xl ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}>
                  <span className="text-white font-semibold">Total Points</span>
                  <span className="text-2xl font-bold text-white">{subscription?.total_points || 0}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">How to earn:</strong> 1 point per chapter, 5 points for completing a story, 5 points for creating a story!
                </p>
              </div>
            </div>
          </div>
        )}



        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        <div className="bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-800">
          {/* Tabs */}
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 py-3 px-4 font-semibold transition-all text-center rounded-xl ${
                activeTab === 'created'
                  ? isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-md'
              }`}
            >
              <span className="block text-lg font-bold">{createdTotal}</span>
              <span className="text-xs">My Stories</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-4 font-semibold transition-all text-center rounded-xl ${
                activeTab === 'completed'
                  ? isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-md'
              }`}
            >
              <span className="block text-lg font-bold">{completedTotal}</span>
              <span className="text-xs">Completed stories</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'completed' ? (
              completedStories.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Completed Stories Yet</h3>
                  <p className="text-gray-400">
                    Start reading stories and complete them to see your achievements here!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {completedStories.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-2xl shadow-md overflow-hidden transform transition-all duration-300 active:scale-95 hover:shadow-lg cursor-pointer border border-gray-700"
                      onClick={() => onSelectStory(item.story.id)}
                    >
                      <div className={`aspect-square flex items-center justify-center relative ${isPro ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900'}`}>
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
                        <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">
                          {item.story.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleShare(item.story.id, item.story.title, e)}
                            className="p-1.5 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
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
              createdStories.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Created Stories Yet</h3>
                  <p className="text-gray-400">
                    Create your first interactive story to see it here!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {createdStories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-gray-800 rounded-2xl shadow-md overflow-hidden transform transition-all duration-300 active:scale-95 hover:shadow-lg cursor-pointer border border-gray-700"
                        onClick={() => onSelectStory(story.id)}
                      >
                        <div className={`aspect-square flex items-center justify-center relative ${isPro ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900'}`}>
                          {story.cover_image_url ? (
                            <img
                              src={story.cover_image_url}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-12 h-12 text-white" />
                          )}
                          {story.generation_status === 'failed' && (
                            <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                              <div className="text-center text-white">
                                <AlertCircle className="w-8 h-8 mx-auto mb-1" />
                                <span className="text-xs font-semibold">Failed</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">
                            {story.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShare(story.id, story.title, e)}
                              className="p-1.5 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVisibility(story.id, story.is_public);
                              }}
                              disabled={updatingVisibilityId === story.id}
                              className="p-1.5 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                              title={story.is_public ? 'Public' : 'Private'}
                            >
                              {updatingVisibilityId === story.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : story.is_public ? (
                                <Globe className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStory(story.id);
                              }}
                              disabled={deletingStoryId === story.id}
                              className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingStoryId === story.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Created stories loader */}
                  <div ref={createdLoaderRef} className="py-6 flex justify-center">
                    {createdLoadingMore && (
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                    {!createdHasMore && createdStories.length > 0 && (
                      <p className="text-gray-400 text-sm">No more stories</p>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <ProfileEdit
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadProfile();
          }}
        />
      )}

      {editingStoryId && (
        <StoryEditor
          storyId={editingStoryId}
          onClose={() => setEditingStoryId(null)}
          onSave={() => {
            loadCreatedStories();
            setEditingStoryId(null);
          }}
        />
      )}
    </div>
  );
}
