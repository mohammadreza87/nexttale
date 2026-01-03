import { WebContainer, FileSystemTree } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

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
 * Install npm dependencies.
 */
export async function installDependencies(
  onOutput?: (data: string) => void
): Promise<number> {
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

  return process.exit;
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
