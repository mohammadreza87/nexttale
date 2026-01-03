/**
 * Left Panel Component
 * Chat panel with project info, suggestions, and controls
 */

import { useState } from 'react';
import { ArrowLeft, Code2, PanelLeftClose, PanelLeft, History, MessageSquare } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { CreditsPanel } from './CreditsPanel';
import { ChatHistory } from './ChatHistory';
import type { ChatMessage, ChatSession } from '../../types';
import type { BuilderViewMode } from './HeaderTabs';

type LeftPanelTab = 'chat' | 'history';

interface LeftPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  // View mode
  viewMode: BuilderViewMode;
  onBackToPreview?: () => void;
  // Chat props
  messages: ChatMessage[];
  isGenerating: boolean;
  projectReady: boolean;
  isSettingUp: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSuggestionClick?: (prompt: string) => void;
  // Credits props
  creditsRemaining?: number;
  creditsDismissed?: boolean;
  onAddCredits?: () => void;
  onDismissCredits?: () => void;
  // Chat history props
  chatSessions?: ChatSession[];
  activeChatSessionId?: string | null;
  onSelectChatSession?: (session: ChatSession) => void;
  onNewChat?: () => void;
  isLoadingHistory?: boolean;
}

export function LeftPanel({
  isOpen,
  onToggle,
  viewMode,
  onBackToPreview,
  // Chat
  messages,
  isGenerating,
  projectReady,
  isSettingUp,
  inputValue,
  onInputChange,
  onSendMessage,
  onSuggestionClick,
  creditsRemaining = 50,
  creditsDismissed = false,
  onAddCredits,
  onDismissCredits,
  chatSessions = [],
  activeChatSessionId = null,
  onSelectChatSession,
  onNewChat,
  isLoadingHistory = false,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('chat');

  // Handle suggestion click - either from ChatMessages or ChatInput
  const handleSuggestionClick = (prompt: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(prompt);
    } else {
      onInputChange(prompt);
    }
  };

  // Handle selecting a chat session from history
  const handleSelectSession = (session: ChatSession) => {
    if (onSelectChatSession) {
      onSelectChatSession(session);
      setActiveTab('chat'); // Switch to chat view after selecting
    }
  };

  // Handle new chat
  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
      setActiveTab('chat'); // Switch to chat view after creating new
    }
  };

  return (
    <>
      {/* Panel content */}
      <div
        className={`flex shrink-0 flex-col border-r border-gray-800 bg-gray-900 transition-all ${
          isOpen ? 'w-96' : 'w-0'
        }`}
      >
        {isOpen && (
          <div className="flex h-full flex-col">
            {/* Header - Tab buttons */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'border-b-2 border-violet-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'border-b-2 border-violet-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <History className="h-4 w-4" />
                History
              </button>
            </div>

            {activeTab === 'chat' ? (
              <>
                {/* Chat messages */}
                <ChatMessages
                  messages={messages}
                  isGenerating={isGenerating}
                  projectReady={projectReady}
                  isSettingUp={isSettingUp}
                  onSuggestionClick={handleSuggestionClick}
                />

                {/* Credits panel */}
                <CreditsPanel
                  creditsRemaining={creditsRemaining}
                  onAddCredits={onAddCredits || (() => {})}
                  onDismiss={onDismissCredits || (() => {})}
                  isDismissed={creditsDismissed}
                />

                {/* Back to Preview button (shown when in Code mode) */}
                {viewMode === 'code' && onBackToPreview && (
                  <div className="border-t border-gray-800 p-3">
                    <button
                      onClick={onBackToPreview}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Preview
                    </button>
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
                      <Code2 className="h-4 w-4 text-violet-400" />
                      <span className="text-sm text-white">Code</span>
                    </div>
                  </div>
                )}

                {/* Chat input */}
                <ChatInput
                  value={inputValue}
                  onChange={onInputChange}
                  onSend={onSendMessage}
                  disabled={isGenerating}
                  onSuggestionClick={handleSuggestionClick}
                />
              </>
            ) : (
              /* History tab - Chat sessions list */
              <div className="flex-1 overflow-auto">
                <ChatHistory
                  sessions={chatSessions}
                  activeSessionId={activeChatSessionId}
                  onSelectSession={handleSelectSession}
                  onNewChat={handleNewChat}
                  isLoading={isLoadingHistory}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex h-full w-5 items-center justify-center bg-gray-900 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
      >
        {isOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </button>
    </>
  );
}
