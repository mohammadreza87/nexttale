import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, Loader, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioType: string) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

// Sample texts for voice cloning - diverse sentences for better voice capture
const SAMPLE_TEXTS = [
  {
    id: 'story',
    title: 'Story Excerpt',
    text: 'The sun was setting behind the mountains, casting long shadows across the valley. I walked along the winding path, listening to the birds singing their evening songs. It was peaceful here, far from the noise of the city.',
  },
  {
    id: 'pangram',
    title: 'Classic Pangram',
    text: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! The five boxing wizards jump quickly.',
  },
  {
    id: 'emotions',
    title: 'Emotional Range',
    text: "I'm so excited to share this wonderful news with you! But wait, something seems wrong. Oh no, I can't believe this happened. Actually, everything turned out perfectly fine in the end.",
  },
  {
    id: 'intro',
    title: 'Personal Introduction',
    text: "Hello! My name is... and I'm recording my voice today. I love creating stories and sharing them with the world. This is what my voice sounds like when I'm happy and relaxed.",
  },
];

const MIN_RECORDING_SECONDS = 10;
const MAX_RECORDING_SECONDS = 30;

export function VoiceRecorder({ onRecordingComplete, isSubmitting, disabled }: VoiceRecorderProps) {
  const [selectedText, setSelectedText] = useState(SAMPLE_TEXTS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Use webm for better browser support, will be converted server-side if needed
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError(
          'Microphone access denied. Please allow microphone access in your browser settings.'
        );
      } else {
        setError('Failed to start recording. Please check your microphone.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setError(null);
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSubmit = useCallback(() => {
    if (!audioBlob) return;

    if (recordingTime < MIN_RECORDING_SECONDS) {
      setError(`Recording must be at least ${MIN_RECORDING_SECONDS} seconds long.`);
      return;
    }

    const audioType = audioBlob.type || 'audio/webm';
    onRecordingComplete(audioBlob, audioType);
  }, [audioBlob, recordingTime, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (recordingTime / MAX_RECORDING_SECONDS) * 100;
  const isValidLength = recordingTime >= MIN_RECORDING_SECONDS;

  return (
    <div className="space-y-6">
      {/* Sample Text Selection */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-gray-300">
          Choose a text to read
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_TEXTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => setSelectedText(sample)}
              disabled={isRecording || disabled}
              className={`rounded-xl px-3 py-2 text-left text-sm transition-all ${
                selectedText.id === sample.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
              } disabled:opacity-50`}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Text to Read */}
      <div className="rounded-2xl bg-gray-800/50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-300">Read this text aloud:</h3>
        <p className="text-lg leading-relaxed text-white">{selectedText.text}</p>
        <p className="mt-3 text-xs text-gray-500">
          Tip: Speak clearly at a natural pace. A quiet environment works best.
        </p>
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-4">
        {/* Progress Ring / Timer */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Background circle */}
          <svg className="absolute h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progressPercent / 100)}`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="z-10 flex flex-col items-center">
            {isRecording ? (
              <>
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                <span className="mt-1 text-2xl font-bold text-white">
                  {formatTime(recordingTime)}
                </span>
                <span className="text-xs text-gray-400">Recording</span>
              </>
            ) : audioBlob ? (
              <>
                <Check
                  className={`h-8 w-8 ${isValidLength ? 'text-green-500' : 'text-yellow-500'}`}
                />
                <span className="mt-1 text-lg font-bold text-white">
                  {formatTime(recordingTime)}
                </span>
                <span className="text-xs text-gray-400">
                  {isValidLength ? 'Ready' : `Min ${MIN_RECORDING_SECONDS}s`}
                </span>
              </>
            ) : (
              <>
                <Mic className="h-8 w-8 text-gray-400" />
                <span className="mt-1 text-sm text-gray-400">Tap to record</span>
              </>
            )}
          </div>
        </div>

        {/* Main Action Button */}
        {!audioBlob ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            } disabled:opacity-50`}
          >
            {isRecording ? (
              <Square className="h-6 w-6 text-white" fill="white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Playback button */}
            <button
              onClick={togglePlayback}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-white transition-all hover:bg-gray-600"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>

            {/* Re-record button */}
            <button
              onClick={resetRecording}
              disabled={isSubmitting}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-white transition-all hover:bg-gray-600 disabled:opacity-50"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!isValidLength || isSubmitting}
              className="flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Use This
                </>
              )}
            </button>
          </div>
        )}

        {/* Hidden audio element for playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>

      {/* Recording Tips */}
      {!audioBlob && !isRecording && (
        <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-3">
          <p className="text-center text-sm text-gray-400">
            Record for at least{' '}
            <strong className="text-white">{MIN_RECORDING_SECONDS} seconds</strong> (max{' '}
            {MAX_RECORDING_SECONDS}s)
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-900/30 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Permission denied help */}
      {permissionDenied && (
        <div className="rounded-xl border border-yellow-500/50 bg-yellow-900/30 p-3">
          <p className="text-sm text-yellow-400">To enable microphone access:</p>
          <ol className="mt-2 list-inside list-decimal text-xs text-yellow-400/80">
            <li>Click the lock/info icon in your browser's address bar</li>
            <li>Find "Microphone" and set it to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
