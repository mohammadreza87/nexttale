/**
 * Builder Page
 * Main game development IDE with chat, file explorer, editor, preview, and terminal
 */

import { useState, useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Preview, ExportModal } from '../components';
import {
  BuilderHeader,
  LeftPanel,
  EditorPanel,
  TerminalPanel,
} from '../components/builder';
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

  // UI state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'chat' | 'files'>('chat');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [projectReady, setProjectReady] = useState(false);
  const [hasThreeJs, setHasThreeJs] = useState(project.has_three_js);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);

  // Track files in memory for saving to database
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});

  // Sync projectFiles when project data loads
  useEffect(() => {
    if (!isLoadingProject && project.files) {
      console.log('[Builder] Syncing projectFiles from loaded project:', Object.keys(project.files).length, 'files');
      setProjectFiles(project.files);
    }
  }, [isLoadingProject, project.files]);

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

  // Save conversation when messages change
  useEffect(() => {
    if (messages.length > 1) {
      const conversation = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      updateProject(project.id, { conversation }).catch(console.error);
    }
  }, [messages, project.id]);

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
      setActiveLeftTab('files');
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

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isGenerating || isSettingUp) return;

    const prompt = inputValue.trim();
    setInputValue('');

    if (!projectReady) {
      await startProject();
      if (projectReady) {
        await sendAiMessage(prompt, selectedFile || undefined);
      }
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

  // Show loading while fetching fresh project data
  if (isLoadingProject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="mt-4 text-gray-400">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <BuilderHeader
        projectName={project.name}
        user={user}
        status={status}
        onBackToHome={onBackToHome}
        onExport={() => setShowExportModal(true)}
        onSignOut={onSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel
          isOpen={leftPanelOpen}
          onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
          activeTab={activeLeftTab}
          onTabChange={setActiveLeftTab}
          messages={messages}
          isGenerating={isGenerating}
          projectReady={projectReady}
          isSettingUp={isSettingUp}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          fileTree={fileTree}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <EditorPanel
              selectedFile={selectedFile}
              fileContent={fileContent}
              isLoading={isFileLoading}
              onChange={handleFileChange}
            />

            <div className="flex w-1/2 flex-col overflow-hidden">
              <Preview
                url={previewUrl}
                isLoading={status === 'installing' || status === 'booting'}
              />
            </div>
          </div>

          <TerminalPanel
            output={terminalOutput}
            isOpen={bottomPanelOpen}
            onToggle={() => setBottomPanelOpen(!bottomPanelOpen)}
          />
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
