/**
 * Left Panel Component
 * Contains Chat and Files tabs with toggle functionality
 */

import { Sparkles, FolderTree, PanelLeftClose, PanelLeft } from 'lucide-react';
import { FileTree } from '../FileTree';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ChatMessage, FileNode } from '../../types';

interface LeftPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'chat' | 'files';
  onTabChange: (tab: 'chat' | 'files') => void;
  // Chat props
  messages: ChatMessage[];
  isGenerating: boolean;
  projectReady: boolean;
  isSettingUp: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  // Files props
  fileTree: FileNode[];
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
}

export function LeftPanel({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  messages,
  isGenerating,
  projectReady,
  isSettingUp,
  inputValue,
  onInputChange,
  onSendMessage,
  fileTree,
  selectedFile,
  onSelectFile,
}: LeftPanelProps) {
  return (
    <>
      {/* Panel content */}
      <div
        className={`flex shrink-0 flex-col border-r border-gray-800 bg-gray-900 transition-all ${
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        {isOpen && (
          <>
            {/* Tab buttons */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => onTabChange('chat')}
                className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm ${
                  activeTab === 'chat'
                    ? 'border-b-2 border-violet-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => onTabChange('files')}
                className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm ${
                  activeTab === 'files'
                    ? 'border-b-2 border-violet-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FolderTree className="h-4 w-4" />
                Files
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' ? (
                <div className="flex h-full flex-col">
                  <ChatMessages
                    messages={messages}
                    isGenerating={isGenerating}
                    projectReady={projectReady}
                    isSettingUp={isSettingUp}
                  />
                  <ChatInput
                    value={inputValue}
                    onChange={onInputChange}
                    onSend={onSendMessage}
                    disabled={isGenerating}
                  />
                </div>
              ) : (
                <FileTree
                  files={fileTree}
                  selectedFile={selectedFile}
                  onSelectFile={onSelectFile}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex h-full w-5 items-center justify-center bg-gray-900 text-gray-500 hover:bg-gray-800 hover:text-white"
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
