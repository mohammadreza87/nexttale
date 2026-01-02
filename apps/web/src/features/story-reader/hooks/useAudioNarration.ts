import { useState, useRef, useEffect, useCallback } from 'react';
import { updateNodeAudio } from '../../../lib/storyService';

interface AudioNarrationOptions {
  narratorEnabled: boolean;
  autoNarrationEnabled: boolean;
  chapters: Array<{
    node: {
      id: string;
      node_key: string;
      content: string;
      audio_url: string | null;
    };
  }>;
}

interface AudioNarrationReturn {
  isSpeaking: boolean;
  currentWordIndex: number;
  playingChapterId: string | null;
  audioLoadingChapters: Set<string>;
  audioReadyChapters: Set<string>;
  toggleSpeech: (text: string, nodeId: string) => Promise<void>;
  stopSpeech: () => void;
  resetAutoPlay: () => void;
  error: string | null;
  clearError: () => void;
}

export function useAudioNarration({
  narratorEnabled,
  autoNarrationEnabled,
  chapters,
}: AudioNarrationOptions): AudioNarrationReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playingChapterId, setPlayingChapterId] = useState<string | null>(null);
  const [audioLoadingChapters, setAudioLoadingChapters] = useState<Set<string>>(new Set());
  const [audioReadyChapters, setAudioReadyChapters] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const pendingPlayChapter = useRef<{ nodeId: string; text: string } | null>(null);
  const autoPlayTriggeredRef = useRef<Set<string>>(new Set());

  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    if (chapters.length > 0 && narratorEnabled) {
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
  }, [chapters, narratorEnabled, audioReadyChapters, audioLoadingChapters]);

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
    if (!autoNarrationEnabled || !narratorEnabled) return;

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
  }, [chapters, audioReadyChapters, autoNarrationEnabled, narratorEnabled, isSpeaking]);

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
    } catch (err) {
      console.error('Error preloading audio:', err);
      setAudioLoadingChapters((prev) => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
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
    } catch (err) {
      console.error('Error in speakText:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMessage);
      setIsSpeaking(false);
    }
  };

  const stopSpeech = useCallback(() => {
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
  }, []);

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

  const toggleSpeech = useCallback(
    async (text: string, nodeId: string) => {
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
    },
    [isSpeaking, playingChapterId, currentWordIndex, audioReadyChapters, audioLoadingChapters]
  );

  // Reset auto-play tracking when story restarts
  const resetAutoPlay = useCallback(() => {
    autoPlayTriggeredRef.current.clear();
  }, []);

  return {
    isSpeaking,
    currentWordIndex,
    playingChapterId,
    audioLoadingChapters,
    audioReadyChapters,
    toggleSpeech,
    stopSpeech,
    resetAutoPlay,
    error,
    clearError,
  };
}
