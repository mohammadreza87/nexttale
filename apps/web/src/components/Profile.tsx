import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader, X } from 'lucide-react';
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
import { getQuests } from '../lib/questsService';
import UpgradeModal from './UpgradeModal';
import { getAutoNarration, setAutoNarration } from '../lib/settingsService';
import {
  ProfileHeader,
  ProfileStatsRow,
  ProfileTabs,
  ContentCard,
  EmptyState,
  InfiniteScrollLoader,
  LoadingIndicator,
  type ProfileTabType,
} from '../features/profile';

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
  const [activeTab, setActiveTab] = useState<ProfileTabType>('created');
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

  const isPro = subscription?.subscription_tier === 'pro' || subscription?.is_grandfathered === true;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950 pb-16">
        <LoadingIndicator colorClass="bg-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        <ProfileHeader
          profile={profile}
          userEmail={user?.email}
          userFullName={user?.user_metadata?.full_name}
          subscription={subscription}
          isPro={isPro}
          followersCount={followersCount}
          followingCount={followingCount}
          autoNarrationEnabled={autoNarrationEnabled}
          showProfileMenu={showProfileMenu}
          onToggleMenu={() => setShowProfileMenu(!showProfileMenu)}
          onCloseMenu={() => setShowProfileMenu(false)}
          onEditProfile={() => setShowEditModal(true)}
          onToggleAutoNarration={() => {
            const newValue = !autoNarrationEnabled;
            setAutoNarrationEnabled(newValue);
            setAutoNarration(newValue);
          }}
          onManageSubscription={handleManageSubscription}
          onShowUpgrade={() => setShowUpgradeModal(true)}
          onSignOut={handleSignOut}
        />

        <ProfileStatsRow
          subscription={subscription}
          isPro={isPro}
          streak={streak}
          showPointsPopup={showPointsPopup}
          onShowPointsPopup={() => setShowPointsPopup(true)}
          onClosePointsPopup={() => setShowPointsPopup(false)}
        />

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
          <ProfileTabs
            activeTab={activeTab}
            isPro={isPro}
            createdTotal={createdTotal}
            completedTotal={completedTotal}
            onTabChange={setActiveTab}
          />

          {/* Content */}
          <div className="p-4">
            {activeTab === 'completed' ? (
              completedStories.length === 0 && !loading ? (
                <EmptyState type="completed" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {completedStories.map((item, index) => (
                      <ContentCard
                        key={index}
                        id={item.story.id}
                        title={item.story.title}
                        type="completed"
                        imageUrl={item.story.cover_image_url}
                        isPro={isPro}
                        isCompleted
                        onClick={() => onSelectStory(item.story.id)}
                        onShare={(e) => handleShare(item.story.id, item.story.title, e)}
                      />
                    ))}
                  </div>
                  <InfiniteScrollLoader
                    loaderRef={completedLoaderRef as React.RefObject<HTMLDivElement>}
                    isLoading={completedLoadingMore}
                    hasMore={completedHasMore}
                    itemCount={completedStories.length}
                    noMoreText="No more stories"
                  />
                </>
              )
            ) : activeTab === 'interactive' ? (
              createdInteractive.length === 0 && !loading ? (
                <EmptyState type="interactive" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {createdInteractive.map((content) => (
                      <ContentCard
                        key={content.id}
                        id={content.id}
                        title={content.title}
                        type="interactive"
                        imageUrl={content.thumbnail_url}
                        isPro={isPro}
                        isPublic={content.is_public ?? false}
                        contentTypeLabel={content.content_type}
                        canToggleVisibility={isPro}
                        isUpdatingVisibility={updatingInteractiveVisibilityId === content.id}
                        isDeleting={deletingInteractiveId === content.id}
                        onClick={() => handleOpenPreview(content.id)}
                        onToggleVisibility={() =>
                          handleToggleInteractiveVisibility(content.id, content.is_public ?? false)
                        }
                        onDelete={() => handleDeleteInteractive(content.id)}
                      />
                    ))}
                  </div>
                  <InfiniteScrollLoader
                    loaderRef={interactiveLoaderRef as React.RefObject<HTMLDivElement>}
                    isLoading={interactiveLoadingMore}
                    hasMore={interactiveHasMore}
                    itemCount={createdInteractive.length}
                    noMoreText="No more content"
                  />
                </>
              )
            ) : activeTab === 'music' ? (
              createdMusic.length === 0 && !loading ? (
                <EmptyState type="music" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {createdMusic.map((music) => (
                    <ContentCard
                      key={music.id}
                      id={music.id}
                      title={music.title}
                      type="music"
                      isPro={isPro}
                      isPublic={music.is_public ?? false}
                      genre={music.genre ?? undefined}
                      audioUrl={music.audio_url ?? undefined}
                      isUpdatingVisibility={updatingMusicVisibilityId === music.id}
                      isDeleting={deletingMusicId === music.id}
                      onToggleVisibility={() =>
                        handleToggleMusicVisibility(music.id, music.is_public ?? false)
                      }
                      onDelete={() => handleDeleteMusic(music.id)}
                    />
                  ))}
                </div>
              )
            ) : createdStories.length === 0 && !loading ? (
              <EmptyState type="created" />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {createdStories.map((story) => (
                    <ContentCard
                      key={story.id}
                      id={story.id}
                      title={story.title}
                      type="story"
                      imageUrl={story.cover_image_url}
                      isPro={isPro}
                      isPublic={story.is_public ?? false}
                      generationStatus={story.generation_status ?? undefined}
                      isUpdatingVisibility={updatingVisibilityId === story.id}
                      isDeleting={deletingStoryId === story.id}
                      onClick={() => onSelectStory(story.id)}
                      onShare={(e) => handleShare(story.id, story.title, e)}
                      onToggleVisibility={() =>
                        handleToggleVisibility(story.id, story.is_public ?? false)
                      }
                      onDelete={() => handleDeleteStory(story.id)}
                    />
                  ))}
                </div>
                <InfiniteScrollLoader
                  loaderRef={createdLoaderRef as React.RefObject<HTMLDivElement>}
                  isLoading={createdLoadingMore}
                  hasMore={createdHasMore}
                  itemCount={createdStories.length}
                  noMoreText="No more stories"
                />
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
