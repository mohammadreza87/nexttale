/**
 * Builder Page
 * Main game development IDE with modern UI:
 * - Chat panel on left with AI suggestions
 * - Tab-based view (Preview OR Code) on right
 * - Device toggles and view tabs in header
 * - Collapsible terminal at bottom
 */

import { useState, useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Terminal as TerminalIcon } from 'lucide-react';
import { Preview, ExportModal } from '../components';
import {
  LeftPanel,
  EditorPanel,
  TerminalPanel,
  FileBrowserPanel,
  ResizablePanels,
  ChatHeader,
  PreviewHeader,
  ChatMessages,
  ChatInput,
  CreditsPanel,
  ChatHistory,
} from '../components/builder';
import type { BuilderViewMode } from '../components/builder/HeaderTabs';
import type { DeviceMode } from '../components/builder/DeviceToggle';
import { useWebContainer, useJoyixirChat } from '../hooks';
import { viteStarterTemplate } from '../templates';
import { applyGeneratedFiles } from '../lib/joyixirService';
import {
  updateProject,
  updateProjectStatus,
  saveProjectFiles,
  getProject,
  type JoyixirProject,
} from '../lib/projectService';
import {
  getChatSessions,
  createChatSession,
  saveChatSessionMessages,
  generateSessionTitle,
} from '../lib/chatSessionService';
import { getUserSettings } from '../lib/settingsService';
import type { ChatSession, ConversationMessage } from '../types';
import type { FileSystemTree } from '@webcontainer/api';

// Convert flat file map to WebContainer FileSystemTree
function filesToFileSystemTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.replace(/^\//, '').split('/');
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!current[dir]) {
        current[dir] = { directory: {} };
      }
      const node = current[dir];
      if ('directory' in node) {
        current = node.directory;
      }
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = { file: { contents: content } };
  }

  return tree;
}

// Debounce function for auto-save
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

interface BuilderPageProps {
  user: User;
  project: JoyixirProject;
  initialPrompt?: string | null;
  onSignOut: () => void;
  onBackToHome: () => void;
}

export function BuilderPage({
  user,
  project: initialProject,
  initialPrompt,
  onSignOut,
  onBackToHome,
}: BuilderPageProps) {
  // Project state - use fresh data from database
  const [project, setProject] = useState<JoyixirProject>(initialProject);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Fetch fresh project data on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        console.log('[Builder] Fetching fresh project data for:', initialProject.id);
        const freshProject = await getProject(initialProject.id);
        if (freshProject) {
          console.log('[Builder] Loaded project with', Object.keys(freshProject.files || {}).length, 'files');
          setProject(freshProject);
        }
      } catch (err) {
        console.error('[Builder] Failed to load project:', err);
      } finally {
        setIsLoadingProject(false);
      }
    };
    loadProject();
  }, [initialProject.id]);

  // WebContainer state
  const {
    status,
    previewUrl,
    terminalOutput,
    fileTree,
    boot,
    mountProject,
    writeProjectFile,
    readProjectFile,
    install,
    startDev,
    refreshFileTree,
    runCommand,
  } = useWebContainer();

  // UI state - modern split view
  const [viewMode, setViewMode] = useState<BuilderViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [projectReady, setProjectReady] = useState(false);
  const [hasThreeJs, setHasThreeJs] = useState(project.has_three_js);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  const [creditsDismissed, setCreditsDismissed] = useState(false);
  const [chatPanelTab, setChatPanelTab] = useState<'chat' | 'history'>('chat');

  // Chat session state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [isLoadingChatSessions, setIsLoadingChatSessions] = useState(true);

  // Project dropdown state
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [studioName, setStudioName] = useState('My Studio');

  // Track files in memory for saving to database
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});

  // Sync projectFiles when project data loads
  useEffect(() => {
    if (!isLoadingProject && project.files) {
      console.log('[Builder] Syncing projectFiles from loaded project:', Object.keys(project.files).length, 'files');
      setProjectFiles(project.files);
    }
  }, [isLoadingProject, project.files]);

  // Load chat sessions when project loads
  useEffect(() => {
    const loadChatSessions = async () => {
      if (isLoadingProject) return;

      try {
        console.log('[Builder] Loading chat sessions for project:', project.id);
        const sessions = await getChatSessions(project.id);
        setChatSessions(sessions);

        // Set active session from project or use the most recent one
        if (project.active_chat_session_id && sessions.find(s => s.id === project.active_chat_session_id)) {
          setActiveChatSessionId(project.active_chat_session_id);
        } else if (sessions.length > 0) {
          setActiveChatSessionId(sessions[0].id);
        }

        console.log('[Builder] Loaded', sessions.length, 'chat sessions');
      } catch (err) {
        console.error('[Builder] Failed to load chat sessions:', err);
      } finally {
        setIsLoadingChatSessions(false);
      }
    };

    loadChatSessions();
  }, [isLoadingProject, project.id, project.active_chat_session_id]);

  // Load user settings (for studio name)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();
        setStudioName(settings.studio_name || 'My Studio');
      } catch (err) {
        console.error('[Builder] Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Debounced save to database
  const debouncedSaveFiles = useCallback(
    debounce((files: Record<string, string>) => {
      console.log('[Builder] Saving files to database...');
      saveProjectFiles(project.id, files).catch((err) => {
        console.error('[Builder] Failed to save files:', err);
      });
    }, 2000),
    [project.id]
  );

  // Upgrade to Three.js
  const upgradeToThreeJs = useCallback(async () => {
    if (hasThreeJs) return;

    addSystemMessage('Adding Three.js dependencies...');
    try {
      await runCommand('npm', [
        'install',
        '@react-three/fiber',
        '@react-three/drei',
        'three',
        '@types/three',
      ]);
      setHasThreeJs(true);
      await updateProject(project.id, { has_three_js: true });
      addSystemMessage('Three.js installed! You can now use 3D graphics.');
    } catch (err) {
      addSystemMessage(
        `Failed to install Three.js: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [hasThreeJs, runCommand, project.id]);

  // AI Chat hook with file generation callback
  const { messages, isGenerating, sendMessage: sendAiMessage, addSystemMessage } =
    useJoyixirChat({
      readFile: readProjectFile,
      hasThreeJs,
      onNeedsThreeJs: upgradeToThreeJs,
      onFilesGenerated: async (files) => {
        // Apply files to WebContainer
        await applyGeneratedFiles(files, writeProjectFile);
        await refreshFileTree();

        // Update in-memory file state
        const updatedFiles = { ...projectFiles };
        for (const file of files) {
          const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
          updatedFiles[normalizedPath] = file.content;
        }
        setProjectFiles(updatedFiles);

        // Save immediately after AI generation (important for persistence!)
        console.log('[Builder] Saving AI-generated files to database:', files.length, 'new files');
        try {
          await saveProjectFiles(project.id, updatedFiles);
          console.log('[Builder] AI-generated files saved successfully');
        } catch (err) {
          console.error('[Builder] Failed to save AI-generated files:', err);
        }
      },
    });

  // Save conversation to active chat session when messages change
  useEffect(() => {
    const saveToSession = async () => {
      // Only save if we have at least one user message (actual chat interaction)
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length === 0) return;

      const conversation: ConversationMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        if (activeChatSessionId) {
          // Update existing session
          await saveChatSessionMessages(activeChatSessionId, conversation);
        } else {
          // Create new session with first user message as title
          const title = generateSessionTitle(userMessages[0].content);

          const newSession = await createChatSession({
            project_id: project.id,
            title,
            messages: conversation,
          });

          setActiveChatSessionId(newSession.id);
          setChatSessions(prev => [newSession, ...prev]);

          // Update project's active session
          await updateProject(project.id, { active_chat_session_id: newSession.id });
        }
      } catch (err) {
        console.error('[Builder] Failed to save conversation to session:', err);
      }
    };

    saveToSession();
  }, [messages, project.id, activeChatSessionId]);

  // Start project - restore saved files or use fresh template
  const startProject = useCallback(async () => {
    if (isSettingUp || projectReady) return;

    setIsSettingUp(true);

    // Check if project has saved files
    const hasSavedFiles = Object.keys(project.files || {}).length > 0;

    if (hasSavedFiles) {
      addSystemMessage('Restoring your project...');
    } else {
      addSystemMessage('Setting up your game development environment...');
    }

    try {
      await updateProjectStatus(project.id, 'building');

      if (status === 'idle') {
        await boot();
      }

      if (hasSavedFiles) {
        // Restore saved files
        console.log('[Builder] Restoring saved files:', Object.keys(project.files).length);
        const savedFilesTree = filesToFileSystemTree(project.files);
        await mountProject(savedFilesTree);
      } else {
        // Mount fresh template
        await mountProject(viteStarterTemplate.files);

        // Save template files to database immediately (not debounced)
        const templateFiles: Record<string, string> = {};
        const extractFiles = (tree: FileSystemTree, prefix = '') => {
          for (const [name, node] of Object.entries(tree)) {
            const path = prefix ? `${prefix}/${name}` : name;
            if ('file' in node) {
              templateFiles[`/${path}`] = typeof node.file.contents === 'string'
                ? node.file.contents
                : new TextDecoder().decode(node.file.contents);
            } else if ('directory' in node) {
              extractFiles(node.directory, path);
            }
          }
        };
        extractFiles(viteStarterTemplate.files);
        setProjectFiles(templateFiles);

        // Save immediately - this is important for persistence!
        console.log('[Builder] Saving template files to database:', Object.keys(templateFiles).length, 'files');
        try {
          await saveProjectFiles(project.id, templateFiles);
          console.log('[Builder] Template files saved successfully');
        } catch (err) {
          console.error('[Builder] Failed to save template files:', err);
        }
      }

      addSystemMessage('Installing dependencies... (this takes about a minute)');
      await install();
      addSystemMessage('Starting development server...');
      await startDev();

      setProjectReady(true);
      setIsSettingUp(false);
      await updateProjectStatus(project.id, 'ready');

      if (hasSavedFiles) {
        addSystemMessage('Project restored! Continue building your game.');
      } else {
        addSystemMessage('Ready! Describe the game you want to build.');
      }
    } catch (err) {
      setIsSettingUp(false);
      await updateProjectStatus(project.id, 'draft');
      addSystemMessage(
        `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`
      );
    }
  }, [
    isSettingUp,
    projectReady,
    status,
    boot,
    mountProject,
    install,
    startDev,
    project.id,
    project.files,
    addSystemMessage,
  ]);

  // Auto-start project if it has saved files (restore on page load)
  useEffect(() => {
    // Wait for project to finish loading
    if (isLoadingProject) return;

    const hasSavedFiles = Object.keys(project.files || {}).length > 0;
    if (hasSavedFiles && !isSettingUp && !projectReady && !initialPrompt) {
      console.log('[Builder] Auto-starting project with', Object.keys(project.files).length, 'saved files');
      startProject();
    }
  }, [isLoadingProject, project.files, isSettingUp, projectReady, initialPrompt, startProject]);

  // Handle initial prompt from home page - auto-start project
  useEffect(() => {
    if (initialPrompt && !initialPromptProcessed && !isSettingUp && !projectReady) {
      setInitialPromptProcessed(true);
      startProject();
    }
  }, [initialPrompt, initialPromptProcessed, isSettingUp, projectReady, startProject]);

  // Send initial prompt to AI once project is ready
  useEffect(() => {
    if (initialPrompt && initialPromptProcessed && projectReady && messages.length <= 1) {
      sendAiMessage(initialPrompt, undefined);
    }
  }, [initialPrompt, initialPromptProcessed, projectReady, messages.length, sendAiMessage]);

  // Load file content when selected
  useEffect(() => {
    if (!selectedFile) {
      setFileContent('');
      return;
    }

    const loadFile = async () => {
      setIsFileLoading(true);
      try {
        const content = await readProjectFile(selectedFile);
        setFileContent(content);
      } catch (err) {
        console.error('Failed to load file:', err);
        setFileContent('// Failed to load file');
      } finally {
        setIsFileLoading(false);
      }
    };

    loadFile();
  }, [selectedFile, readProjectFile]);

  // Handle file content changes
  const handleFileChange = useCallback(
    async (newContent: string) => {
      setFileContent(newContent);
      if (selectedFile) {
        try {
          // Save to WebContainer
          await writeProjectFile(selectedFile, newContent);

          // Update in-memory state and save to database
          const normalizedPath = selectedFile.startsWith('/') ? selectedFile : `/${selectedFile}`;
          setProjectFiles((prev) => {
            const updated = { ...prev, [normalizedPath]: newContent };
            debouncedSaveFiles(updated);
            return updated;
          });
        } catch (err) {
          console.error('Failed to save file:', err);
        }
      }
    },
    [selectedFile, writeProjectFile, debouncedSaveFiles]
  );

  // Handle send message from input
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isGenerating || isSettingUp) return;

    const prompt = inputValue.trim();
    setInputValue('');

    if (!projectReady) {
      await startProject();
      // Wait for project to be ready, then send message
      setTimeout(() => {
        sendAiMessage(prompt, selectedFile || undefined);
      }, 100);
    } else {
      await sendAiMessage(prompt, selectedFile || undefined);
    }
  }, [
    inputValue,
    isGenerating,
    isSettingUp,
    projectReady,
    startProject,
    sendAiMessage,
    selectedFile,
  ]);

  // Handle suggestion click - send the prompt directly
  const handleSuggestionClick = useCallback(async (prompt: string) => {
    if (isGenerating || isSettingUp) return;

    if (!projectReady) {
      await startProject();
      setTimeout(() => {
        sendAiMessage(prompt, selectedFile || undefined);
      }, 100);
    } else {
      await sendAiMessage(prompt, selectedFile || undefined);
    }
  }, [isGenerating, isSettingUp, projectReady, startProject, sendAiMessage, selectedFile]);

  // Show file in editor when selected from file tree
  const handleSelectFile = useCallback((file: string | null) => {
    setSelectedFile(file);
  }, []);

  // Handle refresh from header
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Handle add credits (placeholder)
  const handleAddCredits = useCallback(() => {
    console.log('Add credits clicked - TODO: Implement credits flow');
  }, []);

  // Handle dismiss credits
  const handleDismissCredits = useCallback(() => {
    setCreditsDismissed(true);
  }, []);

  // Handle selecting a chat session from history
  const handleSelectChatSession = useCallback(async (session: ChatSession) => {
    console.log('[Builder] Switching to chat session:', session.id, session.title);
    setActiveChatSessionId(session.id);

    // Update project's active session
    await updateProject(project.id, { active_chat_session_id: session.id });

    // TODO: Load session messages into chat (would need to extend useJoyixirChat hook)
    // For now, this just sets the active session for saving
  }, [project.id]);

  // Handle creating a new chat session
  const handleNewChat = useCallback(async () => {
    console.log('[Builder] Creating new chat session');
    // Clear the active session - a new one will be created when the first message is sent
    setActiveChatSessionId(null);

    // Update project to clear active session
    await updateProject(project.id, { active_chat_session_id: null });

    // TODO: Clear chat messages (would need to extend useJoyixirChat hook)
    // For now, this just prepares for a new session
  }, [project.id]);

  // Project dropdown handlers
  const handleRenameProject = useCallback(() => {
    const newName = prompt('Enter new project name:', project.name);
    if (newName && newName !== project.name) {
      updateProject(project.id, { name: newName })
        .then(() => {
          setProject(prev => ({ ...prev, name: newName }));
        })
        .catch(err => {
          console.error('[Builder] Failed to rename project:', err);
        });
    }
  }, [project.id, project.name]);

  const handleStarProject = useCallback(() => {
    const newStarred = !project.is_starred;
    updateProject(project.id, { is_starred: newStarred })
      .then(() => {
        setProject(prev => ({ ...prev, is_starred: newStarred }));
      })
      .catch(err => {
        console.error('[Builder] Failed to star/unstar project:', err);
      });
  }, [project.id, project.is_starred]);

  const handleRemixProject = useCallback(() => {
    // TODO: Implement remix (duplicate) project functionality
    console.log('[Builder] Remix project clicked');
  }, []);

  // Copy chat to clipboard - must be before early return
  const handleCopyChat = useCallback(() => {
    const chatText = messages
      .map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(chatText);
  }, [messages]);

  // Handle selecting a chat session and switching to chat tab
  const handleSelectSessionAndSwitchTab = useCallback((session: ChatSession) => {
    handleSelectChatSession(session);
    setChatPanelTab('chat');
  }, [handleSelectChatSession]);

  // Handle new chat and switching to chat tab
  const handleNewChatAndSwitchTab = useCallback(() => {
    handleNewChat();
    setChatPanelTab('chat');
  }, [handleNewChat]);

  // Handle suggestion click in chat
  const handleChatSuggestionClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  // Show loading while fetching fresh project data
  if (isLoadingProject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="mt-4 text-gray-400">Loading project...</p>
      </div>
    );
  }

  // Left Panel Content - Chat section with its own header
  const leftPanelContent = (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Chat Header */}
      <ChatHeader
        projectName={project.name}
        studioName={studioName}
        creditsRemaining={50}
        totalCredits={50}
        showProjectDropdown={showProjectDropdown}
        onToggleProjectDropdown={() => setShowProjectDropdown(!showProjectDropdown)}
        onGoToDashboard={onBackToHome}
        onOpenSettings={() => console.log('Open settings')}
        onAddCredits={() => console.log('Add credits')}
        onRenameProject={handleRenameProject}
        onStarProject={handleStarProject}
        onRemixProject={handleRemixProject}
        isProjectStarred={project.is_starred}
        onShowHistory={() => setChatPanelTab(chatPanelTab === 'history' ? 'chat' : 'history')}
        onCopyChat={handleCopyChat}
      />

      {/* Tab Content */}
      {chatPanelTab === 'chat' ? (
        <>
          {/* Chat messages */}
          <ChatMessages
            messages={messages}
            isGenerating={isGenerating}
            projectReady={projectReady}
            isSettingUp={isSettingUp}
            onSuggestionClick={handleChatSuggestionClick}
          />

          {/* Credits panel */}
          <CreditsPanel
            creditsRemaining={50}
            onAddCredits={handleAddCredits}
            onDismiss={handleDismissCredits}
            isDismissed={creditsDismissed}
          />

          {/* Chat input */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
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
            onSelectSession={handleSelectSessionAndSwitchTab}
            onNewChat={handleNewChatAndSwitchTab}
            isLoading={isLoadingChatSessions}
          />
        </div>
      )}
    </div>
  );

  // Right Panel Content - Preview/Code section with its own header
  const rightPanelContent = (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Preview Header */}
      <PreviewHeader
        user={user}
        status={status}
        onShare={() => console.log('Share clicked')}
        onPublish={() => console.log('Publish clicked')}
        onUpgrade={() => console.log('Upgrade clicked')}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        onRefresh={handleRefresh}
        isRefreshing={status === 'installing' || status === 'booting'}
      />

      {/* Main Content */}
      {viewMode === 'code' ? (
        /* Code mode: File Browser + Editor */
        <div className="flex flex-1 overflow-hidden">
          <FileBrowserPanel
            files={fileTree}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
          />
          <EditorPanel
            selectedFile={selectedFile}
            fileContent={fileContent}
            isLoading={isFileLoading}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        /* Preview mode */
        <div className="flex-1 overflow-hidden">
          <Preview
            url={previewUrl}
            isLoading={status === 'installing' || status === 'booting'}
            deviceMode={deviceMode}
            refreshKey={refreshKey}
          />
        </div>
      )}

      {/* Bottom Bar - Terminal toggle */}
      <div className="flex h-10 shrink-0 items-center justify-between border-t border-gray-800 bg-gray-900 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
              showTerminal
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <TerminalIcon className="h-3.5 w-3.5" />
            Terminal
          </button>
        </div>
        <div className="text-xs text-gray-600">
          {status === 'running' ? 'Server running' : status}
        </div>
      </div>

      {/* Terminal Panel - Collapsible */}
      {showTerminal && (
        <TerminalPanel
          output={terminalOutput}
          isOpen={true}
          onToggle={() => setShowTerminal(false)}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Resizable split layout - Chat on left, Preview on right */}
      <ResizablePanels
        leftPanel={leftPanelContent}
        rightPanel={rightPanelContent}
        defaultLeftWidth={420}
        minLeftWidth={320}
        maxLeftWidth={600}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
