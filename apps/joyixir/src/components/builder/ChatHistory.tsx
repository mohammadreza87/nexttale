/**
 * Chat History Component
 * Shows list of chat sessions for a project
 */

import { MessageSquare, Plus, Clock } from 'lucide-react';
import type { ChatSession } from '../../types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export function ChatHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  isLoading = false,
}: ChatHistoryProps) {
  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="h-10 animate-pulse rounded-lg bg-gray-800" />
        <div className="h-10 animate-pulse rounded-lg bg-gray-800" />
        <div className="h-10 animate-pulse rounded-lg bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* New Chat button */}
      <div className="border-b border-gray-800 p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-violet-500/50 hover:bg-gray-800/50 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Unpublished section header */}
      {sessions.length > 0 && (
        <div className="px-3 pt-3 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Unpublished
          </span>
        </div>
      )}

      {/* Session list */}
      <div className="flex flex-col gap-1 px-3 pb-3">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-500">No chat sessions yet</p>
            <p className="text-xs text-gray-600">Start a new chat to begin</p>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                activeSessionId === session.id
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="truncate text-sm">{session.title}</span>
              <span className="ml-2 flex shrink-0 items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTime(session.updated_at)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
