import { useState, useCallback, useRef, useEffect } from 'react';
import { WebContainer, FileSystemTree } from '@webcontainer/api';
import {
  bootWebContainer,
  getWebContainer,
  mountFiles,
  writeFile,
  readFile,
  mkdir,
  rm,
  spawn,
  installDependencies,
  startDevServer,
  getFileTree,
  hasNodeModules,
  resetNodeModulesState,
  checkDependencies,
  updateDependencies,
  type OutdatedDependency,
} from '../lib/webcontainer';

export type WebContainerStatus =
  | 'idle'
  | 'booting'
  | 'ready'
  | 'installing'
  | 'running'
  | 'error';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface UseWebContainerReturn {
  status: WebContainerStatus;
  error: string | null;
  previewUrl: string | null;
  terminalOutput: string[];
  fileTree: FileNode[];
  outdatedDeps: OutdatedDependency[];
  isCheckingDeps: boolean;
  isUpdatingDeps: boolean;

  // Actions
  boot: () => Promise<void>;
  mountProject: (files: FileSystemTree) => Promise<void>;
  writeProjectFile: (path: string, contents: string) => Promise<void>;
  readProjectFile: (path: string) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  install: () => Promise<void>;
  startDev: () => Promise<void>;
  refreshFileTree: () => Promise<void>;
  runCommand: (command: string, args?: string[]) => Promise<number>;
  clearTerminal: () => void;
  checkNodeModules: () => Promise<boolean>;
  resetForNewProject: () => void;
  checkOutdated: () => Promise<void>;
  updateOutdated: () => Promise<void>;
  dismissOutdated: () => void;
}

export function useWebContainer(): UseWebContainerReturn {
  const [status, setStatus] = useState<WebContainerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [outdatedDeps, setOutdatedDeps] = useState<OutdatedDependency[]>([]);
  const [isCheckingDeps, setIsCheckingDeps] = useState(false);
  const [isUpdatingDeps, setIsUpdatingDeps] = useState(false);

  const containerRef = useRef<WebContainer | null>(null);

  // Append to terminal output
  const appendOutput = useCallback((data: string) => {
    setTerminalOutput(prev => [...prev, data]);
  }, []);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setTerminalOutput([]);
  }, []);

  // Check if node_modules exists
  const checkNodeModules = useCallback(async (): Promise<boolean> => {
    return hasNodeModules();
  }, []);

  // Reset state for a new project (but keep WebContainer)
  const resetForNewProject = useCallback(() => {
    resetNodeModulesState();
    setPreviewUrl(null);
    setFileTree([]);
    setTerminalOutput([]);
    setError(null);
    // Keep status as is - we want to keep WebContainer running
  }, []);

  // Boot the WebContainer
  const boot = useCallback(async () => {
    if (status !== 'idle') return;

    setStatus('booting');
    setError(null);
    appendOutput('Booting WebContainer...\n');

    try {
      const container = await bootWebContainer();
      containerRef.current = container;
      setStatus('ready');
      appendOutput('WebContainer ready!\n');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to boot WebContainer';
      setError(message);
      setStatus('error');
      appendOutput(`Error: ${message}\n`);
    }
  }, [status, appendOutput]);

  // Mount project files
  const mountProject = useCallback(async (files: FileSystemTree) => {
    if (!containerRef.current && status !== 'ready') {
      await boot();
    }

    appendOutput('Mounting project files...\n');

    try {
      await mountFiles(files);
      appendOutput('Files mounted successfully!\n');
      await refreshFileTree();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mount files';
      setError(message);
      appendOutput(`Error: ${message}\n`);
      throw err;
    }
  }, [status, boot, appendOutput]);

  // Write a file
  const writeProjectFile = useCallback(async (path: string, contents: string) => {
    try {
      await writeFile(path, contents);
      await refreshFileTree();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to write file';
      setError(message);
      throw err;
    }
  }, []);

  // Read a file
  const readProjectFile = useCallback(async (path: string): Promise<string> => {
    try {
      return await readFile(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file';
      setError(message);
      throw err;
    }
  }, []);

  // Delete a file or directory
  const deleteFile = useCallback(async (path: string) => {
    try {
      await rm(path);
      await refreshFileTree();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      setError(message);
      throw err;
    }
  }, []);

  // Create a directory
  const createDirectory = useCallback(async (path: string) => {
    try {
      await mkdir(path);
      await refreshFileTree();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create directory';
      setError(message);
      throw err;
    }
  }, []);

  // Install dependencies (skips if already installed)
  const install = useCallback(async () => {
    // Check if we can skip install
    const alreadyInstalled = await hasNodeModules();

    if (alreadyInstalled) {
      appendOutput('\nDependencies already installed, skipping npm install...\n');
      setStatus('ready');
      return;
    }

    setStatus('installing');
    appendOutput('\n$ npm install\n');

    try {
      const exitCode = await installDependencies(appendOutput);

      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }

      setStatus('ready');
      appendOutput('\nDependencies installed!\n');
      await refreshFileTree();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to install dependencies';
      setError(message);
      setStatus('error');
      appendOutput(`\nError: ${message}\n`);
      throw err;
    }
  }, [appendOutput]);

  // Start dev server
  const startDev = useCallback(async () => {
    setStatus('running');
    appendOutput('\n$ npm run dev\n');

    try {
      await startDevServer(
        appendOutput,
        (port, url) => {
          setPreviewUrl(url);
          appendOutput(`\nServer running at ${url}\n`);
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start dev server';
      setError(message);
      setStatus('error');
      appendOutput(`\nError: ${message}\n`);
      throw err;
    }
  }, [appendOutput]);

  // Refresh file tree
  const refreshFileTree = useCallback(async () => {
    try {
      const tree = await getFileTree('/');
      setFileTree(tree as FileNode[]);
    } catch (err) {
      // Silently fail - file tree might not be ready yet
      console.warn('Failed to refresh file tree:', err);
    }
  }, []);

  // Run arbitrary command
  const runCommand = useCallback(async (command: string, args: string[] = []): Promise<number> => {
    appendOutput(`\n$ ${command} ${args.join(' ')}\n`);

    try {
      const process = await spawn(command, args);

      process.output.pipeTo(
        new WritableStream({
          write(data) {
            appendOutput(data);
          },
        })
      );

      return await process.exit;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command failed';
      appendOutput(`Error: ${message}\n`);
      throw err;
    }
  }, [appendOutput]);

  // Check if WebContainer is already booted on mount
  useEffect(() => {
    const existing = getWebContainer();
    if (existing) {
      containerRef.current = existing;
      setStatus('ready');
    }
  }, []);

  // Check for outdated dependencies
  const checkOutdated = useCallback(async () => {
    setIsCheckingDeps(true);
    try {
      const result = await checkDependencies();
      setOutdatedDeps(result.outdated);
    } catch (err) {
      console.error('Failed to check dependencies:', err);
    } finally {
      setIsCheckingDeps(false);
    }
  }, []);

  // Update all outdated dependencies
  const updateOutdated = useCallback(async () => {
    setIsUpdatingDeps(true);
    appendOutput('\n$ npm update\n');
    try {
      await updateDependencies(appendOutput);
      setOutdatedDeps([]);
      appendOutput('\nDependencies updated!\n');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update dependencies';
      appendOutput(`\nError: ${message}\n`);
    } finally {
      setIsUpdatingDeps(false);
    }
  }, [appendOutput]);

  // Dismiss outdated banner
  const dismissOutdated = useCallback(() => {
    setOutdatedDeps([]);
  }, []);

  return {
    status,
    error,
    previewUrl,
    terminalOutput,
    fileTree,
    outdatedDeps,
    isCheckingDeps,
    isUpdatingDeps,
    boot,
    mountProject,
    writeProjectFile,
    readProjectFile,
    deleteFile,
    createDirectory,
    install,
    startDev,
    refreshFileTree,
    runCommand,
    clearTerminal,
    checkNodeModules,
    resetForNewProject,
    checkOutdated,
    updateOutdated,
    dismissOutdated,
  };
}
