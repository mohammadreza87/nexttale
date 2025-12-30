import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
} from 'lucide-react';

interface MusicPlayerProps {
  audioUrl: string;
  title: string;
  artist?: string;
  autoPlay?: boolean;
  className?: string;
}

export function MusicPlayer({
  audioUrl,
  title,
  artist,
  autoPlay = false,
  className = '',
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay was prevented
      });
    }
  }, [autoPlay]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = time;
    setProgress(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-2xl bg-gray-900 p-6 ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Track info */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {artist && <p className="text-sm text-gray-400">{artist}</p>}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-purple-500"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleLoop}
          className={`rounded-lg p-2 transition-colors ${
            isLooping ? 'text-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Repeat className="h-5 w-5" />
        </button>

        <button
          onClick={restart}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-white"
        >
          <SkipBack className="h-6 w-6" />
        </button>

        <button
          onClick={handlePlayPause}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
        </button>

        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
            }
          }}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-white"
        >
          <SkipForward className="h-6 w-6" />
        </button>

        <button
          onClick={() => {}}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-white"
        >
          <Shuffle className="h-5 w-5" />
        </button>
      </div>

      {/* Volume control */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={toggleMute}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-white"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume * 100}
          onChange={handleVolumeChange}
          className="h-2 w-24 cursor-pointer appearance-none rounded-lg bg-gray-700 accent-purple-500"
        />
      </div>
    </div>
  );
}

export default MusicPlayer;
