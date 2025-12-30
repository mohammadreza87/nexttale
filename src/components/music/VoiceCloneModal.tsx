import { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Upload,
  Trash2,
  Loader,
  AlertCircle,
  Check,
  Volume2,
  ChevronLeft,
} from 'lucide-react';
import { getUserVoiceClones, cloneVoice, deleteVoiceClone } from '../../lib/musicService';
import type { VoiceClone } from '../../lib/musicTypes';
import VoiceRecorder from './VoiceRecorder';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onVoiceCloned?: () => void;
}

type CloneMethod = 'record' | 'upload' | null;

export function VoiceCloneModal({ isOpen, onClose, userId, onVoiceCloned }: VoiceCloneModalProps) {
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloneMethod, setCloneMethod] = useState<CloneMethod>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadVoiceClones();
    }
  }, [isOpen, userId]);

  const loadVoiceClones = async () => {
    setLoading(true);
    try {
      const clones = await getUserVoiceClones(userId);
      setVoiceClones(clones);
    } catch (err) {
      console.error('Error loading voice clones:', err);
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
      loadVoiceClones();
      onVoiceCloned?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error cloning voice:', err);
      setError(err instanceof Error ? err.message : 'Failed to clone voice');
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

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
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
      loadVoiceClones();
      onVoiceCloned?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error cloning voice:', err);
      setError(err instanceof Error ? err.message : 'Failed to clone voice');
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

  const resetState = () => {
    setCloneMethod(null);
    setVoiceName('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-3">
            {cloneMethod && (
              <button
                onClick={resetState}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {cloneMethod === 'record'
                ? 'Record Your Voice'
                : cloneMethod === 'upload'
                  ? 'Upload Audio'
                  : 'Voice Cloning'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : !cloneMethod ? (
            <>
              {/* Existing Voice Clones */}
              {voiceClones.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-300">Your Voices</h3>
                  <div className="space-y-2">
                    {voiceClones.map((voice) => (
                      <div
                        key={voice.id}
                        className="flex items-center justify-between rounded-xl bg-gray-800/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/20">
                            <Volume2 className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{voice.name}</h4>
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
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clone Method Selection */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-300">
                  {voiceClones.length > 0 ? 'Add Another Voice' : 'Create Your Voice Clone'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCloneMethod('record')}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-purple-500 hover:bg-gray-800"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-white">Record</h4>
                      <p className="text-xs text-gray-400">Read sample text</p>
                    </div>
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                      Best
                    </span>
                  </button>

                  <button
                    onClick={() => setCloneMethod('upload')}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-purple-500 hover:bg-gray-800"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                      <Upload className="h-6 w-6 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-white">Upload</h4>
                      <p className="text-xs text-gray-400">Use audio file</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-6 rounded-xl border border-gray-700 bg-gray-800/30 p-3">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">Tips:</strong> Record 10-30 seconds in a quiet
                  place. Speak clearly at a natural pace for best results.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Voice Name Input */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-gray-300">Voice Name</label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., My Voice"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  disabled={isCloning}
                />
              </div>

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
                  <div className="rounded-2xl border-2 border-dashed border-gray-700 p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-500" />
                    <p className="mt-2 text-sm text-gray-300">Drop audio file or click to browse</p>
                    <p className="mt-1 text-xs text-gray-500">WAV, MP3, WebM (max 10MB)</p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.wav,.mp3,.webm,.m4a,.ogg"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={!voiceName.trim() || isCloning}
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!voiceName.trim() || isCloning}
                      className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                    >
                      {isCloning ? (
                        <span className="flex items-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          Cloning...
                        </span>
                      ) : (
                        'Choose File'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceCloneModal;
