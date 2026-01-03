/**
 * Chat Messages Component
 * Displays chat message history with AI responses
 */

import { Loader2 } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  projectReady: boolean;
  isSettingUp: boolean;
}

export function ChatMessages({
  messages,
  isGenerating,
  projectReady,
  isSettingUp,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${
              msg.role === 'user'
                ? 'ml-4'
                : msg.role === 'system'
                  ? 'mx-2'
                  : 'mr-4'
            }`}
          >
            <div
              className={`rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : msg.role === 'system'
                    ? 'bg-gray-800 italic text-gray-400'
                    : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="mr-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-3 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Getting started hint */}
      {!projectReady && !isSettingUp && (
        <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <p className="text-sm text-gray-300">
            Describe what game you want to build and I'll create it for you.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Examples: "Snake game", "2048 puzzle", "3D racing game", "Flappy
            bird clone"
          </p>
        </div>
      )}
    </div>
  );
}
