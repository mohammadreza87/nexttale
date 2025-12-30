import { useState, useEffect, useRef } from 'react';
import { Loader, Wand2, Crown, Save, X, Play, Pause, Clock, Mic, MicOff } from 'lucide-react';
import { getSubscriptionUsage, type SubscriptionUsage } from '../../lib/subscriptionService';
import { generateMusic } from '../../lib/musicService';
import UsageBadge from '../UsageBadge';
import UpgradeModal from '../UpgradeModal';
import type { MusicContent } from '../../lib/musicTypes';
import { GENRE_OPTIONS, MOOD_OPTIONS } from '../../lib/musicTypes';

interface MusicCreatorProps {
  userId: string;
  onCreated: (musicId: string) => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 90, label: '1.5 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
];

export function MusicCreator({ userId, onCreated }: MusicCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('uplifting');
  const [instrumental, setInstrumental] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generated content state
  const [generatedMusic, setGeneratedMusic] = useState<MusicContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadUsage();
  }, [userId]);

  const loadUsage = async () => {
    const data = await getSubscriptionUsage(userId);
    setUsage(data);
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
    setProgress('Creating music prompt...');
    setGeneratedMusic(null);

    try {
      setProgress('Generating music with AI... This may take a minute.');
      const result = await generateMusic({
        prompt,
        genre,
        mood,
        instrumental,
        durationSeconds,
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

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Create Music</h1>
          <p className="text-sm text-gray-400">
            Generate AI music with vocals or instrumental tracks
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
                {generatedMusic.duration && (
                  <span className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs text-blue-400">
                    {generatedMusic.duration}s
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

            {/* Instrumental Toggle */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setInstrumental(false)}
                  disabled={isGenerating}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
                    !instrumental
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                  With Vocals
                </button>
                <button
                  onClick={() => setInstrumental(true)}
                  disabled={isGenerating}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
                    instrumental
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <MicOff className="h-5 w-5" />
                  Instrumental
                </button>
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

            {/* Duration */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Clock className="h-4 w-4" />
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDurationSeconds(opt.value)}
                    disabled={isGenerating}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      durationSeconds === opt.value
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">
                Describe your music
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  instrumental
                    ? 'E.g., A chill lo-fi beat with soft piano and vinyl crackle...'
                    : 'E.g., An uplifting pop song about chasing dreams and never giving up...'
                }
                className="h-28 w-full resize-none rounded-2xl border-2 border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                disabled={isGenerating}
              />
              <p className="mt-2 text-xs text-gray-500">
                Tip: Be specific about instruments, tempo, and style for better results
              </p>
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
                  Generating...
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
              <li>Choose vocals or instrumental</li>
              <li>Select genre, mood, and duration</li>
              <li>Describe your music in detail</li>
              <li>AI generates a complete song for you</li>
            </ol>
            <p className="mt-3 text-xs text-purple-400">
              Powered by ElevenLabs Eleven Music - the first AI music model trained on licensed
              data!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicCreator;
