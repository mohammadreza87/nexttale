import { useRef, useCallback, useEffect } from 'react';
import { useStoryReaderStore } from '../../../stores';
import { updateNodeAudio } from '../../../lib/storyService';

interface UseAudioNarrationOptions {
  nodeId: string;
  nodeContent: string;
  audioUrl: string | null;
  narratorEnabled: boolean;
}

export function useAudioNarration({
  nodeId,
  nodeContent,
  audioUrl,
  narratorEnabled,
}: UseAudioNarrationOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  const {
    isSpeaking,
    playingChapterId,
    currentWordIndex,
    audioLoadingChapters,
    audioReadyChapters,
    setIsSpeaking,
    setPlayingChapterId,
    setCurrentWordIndex,
    addAudioLoadingChapter,
    removeAudioLoadingChapter,
    addAudioReadyChapter,
  } = useStoryReaderStore();

  const isPlaying = isSpeaking && playingChapterId === nodeId;
  const isLoading = audioLoadingChapters.has(nodeId);
  const isReady = audioReadyChapters.has(nodeId);

  // Initialize audio cache from database URL
  useEffect(() => {
    if (audioUrl && !audioUrl.startsWith('blob:') && !audioCache.current.has(nodeId)) {
      audioCache.current.set(nodeId, audioUrl);
      addAudioReadyChapter(nodeId);
    }
  }, [audioUrl, nodeId, addAudioReadyChapter]);

  const preloadAudio = useCallback(async () => {
    if (isReady || isLoading || !narratorEnabled || !nodeContent.trim()) {
      return;
    }

    try {
      addAudioLoadingChapter(nodeId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: nodeContent,
          voice: 'coral',
          speed: 0.85,
        }),
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 429) {
          console.warn('Text-to-speech unavailable');
          return;
        }
        throw new Error('Failed to generate speech');
      }

      const data = await response.json();
      if (!data.audio) {
        throw new Error('No audio data received');
      }

      audioCache.current.set(nodeId, data.audio);
      await updateNodeAudio(nodeId, data.audio);
      addAudioReadyChapter(nodeId);
    } catch (error) {
      console.error('Error preloading audio:', error);
    } finally {
      removeAudioLoadingChapter(nodeId);
    }
  }, [
    nodeId,
    nodeContent,
    narratorEnabled,
    isReady,
    isLoading,
    addAudioLoadingChapter,
    removeAudioLoadingChapter,
    addAudioReadyChapter,
  ]);

  const startWordHighlighting = useCallback(
    (duration: number) => {
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
      }

      const words = nodeContent.split(/\s+/);
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
    },
    [nodeContent, setCurrentWordIndex]
  );

  const play = useCallback(async () => {
    const cachedAudio = audioCache.current.get(nodeId);
    if (!cachedAudio) {
      await preloadAudio();
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    let audioUrl: string;
    if (cachedAudio.startsWith('http://') || cachedAudio.startsWith('https://')) {
      audioUrl = cachedAudio;
    } else {
      try {
        const binaryString = atob(cachedAudio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
      } catch {
        audioUrl = cachedAudio;
      }
    }

    audioRef.current.src = audioUrl;
    audioRef.current.onplay = () => {
      setIsSpeaking(true);
      setPlayingChapterId(nodeId);
      startWordHighlighting(audioRef.current!.duration);
    };
    audioRef.current.onended = () => {
      setIsSpeaking(false);
      setCurrentWordIndex(-1);
      setPlayingChapterId(null);
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
      }
    };
    audioRef.current.onerror = () => {
      setIsSpeaking(false);
      setCurrentWordIndex(-1);
      setPlayingChapterId(null);
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
      }
    };

    await audioRef.current.play();
  }, [
    nodeId,
    preloadAudio,
    startWordHighlighting,
    setIsSpeaking,
    setPlayingChapterId,
    setCurrentWordIndex,
  ]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
    }
  }, [setIsSpeaking]);

  const stop = useCallback(() => {
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
  }, [setIsSpeaking, setCurrentWordIndex, setPlayingChapterId]);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else if (isSpeaking && playingChapterId !== nodeId) {
      stop();
      await play();
    } else if (isReady) {
      setCurrentWordIndex(-1);
      await play();
    } else if (!isLoading) {
      await preloadAudio();
    }
  }, [isPlaying, isSpeaking, playingChapterId, nodeId, isReady, isLoading, pause, stop, play, preloadAudio, setCurrentWordIndex]);

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

  return {
    isPlaying,
    isLoading,
    isReady,
    currentWordIndex: playingChapterId === nodeId ? currentWordIndex : -1,
    play,
    pause,
    stop,
    toggle,
    preloadAudio,
  };
}
