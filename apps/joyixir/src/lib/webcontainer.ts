import { WebContainer, FileSystemTree } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

// Track if node_modules exists to avoid redundant installs
let nodeModulesInstalled = false;

/**
 * Boot the WebContainer instance (singleton).
 * Can only be called once - subsequent calls return the same instance.
 */
export async function bootWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (bootPromise) {
    return bootPromise;
  }

  bootPromise = WebContainer.boot();
  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
}

/**
 * Get the current WebContainer instance.
 * Returns null if not booted yet.
 */
export function getWebContainer(): WebContainer | null {
  return webcontainerInstance;
}

/**
 * Mount files to the WebContainer filesystem.
 */
export async function mountFiles(files: FileSystemTree): Promise<void> {
  const instance = await bootWebContainer();
  await instance.mount(files);
}

/**
 * Write a single file to the WebContainer filesystem.
 */
export async function writeFile(path: string, contents: string): Promise<void> {
  const instance = await bootWebContainer();
  await instance.fs.writeFile(path, contents);
}

/**
 * Read a file from the WebContainer filesystem.
 */
export async function readFile(path: string): Promise<string> {
  const instance = await bootWebContainer();
  const contents = await instance.fs.readFile(path, 'utf-8');
  return contents;
}

/**
 * Read a directory from the WebContainer filesystem.
 */
export async function readDir(path: string): Promise<string[]> {
  const instance = await bootWebContainer();
  const entries = await instance.fs.readdir(path);
  return entries;
}

/**
 * Create a directory in the WebContainer filesystem.
 */
export async function mkdir(path: string): Promise<void> {
  const instance = await bootWebContainer();
  await instance.fs.mkdir(path, { recursive: true });
}

/**
 * Remove a file or directory from the WebContainer filesystem.
 */
export async function rm(path: string): Promise<void> {
  const instance = await bootWebContainer();
  await instance.fs.rm(path, { recursive: true });
}

/**
 * Spawn a process in the WebContainer.
 */
export async function spawn(
  command: string,
  args: string[] = [],
  options?: { cwd?: string }
) {
  const instance = await bootWebContainer();
  return instance.spawn(command, args, options);
}

/**
 * Check if node_modules already exists and has content.
 * Used to skip npm install when dependencies are already installed.
 */
export async function hasNodeModules(): Promise<boolean> {
  if (nodeModulesInstalled) {
    return true;
  }

  try {
    const instance = await bootWebContainer();
    const entries = await instance.fs.readdir('/node_modules');
    // Check if there are actual packages (not just .bin or .cache)
    const hasPackages = entries.some(
      (entry) => !entry.startsWith('.') && entry !== 'node_modules'
    );
    if (hasPackages) {
      nodeModulesInstalled = true;
      return true;
    }
  } catch {
    // node_modules doesn't exist
  }
  return false;
}

/**
 * Install npm dependencies.
 * Skips if node_modules already exists.
 */
export async function installDependencies(
  onOutput?: (data: string) => void,
  forceInstall = false
): Promise<number> {
  // Check if already installed
  if (!forceInstall && await hasNodeModules()) {
    onOutput?.('Dependencies already installed, skipping npm install...\n');
    return 0;
  }

  const process = await spawn('npm', ['install']);

  if (onOutput) {
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }

  const exitCode = await process.exit;

  if (exitCode === 0) {
    nodeModulesInstalled = true;
  }

  return exitCode;
}

/**
 * Reset the installed state (useful when switching projects).
 */
export function resetNodeModulesState(): void {
  nodeModulesInstalled = false;
}

/**
 * Start the dev server.
 */
export async function startDevServer(
  onOutput?: (data: string) => void,
  onServerReady?: (port: number, url: string) => void
): Promise<void> {
  const instance = await bootWebContainer();

  // Listen for server ready event
  if (onServerReady) {
    instance.on('server-ready', (port, url) => {
      onServerReady(port, url);
    });
  }

  const process = await spawn('npm', ['run', 'dev']);

  if (onOutput) {
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }
}

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileTreeNode[];
}

/**
 * Get the filesystem tree for export.
 */
export async function getFileTree(
  path: string = '/'
): Promise<FileTreeNode[]> {
  const instance = await bootWebContainer();
  const entries = await instance.fs.readdir(path, { withFileTypes: true });

  const result = [];
  for (const entry of entries) {
    // Skip node_modules and hidden files
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;

    if (entry.isDirectory()) {
      const children = await getFileTree(fullPath);
      result.push({
        name: entry.name,
        type: 'directory' as const,
        path: fullPath,
        children,
      });
    } else {
      result.push({
        name: entry.name,
        type: 'file' as const,
        path: fullPath,
      });
    }
  }

  return result;
}
