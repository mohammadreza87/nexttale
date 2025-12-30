import { useState, useEffect, useRef } from 'react';
import { Mic, Upload, Trash2, Loader, Crown, AlertCircle, Check, X, Volume2 } from 'lucide-react';
import { getUserVoiceClones, cloneVoice, deleteVoiceClone } from '../../lib/musicService';
import { getSubscriptionUsage, type SubscriptionUsage } from '../../lib/subscriptionService';
import type { VoiceClone } from '../../lib/musicTypes';
import VoiceRecorder from './VoiceRecorder';
import UsageBadge from '../UsageBadge';
import UpgradeModal from '../UpgradeModal';

interface VoiceCloneManagerProps {
  userId: string;
}

type CloneMethod = 'record' | 'upload' | null;

export function VoiceCloneManager({ userId }: VoiceCloneManagerProps) {
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloneMethod, setCloneMethod] = useState<CloneMethod>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clones, usageData] = await Promise.all([
        getUserVoiceClones(userId),
        getSubscriptionUsage(userId),
      ]);
      setVoiceClones(clones);
      setUsage(usageData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load voice clones');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, audioType: string) => {
    if (!voiceName.trim()) {
      setError('Please enter a name for your voice');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      await cloneVoice({
        name: voiceName,
        description: 'Created by recording',
        audioBase64,
        audioType,
      });

      setSuccess('Voice cloned successfully!');
      setVoiceName('');
      setCloneMethod(null);
      loadData();

      setTimeout(() => setSuccess(null), 3000);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!voiceName.trim()) {
      setError('Please enter a name for your voice');
      return;
    }

    // Validate file type
    const validTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/webm',
      'audio/m4a',
      'audio/ogg',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|webm|m4a|ogg)$/i)) {
      setError('Please upload an audio file (WAV, MP3, WebM, M4A, or OGG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const audioBase64 = await base64Promise;

      await cloneVoice({
        name: voiceName,
        description: `Uploaded from ${file.name}`,
        audioBase64,
        audioType: file.type || 'audio/wav',
      });

      setSuccess('Voice cloned successfully!');
      setVoiceName('');
      setCloneMethod(null);
      loadData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error cloning voice:', err);
      if (err instanceof Error && err.message.includes('voice_limit_reached')) {
        setShowUpgradeModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to clone voice');
      }
    } finally {
      setIsCloning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (voiceClone: VoiceClone) => {
    if (!confirm(`Delete voice "${voiceClone.name}"? This cannot be undone.`)) return;

    setDeletingId(voiceClone.id);
    try {
      await deleteVoiceClone(voiceClone.id);
      setVoiceClones((prev) => prev.filter((v) => v.id !== voiceClone.id));
      setSuccess('Voice deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting voice:', err);
      setError('Failed to delete voice');
    } finally {
      setDeletingId(null);
    }
  };

  const canCreateMore = usage?.isPro || voiceClones.length < 1;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Voice Cloning</h1>
          <p className="text-sm text-gray-400">Clone your voice to use in stories and narration</p>
          <div className="mt-4 flex justify-center">
            <UsageBadge onUpgradeClick={() => setShowUpgradeModal(true)} />
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/50 bg-green-900/30 p-3">
            <Check className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-900/30 p-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Existing Voice Clones */}
        {voiceClones.length > 0 && (
          <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">Your Voices</h2>
            <div className="space-y-3">
              {voiceClones.map((voice) => (
                <div
                  key={voice.id}
                  className="flex items-center justify-between rounded-xl bg-gray-800/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/20">
                      <Volume2 className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{voice.name}</h3>
                      {voice.description && (
                        <p className="text-xs text-gray-400">{voice.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(voice)}
                    disabled={deletingId === voice.id}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-red-400 disabled:opacity-50"
                  >
                    {deletingId === voice.id ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create New Voice Clone */}
        {canCreateMore ? (
          <div
            className={`relative rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl ${
              usage?.isPro ? 'pt-12' : ''
            }`}
          >
            {usage?.isPro && (
              <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-r from-purple-600 to-pink-600">
                <Crown className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">PRO</span>
              </div>
            )}

            <h2 className="mb-4 text-lg font-semibold text-white">
              {voiceClones.length > 0 ? 'Add Another Voice' : 'Create Your First Voice Clone'}
            </h2>

            {/* Clone Method Selection */}
            {!cloneMethod && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Choose how you'd like to provide your voice sample:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCloneMethod('record')}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-purple-500 hover:bg-gray-800"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                      <Mic className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-white">Record</h3>
                      <p className="mt-1 text-xs text-gray-400">Read a sample text aloud</p>
                    </div>
                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                      Recommended
                    </span>
                  </button>

                  <button
                    onClick={() => setCloneMethod('upload')}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-purple-500 hover:bg-gray-800"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700">
                      <Upload className="h-7 w-7 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-white">Upload</h3>
                      <p className="mt-1 text-xs text-gray-400">Use an existing audio file</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Voice Name Input */}
            {cloneMethod && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setCloneMethod(null);
                    setError(null);
                  }}
                  className="mb-4 text-sm text-gray-400 hover:text-white"
                >
                  &larr; Back to options
                </button>

                <label className="mb-2 block text-sm font-semibold text-gray-300">Voice Name</label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., My Narration Voice"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  disabled={isCloning}
                />
              </div>
            )}

            {/* Recording Interface */}
            {cloneMethod === 'record' && (
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                isSubmitting={isCloning}
                disabled={!voiceName.trim()}
              />
            )}

            {/* Upload Interface */}
            {cloneMethod === 'upload' && (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-gray-700 p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-500" />
                  <p className="mt-3 text-gray-300">Drop an audio file here or click to browse</p>
                  <p className="mt-1 text-sm text-gray-500">WAV, MP3, WebM, M4A, OGG (max 10MB)</p>
                  <p className="mt-2 text-xs text-purple-400">
                    For best results, use a clear recording of 10-30 seconds
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.wav,.mp3,.webm,.m4a,.ogg"
                    onChange={handleFileUpload}
                    disabled={!voiceName.trim() || isCloning}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    style={{ position: 'relative', marginTop: '1rem' }}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!voiceName.trim() || isCloning}
                    className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                  >
                    {isCloning ? (
                      <span className="flex items-center gap-2">
                        <Loader className="h-5 w-5 animate-spin" />
                        Cloning...
                      </span>
                    ) : (
                      'Choose File'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Upgrade Prompt for Free Users */
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <div className="text-center">
              <Crown className="mx-auto h-12 w-12 text-purple-400" />
              <h2 className="mt-4 text-xl font-bold text-white">Voice Limit Reached</h2>
              <p className="mt-2 text-gray-400">
                Free users can have 1 voice clone. Upgrade to Pro for unlimited voices!
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="space-y-2 text-sm text-gray-300">
            <p className="font-semibold">Tips for best results:</p>
            <ul className="list-inside list-disc space-y-1 text-gray-400">
              <li>Record in a quiet environment</li>
              <li>Speak clearly at a natural pace</li>
              <li>Use a good quality microphone if possible</li>
              <li>Record 10-30 seconds of speech</li>
              <li>Avoid background music or noise</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceCloneManager;
