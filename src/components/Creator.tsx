import { useState } from 'react';
import { BookOpen, Gamepad2, Music, Mic } from 'lucide-react';
import { StoryCreator } from './StoryCreator';
import { InteractiveCreator } from './interactive/InteractiveCreator';
import { MusicCreator } from './music/MusicCreator';
import { VoiceCloneManager } from './music/VoiceCloneManager';

type CreatorTab = 'story' | 'interactive' | 'music' | 'voice';

interface CreatorProps {
  userId: string;
  onStoryCreated: (storyId: string) => void;
  onInteractiveCreated: (contentId: string) => void;
  onMusicCreated?: (musicId: string) => void;
  initialTab?: CreatorTab;
}

export function Creator({
  userId,
  onStoryCreated,
  onInteractiveCreated,
  onMusicCreated,
  initialTab = 'interactive',
}: CreatorProps) {
  const [activeTab, setActiveTab] = useState<CreatorTab>(initialTab);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Tab Switcher */}
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 pb-2 pt-4">
          <div className="flex gap-2 rounded-2xl bg-gray-900 p-1.5">
            <button
              onClick={() => setActiveTab('interactive')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                activeTab === 'interactive'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-5 w-5" />
              <span>Interactive</span>
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                activeTab === 'music'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music className="h-5 w-5" />
              <span>Music</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic className="h-5 w-5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setActiveTab('story')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                activeTab === 'story'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span>Story</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === 'interactive' && (
          <InteractiveCreator userId={userId} onCreated={onInteractiveCreated} />
        )}
        {activeTab === 'music' && (
          <MusicCreator userId={userId} onCreated={onMusicCreated || (() => {})} />
        )}
        {activeTab === 'voice' && <VoiceCloneManager userId={userId} />}
        {activeTab === 'story' && <StoryCreator userId={userId} onStoryCreated={onStoryCreated} />}
      </div>
    </div>
  );
}

export default Creator;
