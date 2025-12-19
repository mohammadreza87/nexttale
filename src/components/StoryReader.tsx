import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Loader,
  User,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Save,
  X,
  Plus,
  Trash2,
  Pen,
  Check,
  Eye,
  EyeOff,
  Film,
  Mic,
  MicOff,
} from 'lucide-react';
import { useVoiceInput, matchVoiceToChoice } from '../hooks/useVoiceInput';
import UpgradeModal from './UpgradeModal';
import {
  getStoryNode,
  getNodeChoices,
  saveProgress,
  updateNodeImage,
  updateNodeAudio,
  createStoryNode,
  createStoryChoice,
  deleteStoryChoice,
  toggleChoiceVisibility,
  getStory,
  getStoryGenerationStatus,
  getUserReaction,
  addReaction,
  updateReaction,
  removeReaction,
} from '../lib/storyService';
import { trackChapterRead, trackStoryCompletion } from '../lib/pointsService';
import { supabase, getShareUrl } from '../lib/supabase';
import { getSubscriptionUsage } from '../lib/subscriptionService';
import type { StoryNode, StoryChoice, Story, StoryReaction } from '../lib/types';
import { getSafeDisplayName } from '../lib/displayName';
import { getAutoNarration } from '../lib/settingsService';

interface StoryReaderProps {
  storyId: string;
  userId: string;
  onComplete: () => void;
  onViewProfile?: (userId: string) => void;
}

interface StoryChapter {
  node: StoryNode;
  choices: (StoryChoice & { to_node: StoryNode })[];
  selectedChoiceId?: string;
  imageUrl?: string | null;
  generatingImage?: boolean;
  videoUrl?: string | null;
  generatingVideo?: boolean;
}

export function StoryReader({ storyId, userId, onComplete, onViewProfile }: StoryReaderProps) {
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [pathTaken, setPathTaken] = useState<string[]>(['start']);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playingChapterId, setPlayingChapterId] = useState<string | null>(null);
  const [_isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [imageStyleReference, setImageStyleReference] = useState<string | null>(null);
  const [_generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [userReaction, setUserReaction] = useState<StoryReaction | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const latestChapterRef = useRef<HTMLDivElement | null>(null);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageGenerationInProgress = useRef<Set<string>>(new Set());
  const videoGenerationInProgress = useRef<Set<string>>(new Set());
  const [audioLoadingChapters, setAudioLoadingChapters] = useState<Set<string>>(new Set());
  const [audioReadyChapters, setAudioReadyChapters] = useState<Set<string>>(new Set());
  const audioCache = useRef<Map<string, string>>(new Map());
  const pendingPlayChapter = useRef<{ nodeId: string; text: string } | null>(null);
  const [autoNarrationEnabled, setAutoNarrationEnabled] = useState(true);
  const autoPlayTriggeredRef = useRef<Set<string>>(new Set()); // Track which chapters we've auto-played
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [hasVideoClips, setHasVideoClips] = useState(false);
  const [hasEditMode, setHasEditMode] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editingChoices, setEditingChoices] = useState<
    Array<{ id: string; text: string; hint?: string | null }>
  >([]);
  const [customChoice, setCustomChoice] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [customChoiceChapterIndex, setCustomChoiceChapterIndex] = useState<number | null>(null);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [voiceInputChapterIndex, setVoiceInputChapterIndex] = useState<number | null>(null);
  const [voiceMatchedChoice, setVoiceMatchedChoice] = useState<string | null>(null);

  // Voice input for choosing story paths
  const handleVoiceResult = useCallback(
    (transcript: string) => {
      if (voiceInputChapterIndex === null) return;

      const chapter = chapters[voiceInputChapterIndex];
      if (!chapter || chapter.selectedChoiceId) return;

      const availableChoices = chapter.choices
        .filter((c) => c.created_by === userId || c.is_public !== false)
        .map((c) => ({ id: c.id, text: c.choice_text }));

      const matched = matchVoiceToChoice(transcript, availableChoices);

      if (matched) {
        setVoiceMatchedChoice(matched.id);
        // Auto-select after a brief delay to show the match
        setTimeout(() => {
          const choice = chapter.choices.find((c) => c.id === matched.id);
          if (choice) {
            handleChoice(voiceInputChapterIndex, choice);
          }
          setVoiceInputChapterIndex(null);
          setVoiceMatchedChoice(null);
        }, 1000);
      }
    },
    [voiceInputChapterIndex, chapters, userId]
  );

  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript: voiceTranscript,
    startListening,
    stopListening,
  } = useVoiceInput({
    onResult: handleVoiceResult,
    language: story?.language === 'fa' ? 'fa-IR' : story?.language === 'tr' ? 'tr-TR' : 'en-US',
  });

  const toggleVoiceInput = (chapterIndex: number) => {
    // Voice input requires Pro or Max plan
    if (!hasVoiceInput) {
      setShowUpgradeModal(true);
      return;
    }

    if (isListening) {
      stopListening();
      setVoiceInputChapterIndex(null);
    } else {
      setVoiceInputChapterIndex(chapterIndex);
      startListening();
    }
  };

  useEffect(() => {
    initializeStory();
    loadReactionData();
    checkUserPermissions();
    setAutoNarrationEnabled(getAutoNarration());
  }, [storyId, userId]);

  const checkUserPermissions = async () => {
    try {
      const usage = await getSubscriptionUsage(userId);
      setIsPro(usage.isPro);
      setHasVoiceInput(usage.hasVoiceInput);
      setHasVideoClips(usage.hasVideoClips);
      setHasEditMode(usage.hasEditMode);

      const storyData = await getStory(storyId);
      setIsOwner(storyData?.created_by === userId);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadReactionData = async () => {
    if (!userId) return;

    try {
      const reaction = await getUserReaction(userId, storyId);
      setUserReaction(reaction);
    } catch (error) {
      console.error('Error loading reaction:', error);
    }
  };

  useEffect(() => {
    if (!storyId) return;

    const checkGenerationProgress = async () => {
      const status = await getStoryGenerationStatus(storyId);
      if (status) {
        setGenerationProgress(status.progress);
        setGenerationStatus(status.status);
      }
    };

    checkGenerationProgress();

    const interval = setInterval(checkGenerationProgress, 3000);

    return () => clearInterval(interval);
  }, [storyId]);

  // When backend finishes generation, fill any missing images once
  useEffect(() => {
    if (generationStatus === 'fully_generated' && story) {
      const missing = chapters.filter((ch) => !ch.imageUrl && ch.node.id !== 'loading');
      missing.forEach((chapter) => {
        startImageGeneration(
          chapter.node.id,
          chapter.node.content,
          {
            storyTitle: story.title,
            artStyle: story.art_style,
            storyDescription: story.description,
            styleReference: imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(
              chapter.node.id,
              imageUrl,
              chapter.node.content.substring(0, 200)
            );
            if (chapter.node.node_key === 'start') {
              await supabase
                .from('stories')
                .update({ cover_image_url: imageUrl })
                .eq('id', storyId);
              setStory((prev) => (prev ? { ...prev, cover_image_url: imageUrl } : prev));
            }
          }
        );
      });
    }
  }, [generationStatus, story, chapters]);

  const initializeStory = async () => {
    try {
      const storyData = await getStory(storyId);
      if (!storyData) return;
      setStory(storyData);
      setLikesCount(storyData.likes_count || 0);
      setDislikesCount(storyData.dislikes_count || 0);

      if (storyData.image_prompt) {
        setImageStyleReference(storyData.image_prompt);
      }

      loadStoryNode('start', undefined, storyData);
    } catch (error) {
      console.error('Error initializing story:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
      }
    };
  }, []);

  // Preload audio for chapters when narrator is enabled
  useEffect(() => {
    if (chapters.length > 0 && story?.narrator_enabled) {
      chapters.forEach((chapter) => {
        const nodeId = chapter.node.id;
        const isLoadingNode = nodeId === 'loading' || chapter.node.node_key === 'loading';
        const hasContent = chapter.node.content && chapter.node.content.trim().length > 0;

        // Skip if already loaded, loading, or is a loading placeholder
        if (
          audioReadyChapters.has(nodeId) ||
          audioLoadingChapters.has(nodeId) ||
          isLoadingNode ||
          !hasContent
        ) {
          return;
        }

        // If audio already cached in database, mark as ready
        if (chapter.node.audio_url && !chapter.node.audio_url.startsWith('blob:')) {
          audioCache.current.set(nodeId, chapter.node.audio_url);
          setAudioReadyChapters((prev) => new Set(prev).add(nodeId));
          return;
        }

        // Start preloading audio
        preloadAudio(chapter.node.content, nodeId);
      });
    }
  }, [chapters, story?.narrator_enabled]);

  const lastScrolledChapterRef = useRef<string | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  const scrollToElement = (element: HTMLElement) => {
    // Get the actual height of the sticky header dynamically
    const headerHeight = stickyHeaderRef.current?.offsetHeight || 200;
    const padding = 20; // Extra padding

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerHeight - padding;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (latestChapterRef.current && chapters.length > 1) {
      const latestChapter = chapters[chapters.length - 1];
      // Only scroll when we have a real chapter (not loading placeholder) and haven't scrolled to it yet
      if (
        latestChapter.node.id !== 'loading' &&
        latestChapter.node.node_key !== 'loading' &&
        lastScrolledChapterRef.current !== latestChapter.node.id
      ) {
        lastScrolledChapterRef.current = latestChapter.node.id;
        scrollToElement(latestChapterRef.current);
      }
    }
  }, [chapters]);

  const generateUniqueNodeKey = (): string => {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const generateNodeImage = async (
    nodeContent: string,
    options: {
      storyTitle: string;
      artStyle?: string | null;
      storyDescription?: string;
      styleReference?: string | null;
      storyId?: string;
      nodeId?: string;
      previousPrompt?: string | null;
    }
  ): Promise<string | null> => {
    try {
      if (!nodeContent || !options.storyTitle) {
        console.error('Missing content or title for image generation');
        return null;
      }

      const {
        storyTitle,
        artStyle,
        storyDescription,
        styleReference,
        storyId: imgStoryId,
        nodeId,
        previousPrompt,
      } = options;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      console.log('Generating image for story chapter...');

      // Prefer user session token; fall back to anon key so images still generate for signed-out readers
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!accessToken) {
        console.error('Not authenticated for image generation');
        return null;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: nodeContent,
          styleReference: styleReference ?? imageStyleReference,
          artStyle: artStyle || story?.art_style || 'fantasy',
          storyTitle,
          storyDescription: storyDescription ?? (story?.description || ''),
          storyId: imgStoryId || story?.id || storyId,
          nodeId,
          previousPrompt: previousPrompt ?? imageStyleReference ?? null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        // Silently fail for billing issues - images are optional
        if (response.status === 400 || response.status === 429) {
          console.warn('Image generation unavailable (billing inactive)');
          return null;
        }
        console.error('Failed to generate node image:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error generating node image:', error);
      return null;
    }
  };

  const startImageGeneration = (
    nodeId: string,
    nodeContent: string,
    options: {
      storyTitle: string;
      artStyle?: string | null;
      storyDescription?: string;
      styleReference?: string | null;
      storyId?: string;
      previousPrompt?: string | null;
    },
    onSuccess?: (imageUrl: string) => Promise<void>
  ) => {
    if (!nodeContent || !options.storyTitle) return;
    if (imageGenerationInProgress.current.has(nodeId)) return;

    imageGenerationInProgress.current.add(nodeId);

    setChapters((prev) =>
      prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingImage: true } : ch))
    );

    generateNodeImage(nodeContent, options)
      .then(async (imageUrl) => {
        if (imageUrl) {
          if (onSuccess) {
            await onSuccess(imageUrl);
          }
          setChapters((prev) =>
            prev.map((ch) => (ch.node.id === nodeId ? { ...ch, imageUrl } : ch))
          );
        }
      })
      .catch((err) => {
        console.log('Image generation failed, continuing without image:', err);
      })
      .finally(() => {
        imageGenerationInProgress.current.delete(nodeId);
        setChapters((prev) =>
          prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingImage: false } : ch))
        );
      });
  };

  const generateVideoFromImage = async (
    imageUrl: string,
    nodeId: string,
    prompt?: string
  ): Promise<string | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!accessToken) {
        console.error('Not authenticated for video generation');
        return null;
      }

      console.log('Generating video for node:', nodeId);

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt || 'Subtle cinematic movement, gentle camera pan, atmospheric lighting',
          storyId,
          nodeId,
          resolution: '480',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to generate video:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      return data.videoUrl;
    } catch (error) {
      console.error('Error generating video:', error);
      return null;
    }
  };

  const startVideoGeneration = (
    nodeId: string,
    imageUrl: string,
    prompt?: string,
    onSuccess?: (videoUrl: string) => Promise<void>
  ) => {
    if (!imageUrl) return;
    if (videoGenerationInProgress.current.has(nodeId)) return;

    videoGenerationInProgress.current.add(nodeId);

    setChapters((prev) =>
      prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingVideo: true } : ch))
    );

    generateVideoFromImage(imageUrl, nodeId, prompt)
      .then(async (videoUrl) => {
        if (videoUrl) {
          if (onSuccess) {
            await onSuccess(videoUrl);
          }
          setChapters((prev) =>
            prev.map((ch) => (ch.node.id === nodeId ? { ...ch, videoUrl } : ch))
          );
        }
      })
      .catch((err) => {
        console.log('Video generation failed, continuing without video:', err);
      })
      .finally(() => {
        videoGenerationInProgress.current.delete(nodeId);
        setChapters((prev) =>
          prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingVideo: false } : ch))
        );
      });
  };

  const generateStory = async (
    storyContext: string,
    userChoice?: string,
    previousContent?: string
  ): Promise<any> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const realChapterCount = chapters.filter(
        (ch) => ch.node.id !== 'loading' && ch.node.node_key !== 'loading'
      ).length;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          storyContext,
          userChoice,
          previousContent,
          storyTitle: story?.title,
          chapterCount: realChapterCount,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Generate story error:', errorData);
        throw new Error(errorData.error || 'Failed to generate story');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Story generation timed out. Please try again.');
      }
      console.error('Error generating story:', error);
      throw error;
    }
  };

  const waitForNodeResolution = async (
    nodeId: string,
    timeoutMs: number = 12000,
    intervalMs: number = 1500
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data: node } = await supabase
        .from('story_nodes')
        .select('*')
        .eq('id', nodeId)
        .maybeSingle();

      if (node && node.content && !(node as any).is_placeholder) {
        return node as StoryNode;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return null;
  };

  const loadStoryNode = async (
    nodeKey: string,
    previousContent?: string,
    storyOverride?: Story
  ) => {
    const currentStory = storyOverride || story;
    try {
      setLoading(true);
      let node = await getStoryNode(storyId, nodeKey);

      if (!node && currentStory?.story_context) {
        setIsGenerating(true);
        const generatedStory = await generateStory(currentStory.story_context);

        node = await createStoryNode(
          storyId,
          nodeKey,
          generatedStory.content,
          generatedStory.isEnding,
          generatedStory.endingType,
          0,
          null
        );

        if (!generatedStory.choices || generatedStory.choices.length === 0) {
          console.error('AI returned no choices for initial story:', generatedStory);
          throw new Error('Story generation failed: No choices provided');
        }

        const placeholderChoices = [];
        for (let i = 0; i < generatedStory.choices.length; i++) {
          const choice = generatedStory.choices[i];
          const placeholderNode = await createStoryNode(
            storyId,
            `${generateUniqueNodeKey()}_placeholder`,
            '',
            false,
            null,
            i + 1,
            null
          );

          const createdChoice = await createStoryChoice(
            node.id,
            placeholderNode.id,
            choice.text,
            choice.hint,
            i
          );
          placeholderChoices.push({ ...createdChoice, to_node: placeholderNode });
        }

        setIsGenerating(false);

        const chapter: StoryChapter = {
          node,
          choices: placeholderChoices,
          imageUrl: currentStory.cover_image_url,
          generatingImage: false,
        };

        setChapters([chapter]);
        setLoading(false);
        return;
      }

      if (!node) {
        setLoading(false);
        return;
      }

      const nodeChoices = node.is_ending ? [] : await getNodeChoices(node.id);
      console.log('Loaded node choices:', nodeChoices.length, 'choices for node:', node.id);
      console.log('Node is_ending:', node.is_ending);
      console.log('Choices details:', nodeChoices);

      if (!imageStyleReference && node.image_prompt) {
        setImageStyleReference(node.image_prompt);
      }

      const isFirstChapter = nodeKey === 'start';
      const shouldUseCoverImage = isFirstChapter && currentStory?.cover_image_url;
      const existingNodeImage = node.image_url;

      const chapter: StoryChapter = {
        node,
        choices: nodeChoices,
        imageUrl: shouldUseCoverImage ? currentStory.cover_image_url : existingNodeImage,
        generatingImage: false, // Don't show loading state, just show content immediately
      };

      console.log('Setting chapter with choices:', chapter.choices.length);
      setChapters([chapter]);

      // Ensure cover uses the first chapter's image when available
      if (isFirstChapter && !currentStory.cover_image_url && existingNodeImage) {
        await supabase
          .from('stories')
          .update({ cover_image_url: existingNodeImage })
          .eq('id', storyId);

        setStory((prev) => (prev ? { ...prev, cover_image_url: existingNodeImage } : prev));
      }

      await trackChapterRead(userId, storyId, node.id, currentStory?.created_by || null);

      // Generate images in background without blocking text display
      // Generate images even if story is still generating - don't wait for full completion
      if (!shouldUseCoverImage && !existingNodeImage && currentStory) {
        console.log('No cached image for start node, generating new image in background');
        // Fire and forget - don't await
        startImageGeneration(
          node.id,
          node.content,
          {
            storyTitle: currentStory.title,
            artStyle: currentStory.art_style,
            storyDescription: currentStory.description,
            styleReference: imageStyleReference || node.image_prompt,
            storyId,
            nodeId: node.id,
            previousPrompt: node.image_prompt || imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(node.id, imageUrl, node.content.substring(0, 200));
            // Also set as cover image if story doesn't have one
            if (!currentStory.cover_image_url) {
              await supabase
                .from('stories')
                .update({ cover_image_url: imageUrl })
                .eq('id', storyId);
            }
          }
        );
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading story node:', error);
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleChoice = async (
    chapterIndex: number,
    choice: StoryChoice & { to_node: StoryNode }
  ) => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex].selectedChoiceId = choice.id;
    setChapters(updatedChapters);

    setStoryError(null);
    stopSpeech();

    // Removed artificial delay for faster response

    const currentNode = updatedChapters[chapterIndex].node;
    const isPlaceholder = !choice.to_node.content;

    if (isPlaceholder && story?.story_context) {
      const loadingChapter: StoryChapter = {
        node: {
          id: 'loading',
          story_id: storyId,
          node_key: 'loading',
          content: '✨ Generating your story...',
          is_ending: false,
          ending_type: null,
          sequence_order: updatedChapters.length,
          parent_choice_id: null,
          image_url: null,
          image_prompt: null,
          audio_url: null,
          created_at: new Date().toISOString(),
        },
        choices: [],
        imageUrl: null,
        generatingImage: false,
      };

      const baseChapters = [...updatedChapters];
      setChapters([...baseChapters, loadingChapter]);

      try {
        setIsGenerating(true);

        // First, wait briefly for the backend worker to fill this placeholder
        const resolvedNode = await waitForNodeResolution(choice.to_node.id);

        if (resolvedNode) {
          const nextChoices = resolvedNode.is_ending ? [] : await getNodeChoices(resolvedNode.id);
          const newPath = [...pathTaken, resolvedNode.node_key];
          setPathTaken(newPath);

          await saveProgress(userId, storyId, resolvedNode.id, newPath, resolvedNode.is_ending);

          const newChapter: StoryChapter = {
            node: resolvedNode,
            choices: nextChoices,
            imageUrl: resolvedNode.image_url,
            generatingImage: false,
          };

          setChapters([...baseChapters, newChapter]);
          setIsGenerating(false);

          await trackChapterRead(userId, storyId, resolvedNode.id, story.created_by || null);
          if (resolvedNode.is_ending) {
            await trackStoryCompletion(userId, storyId, story.created_by || null);
          }

          // If backend didn't attach an image, generate it now in the background
          if (story && !resolvedNode.image_url) {
            startImageGeneration(
              resolvedNode.id,
              resolvedNode.content,
              {
                storyTitle: story.title,
                artStyle: story.art_style,
                storyDescription: story.description,
                styleReference: imageStyleReference || resolvedNode.image_prompt,
                storyId,
                nodeId: resolvedNode.id,
                previousPrompt: resolvedNode.image_prompt || imageStyleReference,
              },
              async (imageUrl) => {
                await updateNodeImage(
                  resolvedNode.id,
                  imageUrl,
                  resolvedNode.content.substring(0, 200)
                );
              }
            );
          }

          return;
        }

        // Fallback: generate content immediately after wait timeout
        const generatedStory = await generateStory(
          story.story_context,
          choice.choice_text,
          currentNode.content
        );

        const newNodeKey = generateUniqueNodeKey();
        const newNode = await createStoryNode(
          storyId,
          newNodeKey,
          generatedStory.content,
          generatedStory.isEnding,
          generatedStory.endingType,
          updatedChapters.length,
          choice.id
        );

        await supabase.from('story_choices').update({ to_node_id: newNode.id }).eq('id', choice.id);

        const newChoices = [];
        if (!generatedStory.isEnding) {
          if (!generatedStory.choices || generatedStory.choices.length === 0) {
            console.error('AI returned no choices for non-ending story:', generatedStory);
            throw new Error('Story generation failed: No choices provided for continuing story');
          }

          for (let i = 0; i < generatedStory.choices.length; i++) {
            const ch = generatedStory.choices[i];
            const placeholderNode = await createStoryNode(
              storyId,
              `${generateUniqueNodeKey()}_placeholder`,
              '',
              false,
              null,
              i + 1,
              null
            );

            const createdChoice = await createStoryChoice(
              newNode.id,
              placeholderNode.id,
              ch.text,
              ch.hint,
              i
            );
            newChoices.push({ ...createdChoice, to_node: placeholderNode });
          }
        }

        const newPath = [...pathTaken, newNodeKey];
        setPathTaken(newPath);

        await saveProgress(userId, storyId, newNode.id, newPath, generatedStory.isEnding);

        const newChapter: StoryChapter = {
          node: newNode,
          choices: newChoices,
          imageUrl: null,
          generatingImage: false, // Show content immediately
        };

        setChapters([...baseChapters, newChapter]);
        setIsGenerating(false);

        await trackChapterRead(userId, storyId, newNode.id, story.created_by || null);

        if (generatedStory.isEnding) {
          await trackStoryCompletion(userId, storyId, story.created_by || null);
        }

        // Generate image in background without blocking (fire and forget)
        if (story) {
          startImageGeneration(
            newNode.id,
            newNode.content,
            {
              storyTitle: story.title,
              artStyle: story.art_style,
              storyDescription: story.description,
              styleReference: imageStyleReference,
              storyId,
              nodeId: newNode.id,
              previousPrompt: imageStyleReference,
            },
            async (imageUrl) => {
              await updateNodeImage(newNode.id, imageUrl, newNode.content.substring(0, 200));
            }
          );
        }
      } catch (error) {
        console.error('Error generating next chapter:', error);
        setStoryError(
          error instanceof Error ? error.message : 'Story generation failed. Please try again.'
        );
        setChapters(
          baseChapters.map((chapter, idx) =>
            idx === chapterIndex ? { ...chapter, selectedChoiceId: undefined } : chapter
          )
        );
        setIsGenerating(false);
      }
    } else {
      const newPath = [...pathTaken, choice.to_node.node_key];
      setPathTaken(newPath);

      await saveProgress(userId, storyId, choice.to_node.id, newPath, choice.to_node.is_ending);

      const nextChoices = choice.to_node.is_ending ? [] : await getNodeChoices(choice.to_node.id);

      if (!choice.to_node.is_ending && nextChoices.length === 0 && story?.story_context) {
        console.log('Node has no choices, generating them dynamically...');
        setIsGenerating(true);

        try {
          const generatedStory = await generateStory(
            story.story_context,
            choice.choice_text,
            currentNode.content
          );

          if (!generatedStory.choices || generatedStory.choices.length === 0) {
            throw new Error('Failed to generate choices for existing node');
          }

          const newChoices = [];
          for (let i = 0; i < generatedStory.choices.length; i++) {
            const ch = generatedStory.choices[i];
            const placeholderNode = await createStoryNode(
              storyId,
              `${generateUniqueNodeKey()}_placeholder`,
              '',
              false,
              null,
              i + 1,
              null
            );

            const createdChoice = await createStoryChoice(
              choice.to_node.id,
              placeholderNode.id,
              ch.text,
              ch.hint,
              i
            );
            newChoices.push({ ...createdChoice, to_node: placeholderNode });
          }

          const existingImageUrl = choice.to_node.image_url;
          const newChapter: StoryChapter = {
            node: choice.to_node,
            choices: newChoices,
            imageUrl: existingImageUrl,
            generatingImage: false,
          };

          setChapters([...updatedChapters, newChapter]);
          setIsGenerating(false);
        } catch (error) {
          console.error('Error generating choices for node:', error);
          setIsGenerating(false);
          const existingImageUrl = choice.to_node.image_url;
          setChapters([
            ...updatedChapters,
            {
              node: choice.to_node,
              choices: [],
              imageUrl: existingImageUrl,
              generatingImage: false,
            },
          ]);
        }
      } else {
        const existingImageUrl = choice.to_node.image_url;
        const newChapter: StoryChapter = {
          node: choice.to_node,
          choices: nextChoices,
          imageUrl: existingImageUrl,
          generatingImage: false,
        };

        setChapters([...updatedChapters, newChapter]);
      }

      await trackChapterRead(userId, storyId, choice.to_node.id, story?.created_by || null);

      if (choice.to_node.is_ending) {
        await trackStoryCompletion(userId, storyId, story?.created_by || null);
      }

      // Generate image in background without blocking (fire and forget)
      if (story && !choice.to_node.image_url) {
        console.log('No cached image, generating new image for node in background');
        startImageGeneration(
          choice.to_node.id,
          choice.to_node.content,
          {
            storyTitle: story.title,
            artStyle: story.art_style,
            storyDescription: story.description,
            styleReference: imageStyleReference,
            storyId,
            nodeId: choice.to_node.id,
            previousPrompt: imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(
              choice.to_node.id,
              imageUrl,
              choice.to_node.content.substring(0, 200)
            );
          }
        );
      } else if (choice.to_node.image_url) {
        console.log('Using cached image from database');
      }
    }
  };

  const handleDeleteChoice = async (chapterIndex: number, choiceId: string) => {
    try {
      await deleteStoryChoice(choiceId);
      // Remove the choice from the local state
      setChapters((prev) =>
        prev.map((ch, idx) =>
          idx === chapterIndex
            ? { ...ch, choices: ch.choices.filter((c) => c.id !== choiceId) }
            : ch
        )
      );
    } catch (error) {
      console.error('Error deleting choice:', error);
    }
  };

  const handleToggleChoiceVisibility = async (
    chapterIndex: number,
    choiceId: string,
    currentVisibility: boolean
  ) => {
    try {
      const newVisibility = !currentVisibility;
      await toggleChoiceVisibility(choiceId, newVisibility);
      // Update the local state
      setChapters((prev) =>
        prev.map((ch, idx) =>
          idx === chapterIndex
            ? {
                ...ch,
                choices: ch.choices.map((c) =>
                  c.id === choiceId ? { ...c, is_public: newVisibility } : c
                ),
              }
            : ch
        )
      );
    } catch (error) {
      console.error('Error toggling choice visibility:', error);
    }
  };

  const handleCustomChoice = async (chapterIndex: number) => {
    if (!customChoice.trim() || !story?.story_context) return;

    const customChoiceText = customChoice.trim();
    stopSpeech();
    setCustomChoiceChapterIndex(null);
    setCustomChoice('');

    const currentNode = chapters[chapterIndex].node;

    // First, create the choice record in the database
    let customChoiceRecord;
    let customPlaceholderNode;
    try {
      customPlaceholderNode = await createStoryNode(
        storyId,
        `${generateUniqueNodeKey()}_custom_placeholder`,
        '',
        false,
        null,
        0,
        null
      );

      customChoiceRecord = await createStoryChoice(
        currentNode.id,
        customPlaceholderNode.id,
        customChoiceText,
        'Custom choice by reader',
        999,
        userId
      );
    } catch (error) {
      console.error('Error creating custom choice:', error);
      return;
    }

    // Add the custom choice to the current chapter's choices and mark it as selected
    const updatedChapters = [...chapters];
    const newChoice = {
      ...customChoiceRecord,
      to_node: customPlaceholderNode,
    };
    updatedChapters[chapterIndex].choices = [...updatedChapters[chapterIndex].choices, newChoice];
    updatedChapters[chapterIndex].selectedChoiceId = customChoiceRecord.id;

    const loadingChapter: StoryChapter = {
      node: {
        id: 'loading',
        story_id: storyId,
        node_key: 'loading',
        content: '✨ Generating your story...',
        is_ending: false,
        ending_type: null,
        sequence_order: updatedChapters.length,
        parent_choice_id: null,
        image_url: null,
        image_prompt: null,
        audio_url: null,
        created_at: new Date().toISOString(),
      },
      choices: [],
      imageUrl: null,
      generatingImage: false,
    };

    setChapters([...updatedChapters, loadingChapter]);

    try {
      setIsGenerating(true);
      const generatedStory = await generateStory(
        story.story_context,
        customChoiceText,
        currentNode.content
      );

      const newNodeKey = generateUniqueNodeKey();

      const newNode = await createStoryNode(
        storyId,
        newNodeKey,
        generatedStory.content,
        generatedStory.isEnding,
        generatedStory.endingType,
        updatedChapters.length,
        customChoiceRecord.id
      );

      await supabase
        .from('story_choices')
        .update({ to_node_id: newNode.id })
        .eq('id', customChoiceRecord.id);

      const newChoices = [];
      if (!generatedStory.isEnding) {
        if (generatedStory.choices && generatedStory.choices.length > 0) {
          for (let i = 0; i < generatedStory.choices.length; i++) {
            const ch = generatedStory.choices[i];
            const placeholderNode = await createStoryNode(
              storyId,
              `${generateUniqueNodeKey()}_placeholder`,
              '',
              false,
              null,
              i + 1,
              null
            );

            const createdChoice = await createStoryChoice(
              newNode.id,
              placeholderNode.id,
              ch.text,
              ch.hint,
              i
            );
            newChoices.push({ ...createdChoice, to_node: placeholderNode });
          }
        }
      }

      const newPath = [...pathTaken, newNodeKey];
      setPathTaken(newPath);

      await saveProgress(userId, storyId, newNode.id, newPath, generatedStory.isEnding);

      const newChapter: StoryChapter = {
        node: newNode,
        choices: newChoices,
        imageUrl: null,
        generatingImage: false,
      };

      setChapters([...updatedChapters, newChapter]);
      setIsGenerating(false);

      await trackChapterRead(userId, storyId, newNode.id, story.created_by || null);

      if (generatedStory.isEnding) {
        await trackStoryCompletion(userId, storyId, story.created_by || null);
      }

      // Generate image in background
      if (story) {
        startImageGeneration(
          newNode.id,
          newNode.content,
          {
            storyTitle: story.title,
            artStyle: story.art_style,
            storyDescription: story.description,
            styleReference: imageStyleReference,
            storyId,
            nodeId: newNode.id,
            previousPrompt: imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(newNode.id, imageUrl, newNode.content.substring(0, 200));
          }
        );
      }
    } catch (error) {
      console.error('Error generating custom chapter:', error);
      // Remove the loading chapter and keep the custom choice visible but unselected
      setChapters((prev) => {
        const withoutLoading = prev.filter((ch) => ch.node.id !== 'loading');
        // Unselect the custom choice so user can try again or select another
        if (withoutLoading[chapterIndex]) {
          withoutLoading[chapterIndex] = {
            ...withoutLoading[chapterIndex],
            selectedChoiceId: undefined,
          };
        }
        return withoutLoading;
      });
      setIsGenerating(false);
    }
  };

  const preloadAudio = async (text: string, nodeId: string) => {
    try {
      // Mark as loading
      setAudioLoadingChapters((prev) => new Set(prev).add(nodeId));

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text,
          voice: 'coral',
          speed: 0.85,
        }),
      });

      if (!response.ok) {
        // Silently fail for billing issues - TTS is optional
        if (response.status === 400 || response.status === 429) {
          console.warn('Text-to-speech unavailable (billing inactive)');
          setAudioLoadingChapters((prev) => {
            const newSet = new Set(prev);
            newSet.delete(nodeId);
            return newSet;
          });
          return;
        }
        throw new Error('Failed to generate speech');
      }

      const data = await response.json();

      if (!data.audio) {
        throw new Error('No audio data received');
      }

      // Cache the audio
      audioCache.current.set(nodeId, data.audio);

      // Save to database
      await updateNodeAudio(nodeId, data.audio);

      // Mark as ready
      setAudioLoadingChapters((prev) => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      setAudioReadyChapters((prev) => new Set(prev).add(nodeId));

      console.log('Audio preloaded for node:', nodeId);
    } catch (error) {
      console.error('Error preloading audio:', error);
      setAudioLoadingChapters((prev) => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  };

  const speakText = async (text: string, nodeId: string) => {
    try {
      setError(null);
      stopSpeech();

      const words = text.split(/\s+/);

      // Get audio from cache
      const cachedAudio = audioCache.current.get(nodeId);

      if (!cachedAudio) {
        console.error('No cached audio found for node:', nodeId);
        return;
      }

      let audioUrl: string;

      // Check if it's a URL or base64 data
      if (cachedAudio.startsWith('http://') || cachedAudio.startsWith('https://')) {
        // It's already a URL, use it directly
        audioUrl = cachedAudio;
      } else {
        // It's base64 encoded audio, convert to blob URL
        try {
          const binaryString = atob(cachedAudio);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          audioUrl = URL.createObjectURL(blob);
        } catch (decodeError) {
          console.error('Failed to decode base64 audio:', decodeError);
          // If base64 decode fails, try using it as a URL anyway
          audioUrl = cachedAudio;
        }
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => {
        console.log('Audio playing');
        setIsSpeaking(true);
        setPlayingChapterId(nodeId);
        startWordHighlighting(words, audioRef.current!.duration);
      };
      audioRef.current.onended = () => {
        console.log('Audio ended');
        setIsSpeaking(false);
        setCurrentWordIndex(-1);
        setPlayingChapterId(null);
        if (wordTimerRef.current) {
          clearInterval(wordTimerRef.current);
        }
      };
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        setError('Failed to play audio');
        setCurrentWordIndex(-1);
        setPlayingChapterId(null);
        if (wordTimerRef.current) {
          clearInterval(wordTimerRef.current);
        }
      };

      console.log('Starting audio playback');
      await audioRef.current.play();
    } catch (error) {
      console.error('Error in speakText:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech';
      setError(errorMessage);
      setIsSpeaking(false);
    }
  };

  const startWordHighlighting = (words: string[], duration: number) => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
    }

    const msPerWord = (duration * 1000) / words.length;
    let wordIndex = 0;
    setCurrentWordIndex(0);

    wordTimerRef.current = setInterval(() => {
      wordIndex++;
      if (wordIndex >= words.length) {
        setCurrentWordIndex(-1);
        if (wordTimerRef.current) {
          clearInterval(wordTimerRef.current);
        }
      } else {
        setCurrentWordIndex(wordIndex);
      }
    }, msPerWord);
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setCurrentWordIndex(-1);
    setPlayingChapterId(null);
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
    }
  };

  const pauseSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
    }
  };

  const resumeSpeech = () => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsSpeaking(true);

      const currentChapter = chapters[chapters.length - 1];
      const words = currentChapter.node.content.split(/\s+/);
      const remainingDuration = audioRef.current.duration - audioRef.current.currentTime;
      const remainingWords = words.length - currentWordIndex;

      if (remainingWords > 0 && remainingDuration > 0) {
        const msPerWord = (remainingDuration * 1000) / remainingWords;
        let wordIndex = currentWordIndex;

        wordTimerRef.current = setInterval(() => {
          wordIndex++;
          if (wordIndex >= words.length) {
            setCurrentWordIndex(-1);
            if (wordTimerRef.current) {
              clearInterval(wordTimerRef.current);
            }
          } else {
            setCurrentWordIndex(wordIndex);
          }
        }, msPerWord);
      }
    }
  };

  const toggleSpeech = async (text: string, nodeId: string) => {
    // If audio is playing and we click the same chapter, pause it
    if (isSpeaking && playingChapterId === nodeId) {
      pauseSpeech();
    }
    // If audio is playing but we click a different chapter, stop current and play new
    else if (isSpeaking && playingChapterId !== nodeId) {
      stopSpeech();
      setCurrentWordIndex(-1);
      speakText(text, nodeId);
    }
    // If audio is paused on the same chapter, resume it
    else if (
      audioRef.current &&
      audioRef.current.src &&
      audioRef.current.currentTime > 0 &&
      currentWordIndex >= 0 &&
      playingChapterId === nodeId
    ) {
      resumeSpeech();
    }
    // Start new audio - if audio is ready, play it
    else if (audioReadyChapters.has(nodeId)) {
      setCurrentWordIndex(-1);
      speakText(text, nodeId);
    }
    // If audio not ready and not loading, generate it first then auto-play
    else if (!audioLoadingChapters.has(nodeId)) {
      pendingPlayChapter.current = { nodeId, text };
      await preloadAudio(text, nodeId);
    }
  };

  // Auto-play when audio becomes ready for a pending chapter
  useEffect(() => {
    if (pendingPlayChapter.current && audioReadyChapters.has(pendingPlayChapter.current.nodeId)) {
      const { nodeId, text } = pendingPlayChapter.current;
      pendingPlayChapter.current = null;
      setCurrentWordIndex(-1);
      speakText(text, nodeId);
    }
  }, [audioReadyChapters]);

  // Auto-play narration for the latest chapter when audio is ready
  useEffect(() => {
    // Skip if auto-narration is disabled or narrator not enabled for this story
    if (!autoNarrationEnabled || !story?.narrator_enabled) return;

    // Skip if no chapters or if audio is already playing
    if (chapters.length === 0 || isSpeaking) return;

    // Get the latest real chapter (not loading placeholder)
    const latestChapter = chapters
      .filter((ch) => ch.node.id !== 'loading' && ch.node.node_key !== 'loading')
      .pop();

    if (!latestChapter) return;

    const nodeId = latestChapter.node.id;
    const text = latestChapter.node.content;

    // Skip if we've already triggered auto-play for this chapter
    if (autoPlayTriggeredRef.current.has(nodeId)) return;

    // Skip if content is empty
    if (!text || text.trim().length === 0) return;

    // If audio is ready, auto-play it
    if (audioReadyChapters.has(nodeId)) {
      autoPlayTriggeredRef.current.add(nodeId);
      setCurrentWordIndex(-1);
      speakText(text, nodeId);
    }
  }, [chapters, audioReadyChapters, autoNarrationEnabled, story?.narrator_enabled, isSpeaking]);

  const restartStory = () => {
    stopSpeech();
    setPathTaken(['start']);
    setStoryError(null);
    autoPlayTriggeredRef.current.clear(); // Reset auto-play tracking for new read
    loadStoryNode('start');
  };

  const startEditingChapter = (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];
    setEditingChapter(chapterIndex);
    setEditedContent(chapter.node.content);
    setEditingChoices(
      chapter.choices.map((c) => ({ id: c.id, text: c.choice_text, hint: c.hint }))
    );
  };

  const cancelEdit = () => {
    setEditingChapter(null);
    setEditedContent('');
    setEditingChoices([]);
    setIsEditMode(false);
  };

  const saveChapterEdit = async (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];
    try {
      await supabase
        .from('story_nodes')
        .update({ content: editedContent, audio_url: null })
        .eq('id', chapter.node.id);

      for (const choice of editingChoices) {
        await supabase
          .from('story_choices')
          .update({ choice_text: choice.text, hint: choice.hint })
          .eq('id', choice.id);
      }

      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex] = {
        ...chapter,
        node: { ...chapter.node, content: editedContent, audio_url: null },
        choices: chapter.choices.map((c) => {
          const edited = editingChoices.find((ec) => ec.id === c.id);
          return edited ? { ...c, choice_text: edited.text, hint: edited.hint } : c;
        }),
      };
      setChapters(updatedChapters);

      cancelEdit();
    } catch (error) {
      console.error('Error saving edit:', error);
      setError('Failed to save changes');
    }
  };

  const addNewChoice = () => {
    setEditingChoices([...editingChoices, { id: `new_${Date.now()}`, text: '', hint: null }]);
  };

  const removeChoice = (index: number) => {
    setEditingChoices(editingChoices.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, field: 'text' | 'hint', value: string) => {
    const updated = [...editingChoices];
    updated[index] = { ...updated[index], [field]: value };
    setEditingChoices(updated);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950 pb-20">
        <div className="flex gap-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-600"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-600"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-600"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  const currentChapter = chapters[chapters.length - 1];
  const isStoryEnded = currentChapter?.node.is_ending;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sticky Header */}
      <div ref={stickyHeaderRef} className="sticky top-0 z-20 bg-gray-950 pb-2 pt-4">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          {/* Title */}
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">
              {story?.title || 'Reading Story'}
            </h1>
            <p className="text-sm text-gray-400">{story?.description || 'Your adventure awaits'}</p>
          </div>

          {/* Chapter Progress Card */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-3 shadow-xl sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="shrink-0 text-xs font-semibold text-gray-300 sm:text-sm">
                Chapter
              </span>
              <div className="flex flex-wrap items-center gap-y-2">
                {chapters
                  .filter((ch) => ch.node.id !== 'loading')
                  .map((_, idx, arr) => (
                    <div key={idx} className="flex items-center">
                      <button
                        onClick={() => {
                          const element = document.getElementById(`chapter-${idx}`);
                          if (element) scrollToElement(element);
                        }}
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110 sm:h-6 sm:w-6 sm:text-xs ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                      >
                        {idx + 1}
                      </button>
                      {idx < arr.length - 1 && (
                        <div
                          className={`h-0.5 w-2 sm:w-3 ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                        ></div>
                      )}
                    </div>
                  ))}
                {chapters.some((ch) => ch.node.id === 'loading') && (
                  <>
                    {chapters.filter((ch) => ch.node.id !== 'loading').length > 0 && (
                      <div className="h-0.5 w-2 bg-gray-700 sm:w-3"></div>
                    )}
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 sm:h-6 sm:w-6">
                      <Loader className="h-3 w-3 animate-spin text-gray-400" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/50 bg-red-900/30 p-4">
            <div className="font-semibold text-red-400">Audio Error:</div>
            <div className="flex-1 text-red-300">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              ✕
            </button>
          </div>
        )}

        <div className="space-y-6">
          {storyError && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/50 bg-red-900/30 p-4">
              <div className="font-semibold text-red-400">Story Error:</div>
              <div className="flex-1 text-red-300">{storyError}</div>
              <button
                onClick={() => setStoryError(null)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}

          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapterIndex}
              id={`chapter-${chapterIndex}`}
              ref={chapterIndex === chapters.length - 1 ? latestChapterRef : null}
            >
              {chapter.node.id === 'loading' ? (
                <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
                    <div className="space-y-1 text-center">
                      <h3 className="text-lg font-bold text-white">Crafting your story...</h3>
                      <p className="text-sm text-gray-400">The AI is writing what happens next</p>
                    </div>
                    <div className="flex gap-2">
                      <div
                        className={`h-2 w-2 animate-bounce rounded-full ${isPro ? 'bg-purple-500' : 'bg-blue-500'}`}
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className={`h-2 w-2 animate-bounce rounded-full ${isPro ? 'bg-pink-500' : 'bg-cyan-500'}`}
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className={`h-2 w-2 animate-bounce rounded-full ${isPro ? 'bg-purple-500' : 'bg-blue-500'}`}
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
                  <div className="p-6">
                    {/* Image placeholder - always shown */}
                    <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl">
                      {/* Gradient placeholder background */}
                      <div
                        className={`absolute inset-0 flex flex-col items-center justify-center ${isPro ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50'}`}
                      >
                        {chapter.generatingImage ? (
                          <>
                            <Loader
                              className={`h-6 w-6 animate-spin ${isPro ? 'text-purple-400' : 'text-blue-400'}`}
                            />
                            <span
                              className={`mt-2 text-sm font-medium ${isPro ? 'text-purple-300' : 'text-blue-300'}`}
                            >
                              Creating illustration...
                            </span>
                          </>
                        ) : (
                          !chapter.imageUrl && (
                            <Sparkles
                              className={`h-10 w-10 ${isPro ? 'text-purple-500' : 'text-blue-500'}`}
                            />
                          )
                        )}
                      </div>
                      {/* Actual image - shown when available */}
                      {chapter.imageUrl && (
                        <img
                          src={chapter.imageUrl}
                          alt={`Chapter ${chapterIndex + 1} illustration`}
                          className="relative z-[1] h-full w-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', chapter.imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      {/* Chapter number badge */}
                      <div
                        className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
                      >
                        {chapterIndex + 1}
                      </div>
                    </div>

                    {/* Video section - Max plan users only, shown at end of chapters */}
                    {hasVideoClips && story?.video_enabled && chapter.imageUrl && (
                      <div className="mb-6">
                        {chapter.videoUrl || chapter.node.video_url ? (
                          <div className="overflow-hidden rounded-2xl">
                            <video
                              src={chapter.videoUrl || chapter.node.video_url || undefined}
                              className="aspect-video w-full object-cover"
                              controls
                              playsInline
                              loop
                              muted
                              poster={chapter.imageUrl}
                            />
                          </div>
                        ) : chapter.generatingVideo ? (
                          <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                            <Film className="mb-2 h-8 w-8 text-purple-400" />
                            <Loader className="mb-2 h-5 w-5 animate-spin text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">
                              Creating video clip...
                            </span>
                            <span className="mt-1 text-xs text-purple-400">
                              This may take a few minutes
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (chapter.imageUrl) {
                                startVideoGeneration(
                                  chapter.node.id,
                                  chapter.imageUrl,
                                  `Cinematic scene from ${story?.title || 'story'}: ${chapter.node.content.substring(0, 100)}`,
                                  async (videoUrl) => {
                                    await supabase
                                      .from('story_nodes')
                                      .update({ video_url: videoUrl })
                                      .eq('id', chapter.node.id);

                                    // Update story cover_video_url if this is the first chapter
                                    if (chapterIndex === 0 && storyId) {
                                      await supabase
                                        .from('stories')
                                        .update({ cover_video_url: videoUrl })
                                        .eq('id', storyId);
                                    }
                                  }
                                );
                              }
                            }}
                            className="group flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-500/50 bg-gradient-to-br from-purple-900/30 to-pink-900/30 transition-all hover:bg-purple-900/40"
                          >
                            <Film className="h-10 w-10 text-purple-400 transition-transform group-hover:scale-110" />
                            <span className="mt-2 text-sm font-medium text-purple-300">
                              Generate Video Clip
                            </span>
                            <span className="text-xs text-purple-400">Pro feature</span>
                          </button>
                        )}
                      </div>
                    )}

                    {editingChapter === chapterIndex ? (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            Chapter Content
                          </label>
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="h-48 w-full rounded-xl border-2 border-gray-700 bg-gray-800 p-4 text-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="Enter chapter content..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveChapterEdit(chapterIndex)}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="prose max-w-none">
                          <p className="text-base leading-relaxed text-gray-300">
                            {chapter.node.content.split(/\s+/).map((word, index) => (
                              <span key={index}>
                                <span
                                  className={`transition-all duration-200 ${
                                    playingChapterId === chapter.node.id &&
                                    index === currentWordIndex
                                      ? 'rounded bg-yellow-300 px-1 font-semibold text-gray-900'
                                      : ''
                                  }`}
                                >
                                  {word}
                                </span>{' '}
                              </span>
                            ))}
                          </p>
                        </div>
                        {/* Action buttons at bottom */}
                        <div className="mt-4 flex items-center justify-end gap-2">
                          {isOwner && (
                            <button
                              onClick={() => {
                                if (hasEditMode) {
                                  setIsEditMode(true);
                                  startEditingChapter(chapterIndex);
                                } else {
                                  setShowUpgradeModal(true);
                                }
                              }}
                              className={`rounded-full p-2 transition-colors ${hasEditMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:opacity-90' : 'border-2 border-dashed border-blue-500 text-blue-500 hover:bg-blue-900/30'}`}
                              aria-label="Edit chapter"
                            >
                              <Pen className="h-4 w-4" />
                            </button>
                          )}
                          {!isEditMode && story?.narrator_enabled && (
                            <button
                              onClick={() => toggleSpeech(chapter.node.content, chapter.node.id)}
                              className={`rounded-full p-2 text-white shadow-md transition-colors hover:opacity-90 ${
                                isPro
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                  : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                              }`}
                              aria-label={
                                playingChapterId === chapter.node.id && isSpeaking
                                  ? 'Pause'
                                  : 'Play'
                              }
                            >
                              {audioLoadingChapters.has(chapter.node.id) ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : playingChapterId === chapter.node.id && isSpeaking ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* The End text */}
                    {chapter.node.is_ending && (
                      <div className="mt-6 text-center">
                        <span className="text-base font-extrabold text-white">*THE END*</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {chapter.node.id !== 'loading' &&
                chapter.choices.length > 0 &&
                editingChapter !== chapterIndex && (
                  <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-300">
                        What should happen next?
                      </h3>
                      {isVoiceSupported && !chapter.selectedChoiceId && (
                        <button
                          onClick={() => toggleVoiceInput(chapterIndex)}
                          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            isListening && voiceInputChapterIndex === chapterIndex
                              ? 'animate-pulse bg-red-500 text-white'
                              : hasVoiceInput
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'border border-purple-500/50 bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {isListening && voiceInputChapterIndex === chapterIndex ? (
                            <>
                              <MicOff className="h-3.5 w-3.5" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Mic className="h-3.5 w-3.5" />
                              <span>Speak Choice</span>
                              {!hasVoiceInput && (
                                <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold">
                                  PRO
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Voice transcript display */}
                    {isListening && voiceInputChapterIndex === chapterIndex && (
                      <div className="mb-4 rounded-xl border border-purple-500/50 bg-purple-900/30 p-3">
                        <p className="mb-1 text-xs text-purple-300">
                          Listening... Say a choice or number (1, 2, 3...)
                        </p>
                        <p className="text-sm font-medium text-white">
                          {voiceTranscript || '🎤 Speak now...'}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {chapter.choices
                        // Filter out private choices from other users (show own choices and public choices)
                        .filter((choice) => {
                          const isOwnChoice = choice.created_by === userId;
                          const isPublic = choice.is_public !== false; // Default to public if undefined
                          return isOwnChoice || isPublic;
                        })
                        .map((choice) => {
                          const isSelected = chapter.selectedChoiceId === choice.id;
                          const isDisabled = chapter.selectedChoiceId !== undefined;
                          const isOwnChoice = choice.created_by === userId;
                          const isAiGenerated = !choice.created_by;
                          const visibleChoicesCount = chapter.choices.filter((c) => {
                            const isOwn = c.created_by === userId;
                            const isPub = c.is_public !== false;
                            return isOwn || isPub;
                          }).length;
                          const hasMinimumChoices = visibleChoicesCount <= 2;
                          // Allow deletion if:
                          // 1. AI-generated choices - NO ONE can delete
                          // 2. User's own choices - can delete on any story
                          // 3. Other people's choices - story owner can delete them
                          // Must have more than 2 choices to delete
                          const isUserCreatedChoice = !isAiGenerated; // Has a created_by value
                          const canDeleteChoice = isUserCreatedChoice && (isOwnChoice || isOwner);
                          const canDelete = canDeleteChoice && !hasMinimumChoices;
                          const isPublic = choice.is_public !== false;
                          // Calculate right padding based on visible buttons
                          const hasButtons =
                            (isOwnChoice && !isDisabled) || (canDelete && !isDisabled);
                          const buttonCount =
                            (isOwnChoice && !isDisabled ? 1 : 0) +
                            (canDelete && !isDisabled ? 1 : 0);

                          const isVoiceMatched = voiceMatchedChoice === choice.id;

                          return (
                            <div key={choice.id} className="relative">
                              <button
                                onClick={() => handleChoice(chapterIndex, choice)}
                                disabled={isDisabled}
                                className={`group relative w-full rounded-xl bg-gray-800 p-4 text-left shadow-sm transition-all duration-300 ${
                                  isOwnChoice ? 'border-2 border-dashed border-purple-500' : ''
                                }${
                                  isVoiceMatched
                                    ? 'animate-pulse bg-purple-900/50 shadow-lg ring-2 ring-purple-500'
                                    : isSelected
                                      ? 'bg-green-900/30 shadow-md ring-2 ring-green-500'
                                      : isDisabled
                                        ? 'opacity-30'
                                        : 'hover:bg-gray-700 hover:shadow-md hover:ring-2 hover:ring-purple-500'
                                }`}
                              >
                                <div
                                  className={`relative ${hasButtons ? `pr-${buttonCount * 10}` : ''}`}
                                  style={{
                                    paddingRight: hasButtons
                                      ? `${buttonCount * 2.5}rem`
                                      : undefined,
                                  }}
                                >
                                  <p className="mb-1 text-sm font-semibold text-white">
                                    {choice.choice_text}
                                  </p>
                                  {choice.consequence_hint && (
                                    <p className="text-xs italic text-gray-400">
                                      💭 {choice.consequence_hint}
                                    </p>
                                  )}
                                </div>
                              </button>
                              {/* Action buttons container */}
                              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                                {/* Visibility toggle - only for own choices */}
                                {isOwnChoice && !isDisabled && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleChoiceVisibility(
                                        chapterIndex,
                                        choice.id,
                                        isPublic
                                      );
                                    }}
                                    className={`rounded-lg p-2 shadow-sm transition-all ${
                                      isPublic
                                        ? 'bg-gray-700 text-purple-400 hover:bg-purple-600 hover:text-white'
                                        : 'bg-purple-900/50 text-purple-400 hover:bg-purple-600 hover:text-white'
                                    }`}
                                    aria-label={isPublic ? 'Hide from others' : 'Show to others'}
                                    title={
                                      isPublic
                                        ? 'Visible to others - click to hide'
                                        : 'Hidden from others - click to show'
                                    }
                                  >
                                    {isPublic ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                                {/* Delete button */}
                                {canDelete && !isDisabled && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteChoice(chapterIndex, choice.id);
                                    }}
                                    className="rounded-lg bg-gray-700 p-2 text-red-400 shadow-sm transition-all hover:bg-red-600 hover:text-white"
                                    aria-label="Delete choice"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Custom Choice Input - Pro Feature */}
                    {!chapter.selectedChoiceId &&
                      (customChoiceChapterIndex === chapterIndex ? (
                        <div className="mt-3 rounded-xl border-2 border-dashed border-purple-500 bg-purple-900/20 p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customChoice}
                              onChange={(e) => setCustomChoice(e.target.value)}
                              placeholder="Write your own choice"
                              className="flex-1 rounded-xl border-2 border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                              maxLength={100}
                              autoFocus
                            />
                            <button
                              onClick={() => handleCustomChoice(chapterIndex)}
                              disabled={!customChoice.trim()}
                              className="rounded-xl bg-gray-700 p-3 text-green-400 shadow-md transition-all hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 disabled:hover:text-green-400"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setCustomChoiceChapterIndex(null);
                                setCustomChoice('');
                              }}
                              className="rounded-xl bg-gray-700 p-3 text-red-400 shadow-md transition-all hover:bg-red-600 hover:text-white"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (hasEditMode) {
                              setCustomChoiceChapterIndex(chapterIndex);
                            } else {
                              setShowUpgradeModal(true);
                            }
                          }}
                          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-medium transition-all ${hasEditMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:opacity-90' : 'border-2 border-dashed border-blue-500 text-blue-400 hover:bg-blue-900/30'}`}
                        >
                          <Pen className="h-5 w-5" />
                          <span>Write your own choice</span>
                        </button>
                      ))}
                  </div>
                )}

              {editingChapter === chapterIndex && !chapter.node.is_ending && (
                <div className="mb-8 space-y-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-300">Edit Choices</h3>
                    <button
                      onClick={addNewChoice}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Choice
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingChoices.map((choice, idx) => (
                      <div key={choice.id} className="rounded-xl bg-gray-800 p-4">
                        <div className="mb-3 flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) => updateChoice(idx, 'text', e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 p-2 text-white focus:border-purple-500 focus:outline-none"
                              placeholder="Choice text..."
                            />
                            <input
                              type="text"
                              value={choice.hint || ''}
                              onChange={(e) => updateChoice(idx, 'hint', e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                              placeholder="Hint (optional)..."
                            />
                          </div>
                          <button
                            onClick={() => removeChoice(idx)}
                            className="rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {isStoryEnded && (
          <>
            {/* Main Card Container - same width as chapters */}
            <div className="mt-6 space-y-4 rounded-3xl border border-gray-800 bg-gray-900 p-4 shadow-xl">
              {/* Creator Card - Clickable with shadow */}
              {story?.creator && (
                <button
                  onClick={() => {
                    if (story.created_by && onViewProfile) {
                      onViewProfile(story.created_by);
                    }
                  }}
                  className="flex w-full items-center gap-4 rounded-2xl bg-gray-800 p-4 shadow-md transition-all hover:bg-gray-700 hover:shadow-lg"
                >
                  {story.creator.avatar_url ? (
                    <img
                      src={story.creator.avatar_url}
                      alt={getSafeDisplayName(story.creator.display_name, 'Creator')}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${isPro ? 'bg-gradient-to-br from-purple-900 to-pink-900' : 'bg-gradient-to-br from-blue-900 to-cyan-900'}`}
                    >
                      <User className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-400">Created by</p>
                    <p className="text-base font-bold text-white">
                      {getSafeDisplayName(story.creator.display_name, 'Anonymous')}
                    </p>
                  </div>
                  <div className="text-gray-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              )}

              {/* Reaction Card */}
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
                    onClick={async () => {
                      if (!userId) {
                        alert('Please sign in to react to stories');
                        return;
                      }
                      try {
                        if (userReaction?.reaction_type === 'like') {
                          await removeReaction(userId, storyId);
                          setUserReaction(null);
                          setLikesCount((prev) => prev - 1);
                        } else {
                          if (userReaction) {
                            await updateReaction(userId, storyId, 'like');
                            setDislikesCount((prev) => prev - 1);
                            setLikesCount((prev) => prev + 1);
                          } else {
                            await addReaction(userId, storyId, 'like');
                            setLikesCount((prev) => prev + 1);
                          }
                          setUserReaction({
                            user_id: userId,
                            story_id: storyId,
                            reaction_type: 'like',
                            created_at: new Date().toISOString(),
                          });
                        }
                      } catch (error) {
                        console.error('Error handling reaction:', error);
                      }
                    }}
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
                    onClick={async () => {
                      if (!userId) {
                        alert('Please sign in to react to stories');
                        return;
                      }
                      try {
                        if (userReaction?.reaction_type === 'dislike') {
                          await removeReaction(userId, storyId);
                          setUserReaction(null);
                          setDislikesCount((prev) => prev - 1);
                        } else {
                          if (userReaction) {
                            await updateReaction(userId, storyId, 'dislike');
                            setLikesCount((prev) => prev - 1);
                            setDislikesCount((prev) => prev + 1);
                          } else {
                            await addReaction(userId, storyId, 'dislike');
                            setDislikesCount((prev) => prev + 1);
                          }
                          setUserReaction({
                            user_id: userId,
                            story_id: storyId,
                            reaction_type: 'dislike',
                            created_at: new Date().toISOString(),
                          });
                        }
                      } catch (error) {
                        console.error('Error handling reaction:', error);
                      }
                    }}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-sm font-medium">{dislikesCount}</span>
                  </button>

                  <button
                    className="flex w-10 items-center justify-center rounded-xl bg-gray-700 py-2 text-gray-400 transition-all hover:bg-blue-900/30 hover:text-blue-400"
                    onClick={async () => {
                      const shareUrl = getShareUrl(storyId);
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: story?.title || 'Story',
                            text: `Check out this interactive story: ${story?.title}`,
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
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4 pb-4">
              <button
                onClick={restartStory}
                className="flex-1 rounded-2xl bg-gray-800 py-3 text-sm font-semibold text-gray-300 shadow-md transition-all hover:bg-gray-700 hover:shadow-lg"
              >
                Read Again
              </button>
              <button
                onClick={onComplete}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl ${isPro ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'}`}
              >
                Explore More
              </button>
            </div>
          </>
        )}

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      </div>
    </div>
  );
}
