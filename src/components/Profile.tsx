import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle,
  Trophy,
  Loader,
  LogOut,
  User,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Crown,
  Share2,
  Menu,
  X,
  AlertCircle,
  Flame,
  Star,
  Volume2,
  VolumeX,
  Gamepad2,
  Play,
  Music,
} from 'lucide-react';
import { supabase, getShareUrl } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import { ProfileEdit } from './ProfileEdit';
import { StoryEditor } from './StoryEditor';
import {
  getUserStoriesPaginated,
  deleteStory,
  updateStoryVisibility,
  getFollowerCount,
  getFollowingCount,
} from '../lib/storyService';
import {
  getUserInteractiveContent,
  deleteInteractiveContent,
  updateInteractiveContent,
  getInteractiveContent,
} from '../lib/interactiveService';
import type { Story, UserProfile as _UserProfileType } from '../lib/types';
import type { InteractiveContent } from '../lib/interactiveTypes';
import { getUserMusic, deleteMusic, updateMusic } from '../lib/musicService';
import type { MusicContent } from '../lib/musicTypes';
import { InteractiveViewer } from './interactive/InteractiveViewer';
import {
  getUserSubscription,
  createCustomerPortalSession,
  type UserSubscription,
} from '../lib/subscriptionService';
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
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export function Profile({ userId, onSelectStory }: ProfileProps) {
  const { user, signOut } = useAuth();
  const [completedStories, setCompletedStories] = useState<CompletedStory[]>([]);
  const [createdStories, setCreatedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'completed' | 'created' | 'interactive' | 'music'>(
    'created'
  );
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
    longest_streak: 0,
  });

  // Pagination states
  const [createdHasMore, setCreatedHasMore] = useState(true);
  const [createdLoadingMore, setCreatedLoadingMore] = useState(false);
  const [completedHasMore, setCompletedHasMore] = useState(true);
  const [completedLoadingMore, setCompletedLoadingMore] = useState(false);
  const [createdTotal, setCreatedTotal] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);

  // Interactive content state
  const [createdInteractive, setCreatedInteractive] = useState<InteractiveContent[]>([]);
  const [interactiveHasMore, setInteractiveHasMore] = useState(true);
  const [interactiveLoadingMore, setInteractiveLoadingMore] = useState(false);
  const [deletingInteractiveId, setDeletingInteractiveId] = useState<string | null>(null);
  const [updatingInteractiveVisibilityId, setUpdatingInteractiveVisibilityId] = useState<
    string | null
  >(null);
  const [previewContent, setPreviewContent] = useState<InteractiveContent | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Music content state
  const [createdMusic, setCreatedMusic] = useState<MusicContent[]>([]);
  const [deletingMusicId, setDeletingMusicId] = useState<string | null>(null);
  const [updatingMusicVisibilityId, setUpdatingMusicVisibilityId] = useState<string | null>(null);

  const createdLoaderRef = useRef<HTMLDivElement>(null);
  const completedLoaderRef = useRef<HTMLDivElement>(null);
  const interactiveLoaderRef = useRef<HTMLDivElement>(null);

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
        .select(
          `
          completed_at,
          path_taken,
          story:stories(*)
        `
        )
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .range(0, STORIES_PER_PAGE - 1);

      if (error) throw error;

      const formatted =
        data?.map((item) => ({
          story: item.story as unknown as Story,
          completed_at: item.completed_at || '',
          path_taken: (Array.isArray(item.path_taken) ? item.path_taken : []) as string[],
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
        .select(
          `
          completed_at,
          path_taken,
          story:stories(*)
        `
        )
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .range(completedStories.length, completedStories.length + STORIES_PER_PAGE - 1);

      if (error) throw error;

      const formatted =
        data?.map((item) => ({
          story: item.story as unknown as Story,
          completed_at: item.completed_at || '',
          path_taken: (Array.isArray(item.path_taken) ? item.path_taken : []) as string[],
        })) || [];

      setCompletedStories((prev) => [...prev, ...formatted]);
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
      setCreatedStories((prev) => [...prev, ...result.data]);
      setCreatedHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more created stories:', error);
    } finally {
      setCreatedLoadingMore(false);
    }
  }, [createdLoadingMore, createdHasMore, createdStories.length, userId]);

  const loadCreatedInteractive = async () => {
    try {
      const result = await getUserInteractiveContent(userId, STORIES_PER_PAGE, 0);
      setCreatedInteractive(result.data);
      setInteractiveHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading interactive content:', error);
    }
  };

  const loadMoreInteractive = useCallback(async () => {
    if (interactiveLoadingMore || !interactiveHasMore) return;

    setInteractiveLoadingMore(true);
    try {
      const result = await getUserInteractiveContent(
        userId,
        STORIES_PER_PAGE,
        createdInteractive.length
      );
      setCreatedInteractive((prev) => [...prev, ...result.data]);
      setInteractiveHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more interactive content:', error);
    } finally {
      setInteractiveLoadingMore(false);
    }
  }, [interactiveLoadingMore, interactiveHasMore, createdInteractive.length, userId]);

  // Music content loading
  const loadCreatedMusic = async () => {
    try {
      const music = await getUserMusic(userId);
      setCreatedMusic(music);
    } catch (error) {
      console.error('Error loading music content:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    loadProfile();
    loadCompletedStories();
    loadCreatedStories();
    loadCreatedInteractive();
    loadCreatedMusic();
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

  // Interactive content infinite scroll
  useEffect(() => {
    if (activeTab !== 'interactive') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          interactiveHasMore &&
          !interactiveLoadingMore &&
          !loading
        ) {
          loadMoreInteractive();
        }
      },
      { threshold: 0.1 }
    );

    if (interactiveLoaderRef.current) {
      observer.observe(interactiveLoaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreInteractive, interactiveHasMore, interactiveLoadingMore, loading, activeTab]);

  const loadFollowCounts = async () => {
    try {
      const [followers, following] = await Promise.all([
        getFollowerCount(userId),
        getFollowingCount(userId),
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
      setStreak({
        current_streak: streak.current_streak || 0,
        longest_streak: streak.longest_streak || 0,
      });
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
      setCreatedStories((prev) => prev.filter((s) => s.id !== storyId));
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
      setCreatedStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, is_public: !currentVisibility } : s))
      );
    } catch (error) {
      console.error('Error updating story visibility:', error);
      alert('Failed to update story visibility. Please try again.');
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  const handleDeleteInteractive = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    setDeletingInteractiveId(contentId);
    try {
      await deleteInteractiveContent(contentId);
      setCreatedInteractive((prev) => prev.filter((c) => c.id !== contentId));
    } catch (error) {
      console.error('Error deleting interactive content:', error);
      alert('Failed to delete content. Please try again.');
    } finally {
      setDeletingInteractiveId(null);
    }
  };

  const handleToggleInteractiveVisibility = async (
    contentId: string,
    currentVisibility: boolean
  ) => {
    // Only Pro users can change visibility
    if (!isPro) {
      return;
    }

    setUpdatingInteractiveVisibilityId(contentId);
    try {
      await updateInteractiveContent(contentId, { is_public: !currentVisibility });
      setCreatedInteractive((prev) =>
        prev.map((c) => (c.id === contentId ? { ...c, is_public: !currentVisibility } : c))
      );
    } catch (error) {
      console.error('Error updating content visibility:', error);
      alert('Failed to update content visibility. Please try again.');
    } finally {
      setUpdatingInteractiveVisibilityId(null);
    }
  };

  // Music handlers
  const handleDeleteMusic = async (musicId: string) => {
    if (!confirm('Are you sure you want to delete this music? This action cannot be undone.')) {
      return;
    }

    setDeletingMusicId(musicId);
    try {
      await deleteMusic(musicId);
      setCreatedMusic((prev) => prev.filter((m) => m.id !== musicId));
    } catch (error) {
      console.error('Error deleting music:', error);
      alert('Failed to delete music. Please try again.');
    } finally {
      setDeletingMusicId(null);
    }
  };

  const handleToggleMusicVisibility = async (musicId: string, currentVisibility: boolean) => {
    setUpdatingMusicVisibilityId(musicId);
    try {
      await updateMusic(musicId, { is_public: !currentVisibility });
      setCreatedMusic((prev) =>
        prev.map((m) => (m.id === musicId ? { ...m, is_public: !currentVisibility } : m))
      );
    } catch (error) {
      console.error('Error updating music visibility:', error);
      alert('Failed to update music visibility. Please try again.');
    } finally {
      setUpdatingMusicVisibilityId(null);
    }
  };

  const handleOpenPreview = async (contentId: string) => {
    setLoadingPreview(true);
    try {
      const content = await getInteractiveContent(contentId);
      if (content) {
        setPreviewContent(content);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const isPro = subscription?.subscription_tier === 'pro' || subscription?.is_grandfathered;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950 pb-16">
        <div className="flex gap-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        <div
          className={`relative mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl ${isPro ? 'pt-12' : ''}`}
        >
          {isPro && (
            <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-r from-purple-600 to-pink-600">
              <Crown className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white">PRO</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div
              className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${profile?.avatar_url ? '' : 'bg-gray-800'}`}
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
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-white">
                    {getSafeDisplayName(
                      profile?.display_name || user?.user_metadata?.full_name || user?.email || '',
                      'User'
                    )}
                  </h1>
                </div>
                {/* Hamburger Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800"
                  >
                    {showProfileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </button>
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-gray-700 bg-gray-800 py-2 shadow-xl">
                        {/* Subscription Info - Clickable */}
                        {subscription && (
                          <button
                            onClick={() => {
                              if (
                                subscription.subscription_tier === 'pro' &&
                                subscription.stripe_customer_id &&
                                !subscription.is_grandfathered
                              ) {
                                handleManageSubscription();
                              } else if (
                                subscription.subscription_tier !== 'pro' &&
                                !subscription.is_grandfathered
                              ) {
                                setShowUpgradeModal(true);
                              }
                              setShowProfileMenu(false);
                            }}
                            className="w-full border-b border-gray-700 px-3 py-2 text-left hover:bg-gray-700"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs text-gray-400">Subscription</span>
                              {subscription.subscription_tier === 'pro' ||
                              subscription.is_grandfathered ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-purple-400">
                                  <Crown className="h-3 w-3" />
                                  Pro {subscription.is_grandfathered && '(Lifetime)'}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Free</span>
                              )}
                            </div>
                            {subscription.subscription_tier === 'pro' ||
                            subscription.is_grandfathered ? (
                              <p className="text-[10px] text-gray-500">
                                Unlimited stories{' '}
                                {!subscription.is_grandfathered &&
                                  subscription.stripe_customer_id &&
                                  '• Tap to manage'}
                              </p>
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
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit Profile</span>
                        </button>
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            {autoNarrationEnabled ? (
                              <Volume2 className="h-3.5 w-3.5" />
                            ) : (
                              <VolumeX className="h-3.5 w-3.5" />
                            )}
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
                        <div className="mt-1 border-t border-gray-700 pt-1">
                          <a
                            href="/terms"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <span>Terms of Service</span>
                          </a>
                          <a
                            href="/privacy"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700"
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
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/30"
                        >
                          <LogOut className="h-3.5 w-3.5" />
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

          {profile?.bio && <p className="mt-4 break-words text-sm text-gray-300">{profile.bio}</p>}
        </div>

        {/* Stats Cards Row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {/* Points */}
          <button
            onClick={() => setShowPointsPopup(true)}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500">
              <Star className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{subscription?.total_points || 0}</p>
            <p className="text-xs font-medium text-gray-400">Points</p>
          </button>

          {/* Current Streak */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center shadow-lg">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{streak.current_streak}</p>
            <p className="text-xs font-medium text-gray-400">Current Streak</p>
          </div>

          {/* Longest Streak */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center shadow-lg">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{streak.longest_streak}</p>
            <p className="text-xs font-medium text-gray-400">Longest Streak</p>
          </div>
        </div>

        {/* Points Breakdown Popup */}
        {showPointsPopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setShowPointsPopup(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className={`h-6 w-6 ${isPro ? 'text-purple-400' : 'text-blue-400'}`} />
                  <h3 className="text-xl font-bold text-white">Points Breakdown</h3>
                </div>
                <button
                  onClick={() => setShowPointsPopup(false)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-green-900/30 p-3">
                  <span className="font-medium text-gray-300">Reading Points</span>
                  <span className="text-xl font-bold text-green-400">
                    {subscription?.reading_points || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-purple-900/30 p-3">
                  <span className="font-medium text-gray-300">Creating Points</span>
                  <span className="text-xl font-bold text-purple-400">
                    {subscription?.creating_points || 0}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between rounded-xl p-4 ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                >
                  <span className="font-semibold text-white">Total Points</span>
                  <span className="text-2xl font-bold text-white">
                    {subscription?.total_points || 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-gray-800 p-3">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">How to earn:</strong> 1 point per chapter, 5
                  points for completing a story, 5 points for creating a story!
                </p>
              </div>
            </div>
          </div>
        )}

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
          {/* Tabs */}
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
                activeTab === 'created'
                  ? isPro
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 shadow-md hover:bg-gray-700'
              }`}
            >
              <span className="block text-lg font-bold">{createdTotal}</span>
              <span className="text-xs">Stories</span>
            </button>
            <button
              onClick={() => setActiveTab('interactive')}
              className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
                activeTab === 'interactive'
                  ? isPro
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 shadow-md hover:bg-gray-700'
              }`}
            >
              <Gamepad2 className="mx-auto mb-1 h-5 w-5" />
              <span className="text-xs">Games</span>
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
                activeTab === 'music'
                  ? isPro
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 shadow-md hover:bg-gray-700'
              }`}
            >
              <Music className="mx-auto mb-1 h-5 w-5" />
              <span className="text-xs">Music</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
                activeTab === 'completed'
                  ? isPro
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 shadow-md hover:bg-gray-700'
              }`}
            >
              <span className="block text-lg font-bold">{completedTotal}</span>
              <span className="text-xs">Played</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'completed' ? (
              completedStories.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <h3 className="mb-2 text-xl font-bold text-white">No Completed Stories Yet</h3>
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
                        className="transform cursor-pointer overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
                        onClick={() => onSelectStory(item.story.id)}
                      >
                        <div
                          className={`relative flex aspect-square items-center justify-center ${isPro ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900'}`}
                        >
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
                          <h3 className="mb-2 line-clamp-1 text-sm font-bold text-white">
                            {item.story.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShare(item.story.id, item.story.title, e)}
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700"
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
            ) : activeTab === 'interactive' ? (
              createdInteractive.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <h3 className="mb-2 text-xl font-bold text-white">No Interactive Content Yet</h3>
                  <p className="text-gray-400">
                    Create games, tools, quizzes, and more to see them here!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {createdInteractive.map((content) => (
                      <div
                        key={content.id}
                        className="transform cursor-pointer overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
                        onClick={() => handleOpenPreview(content.id)}
                      >
                        <div
                          className={`relative flex aspect-square items-center justify-center ${isPro ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900'}`}
                        >
                          {content.thumbnail_url ? (
                            <img
                              src={content.thumbnail_url}
                              alt={content.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Gamepad2 className="h-12 w-12 text-white" />
                          )}
                          <div className="absolute left-2 top-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                            {content.content_type}
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                              <Play className="h-8 w-8 text-white" fill="white" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="mb-2 line-clamp-1 text-sm font-bold text-white">
                            {content.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPro) {
                                  handleToggleInteractiveVisibility(
                                    content.id,
                                    content.is_public ?? false
                                  );
                                }
                              }}
                              disabled={updatingInteractiveVisibilityId === content.id || !isPro}
                              className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 disabled:opacity-50 ${!isPro ? 'cursor-not-allowed' : ''}`}
                              title={
                                isPro
                                  ? content.is_public
                                    ? 'Public (tap to change)'
                                    : 'Private (tap to change)'
                                  : 'Pro only: change visibility'
                              }
                            >
                              {updatingInteractiveVisibilityId === content.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : content.is_public ? (
                                <Globe className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInteractive(content.id);
                              }}
                              disabled={deletingInteractiveId === content.id}
                              className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingInteractiveId === content.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Interactive content loader */}
                  <div ref={interactiveLoaderRef} className="flex justify-center py-6">
                    {interactiveLoadingMore && (
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
                    {!interactiveHasMore && createdInteractive.length > 0 && (
                      <p className="text-sm text-gray-400">No more content</p>
                    )}
                  </div>
                </>
              )
            ) : activeTab === 'music' ? (
              createdMusic.length === 0 && !loading ? (
                <div className="p-8 text-center">
                  <Music className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <h3 className="mb-2 text-xl font-bold text-white">No Music Created Yet</h3>
                  <p className="text-gray-400">Create AI-generated music to see it here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {createdMusic.map((music) => (
                    <div
                      key={music.id}
                      className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-md"
                    >
                      <div
                        className={`relative flex aspect-square items-center justify-center ${isPro ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900'}`}
                      >
                        <Music className="h-12 w-12 text-white" />
                        {music.genre && (
                          <div className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-medium text-white">
                            {music.genre}
                          </div>
                        )}
                        {music.audio_url && (
                          <audio
                            src={music.audio_url}
                            controls
                            className="absolute bottom-2 left-2 right-2 h-8"
                            style={{ opacity: 0.9 }}
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="mb-2 line-clamp-1 text-sm font-bold text-white">
                          {music.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleMusicVisibility(music.id, music.is_public ?? false)
                            }
                            disabled={updatingMusicVisibilityId === music.id}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 disabled:opacity-50"
                            title={
                              music.is_public ? 'Public (tap to change)' : 'Private (tap to change)'
                            }
                          >
                            {updatingMusicVisibilityId === music.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : music.is_public ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteMusic(music.id)}
                            disabled={deletingMusicId === music.id}
                            className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingMusicId === music.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : createdStories.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <User className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-xl font-bold text-white">No Created Stories Yet</h3>
                <p className="text-gray-400">Create your first interactive story to see it here!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {createdStories.map((story) => (
                    <div
                      key={story.id}
                      className="transform cursor-pointer overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
                      onClick={() => onSelectStory(story.id)}
                    >
                      <div
                        className={`relative flex aspect-square items-center justify-center ${isPro ? 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900' : 'bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-900'}`}
                      >
                        {story.cover_image_url ? (
                          <img
                            src={story.cover_image_url}
                            alt={story.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-white" />
                        )}
                        {story.generation_status === 'failed' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/70">
                            <div className="text-center text-white">
                              <AlertCircle className="mx-auto mb-1 h-8 w-8" />
                              <span className="text-xs font-semibold">Failed</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="mb-2 line-clamp-1 text-sm font-bold text-white">
                          {story.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleShare(story.id, story.title, e)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700"
                            title="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(story.id, story.is_public ?? false);
                            }}
                            disabled={updatingVisibilityId === story.id}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 disabled:opacity-50"
                            title={story.is_public ? 'Public' : 'Private'}
                          >
                            {updatingVisibilityId === story.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : story.is_public ? (
                              <Globe className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStory(story.id);
                            }}
                            disabled={deletingStoryId === story.id}
                            className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingStoryId === story.id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Created stories loader */}
                <div ref={createdLoaderRef} className="flex justify-center py-6">
                  {createdLoadingMore && (
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
                  {!createdHasMore && createdStories.length > 0 && (
                    <p className="text-sm text-gray-400">No more stories</p>
                  )}
                </div>
              </>
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

      {/* Interactive Content Preview Modal */}
      {(previewContent || loadingPreview) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative h-full w-full max-w-lg">
            {/* Header */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex-1">
                {previewContent && (
                  <>
                    <h3 className="text-lg font-bold text-white">{previewContent.title}</h3>
                    <span className="text-sm text-purple-400">{previewContent.content_type}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setPreviewContent(null)}
                className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            {loadingPreview ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : previewContent?.html_content ? (
              <div className="h-full pt-16">
                <InteractiveViewer
                  htmlContent={previewContent.html_content}
                  title={previewContent.title}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No preview available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
