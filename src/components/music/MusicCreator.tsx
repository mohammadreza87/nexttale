import { useState, useEffect, useRef } from 'react';
import {
  Loader,
  Wand2,
  Crown,
  Music,
  Feather,
  Mic2,
  MessageSquare,
  Save,
  X,
  Upload,
  Trash2,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { getSubscriptionUsage, type SubscriptionUsage } from '../../lib/subscriptionService';
import { cloneVoice, generateMusic, getUserVoiceClones } from '../../lib/musicService';
import UsageBadge from '../UsageBadge';
import UpgradeModal from '../UpgradeModal';
import type { MusicStyle, VoiceClone, MusicContent } from '../../lib/musicTypes';
import { GENRE_OPTIONS, MOOD_OPTIONS, MUSIC_STYLE_INFO } from '../../lib/musicTypes';

interface MusicCreatorProps {
  userId: string;
  onCreated: (musicId: string) => void;
}

const STYLE_ICONS: Record<MusicStyle, React.ReactNode> = {
  song: <Music className="h-6 w-6" />,
  poem: <Feather className="h-6 w-6" />,
  rap: <Mic2 className="h-6 w-6" />,
  spoken_word: <MessageSquare className="h-6 w-6" />,
};

export function MusicCreator({ userId, onCreated }: MusicCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<MusicStyle>('song');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('uplifting');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Voice clone state
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [showVoiceCloneModal, setShowVoiceCloneModal] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generated content state
  const [generatedMusic, setGeneratedMusic] = useState<MusicContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadUsage();
    loadVoiceClones();
  }, [userId]);

  const loadUsage = async () => {
    const data = await getSubscriptionUsage(userId);
    setUsage(data);
  };

  const loadVoiceClones = async () => {
    try {
      const clones = await getUserVoiceClones(userId);
      setVoiceClones(clones);
    } catch (err) {
      console.error('Error loading voice clones:', err);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Audio must be smaller than 10MB');
      return;
    }

    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloneVoice = async () => {
    if (!voiceName.trim() || !audioFile) {
      setError('Please provide a name and audio file');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      const result = await cloneVoice({
        name: voiceName,
        audioBase64,
        audioType: audioFile.type,
      });

      // Reload voice clones and select the new one
      await loadVoiceClones();
      setSelectedVoiceId(result.voiceClone.id);
      setShowVoiceCloneModal(false);
      setVoiceName('');
      handleRemoveAudio();
    } catch (err) {
      console.error('Error cloning voice:', err);
      if (err instanceof Error && err.message.includes('voice_limit_reached')) {
        setShowUpgradeModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to clone voice');
      }
    } finally {
      setIsCloning(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want to create');
      return;
    }

    if (usage && !usage.canGenerate) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress('Generating lyrics with AI...');
    setGeneratedMusic(null);

    try {
      setProgress('Creating audio with your voice...');
      const result = await generateMusic({
        prompt,
        voiceCloneId: selectedVoiceId || undefined,
        genre,
        mood,
        style,
      });

      setGeneratedMusic(result.music);
      setShowPreview(true);
      setProgress('Music created successfully!');
      loadUsage();
    } catch (err) {
      console.error('Error generating music:', err);
      if (err instanceof Error && err.message.includes('daily_limit_reached')) {
        setShowUpgradeModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate. Please try again.');
      }
    } finally {
      setIsGenerating(false);
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

  const handleDiscard = () => {
    setGeneratedMusic(null);
    setShowPreview(false);
    setProgress('');
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handlePublish = () => {
    if (generatedMusic) {
      onCreated(generatedMusic.id);
    }
  };

  const selectedVoice = voiceClones.find((v) => v.id === selectedVoiceId);

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Create Music</h1>
          <p className="text-sm text-gray-400">
            Clone your voice and create AI-generated songs, poems, and more
          </p>
          <div className="mt-4 flex justify-center">
            <UsageBadge onUpgradeClick={() => setShowUpgradeModal(true)} />
          </div>
        </div>

        {/* Preview Mode */}
        {showPreview && generatedMusic && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <div>
                <h2 className="text-lg font-bold text-white">{generatedMusic.title}</h2>
                <p className="text-sm text-gray-400">{generatedMusic.description}</p>
              </div>
              <button
                onClick={handleDiscard}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audio Player */}
            <div className="p-6">
              <div className="mb-6 flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
                </button>
              </div>

              <audio
                ref={audioRef}
                src={generatedMusic.audio_url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Lyrics */}
              {generatedMusic.lyrics && (
                <div className="mb-4 rounded-2xl bg-gray-800/50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-300">Lyrics</h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-400">
                    {generatedMusic.lyrics}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                {generatedMusic.genre && (
                  <span className="rounded-lg bg-purple-500/20 px-3 py-1 text-xs text-purple-400">
                    {generatedMusic.genre}
                  </span>
                )}
                {generatedMusic.mood && (
                  <span className="rounded-lg bg-pink-500/20 px-3 py-1 text-xs text-pink-400">
                    {generatedMusic.mood}
                  </span>
                )}
                {generatedMusic.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview Actions */}
            <div className="flex gap-3 border-t border-gray-800 p-4">
              <button
                onClick={handleDiscard}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
                Discard
              </button>
              <button
                onClick={handlePublish}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-colors hover:from-purple-700 hover:to-pink-700"
              >
                <Save className="h-5 w-5" />
                Done
              </button>
            </div>
          </div>
        )}

        {/* Creation Form */}
        {!showPreview && (
          <div
            className={`relative mb-6 space-y-4 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl ${
              usage?.isPro ? 'pt-12' : ''
            }`}
          >
            {usage?.isPro && (
              <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-r from-purple-600 to-pink-600">
                <Crown className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">PRO</span>
              </div>
            )}

            {/* Voice Selection */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">Voice</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVoiceId(null)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    !selectedVoiceId
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Volume2 className="mr-2 inline-block h-4 w-4" />
                  Default Voice
                </button>
                {voiceClones.map((clone) => (
                  <button
                    key={clone.id}
                    onClick={() => setSelectedVoiceId(clone.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      selectedVoiceId === clone.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <Mic2 className="mr-2 inline-block h-4 w-4" />
                    {clone.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowVoiceCloneModal(true)}
                  className="rounded-xl border-2 border-dashed border-gray-700 px-4 py-2 text-sm font-medium text-purple-400 transition-all hover:border-purple-500 hover:bg-gray-800"
                >
                  <Upload className="mr-2 inline-block h-4 w-4" />
                  Clone Your Voice
                </button>
              </div>
              {selectedVoice && (
                <p className="mt-2 text-xs text-gray-500">Using: {selectedVoice.name}</p>
              )}
            </div>

            {/* Style Selection */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MUSIC_STYLE_INFO) as MusicStyle[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    disabled={isGenerating}
                    className={`rounded-xl p-3 text-left transition-all disabled:opacity-50 ${
                      style === s
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {STYLE_ICONS[s]}
                      <span className="font-medium">{MUSIC_STYLE_INFO[s].label}</span>
                    </div>
                    <p className="line-clamp-1 text-xs opacity-80">
                      {MUSIC_STYLE_INFO[s].description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Genre & Mood */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-800/50 p-4">
                <label className="mb-3 block text-sm font-semibold text-gray-300">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl bg-gray-800/50 p-4">
                <label className="mb-3 block text-sm font-semibold text-gray-300">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                >
                  {MOOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">
                What should your {style === 'rap' ? 'rap' : style} be about?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`E.g., A ${style} about overcoming challenges and finding inner strength...`}
                className="h-28 w-full resize-none rounded-2xl border-2 border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                disabled={isGenerating}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-2xl border border-red-500/50 bg-red-900/30 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Progress Display */}
            {isGenerating && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader className="h-5 w-5 animate-spin text-purple-500" />
                <span className="text-gray-300">{progress}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-6 text-lg font-bold text-white shadow-xl transition-all duration-200 hover:from-purple-700 hover:to-pink-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader className="h-6 w-6 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Wand2 className="h-6 w-6" />
                  Generate Music
                </>
              )}
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="space-y-2 text-sm text-gray-300">
            <p className="font-semibold">How it works:</p>
            <ol className="list-inside list-decimal space-y-1 text-gray-400">
              <li>Clone your voice or use the default voice</li>
              <li>Choose a style, genre, and mood</li>
              <li>Describe what your content should be about</li>
              <li>AI generates lyrics and creates audio with your voice</li>
            </ol>
            <p className="mt-3 text-xs text-purple-400">
              Tip: For best voice cloning results, record 30+ seconds of clear speech!
            </p>
          </div>
        </div>
      </div>

      {/* Voice Clone Modal */}
      {showVoiceCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic2 className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Clone Your Voice</h3>
              </div>
              <button
                onClick={() => setShowVoiceCloneModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-400">
              Upload an audio recording of your voice (at least 30 seconds recommended). Speak
              clearly and avoid background noise for best results.
            </p>

            {/* Voice Name */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-300">Voice Name</label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="e.g., My Voice"
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                disabled={isCloning}
              />
            </div>

            {/* Audio Upload */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-300">Voice Sample</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
                disabled={isCloning}
              />

              {audioPreviewUrl ? (
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-300">{audioFile?.name}</span>
                    <button
                      onClick={handleRemoveAudio}
                      disabled={isCloning}
                      className="rounded-lg p-1 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <audio src={audioPreviewUrl} controls className="w-full" />
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCloning}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 py-8 text-gray-400 transition-colors hover:border-purple-500 hover:text-purple-400 disabled:opacity-50"
                >
                  <Upload className="h-6 w-6" />
                  <span>Click to upload audio</span>
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/50 bg-red-900/30 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVoiceCloneModal(false);
                  setError(null);
                }}
                disabled={isCloning}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneVoice}
                disabled={isCloning || !voiceName.trim() || !audioFile}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isCloning ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Mic2 className="h-5 w-5" />
                    Clone Voice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MusicCreator;
