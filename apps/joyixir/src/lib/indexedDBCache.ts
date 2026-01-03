/**
 * IndexedDB Cache Service
 * Caches node_modules and project files for instant project loading
 *
 * This solves the slow startup problem by persisting:
 * 1. node_modules - Skip npm install on subsequent loads
 * 2. Vite cache - Skip dependency pre-bundling
 */

const DB_NAME = 'joyixir-cache';
const DB_VERSION = 1;

// Store names
const STORES = {
  NODE_MODULES: 'node_modules',
  VITE_CACHE: 'vite_cache',
  PROJECT_META: 'project_meta',
} as const;

interface ProjectMeta {
  projectId: string;
  packageJsonHash: string;
  cachedAt: number;
  nodeModulesSize: number;
}

interface CachedFile {
  path: string;
  content: Uint8Array | string;
  isDirectory: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('[IndexedDB] Upgrading database schema...');

      // Store for node_modules files (keyed by projectId + path)
      if (!db.objectStoreNames.contains(STORES.NODE_MODULES)) {
        const nodeModulesStore = db.createObjectStore(STORES.NODE_MODULES, {
          keyPath: ['projectId', 'path'],
        });
        nodeModulesStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // Store for Vite cache
      if (!db.objectStoreNames.contains(STORES.VITE_CACHE)) {
        const viteCacheStore = db.createObjectStore(STORES.VITE_CACHE, {
          keyPath: ['projectId', 'path'],
        });
        viteCacheStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // Store for project metadata (package.json hash, etc.)
      if (!db.objectStoreNames.contains(STORES.PROJECT_META)) {
        db.createObjectStore(STORES.PROJECT_META, { keyPath: 'projectId' });
      }
    };
  });

  return dbPromise;
}

/**
 * Generate a hash of package.json for cache invalidation
 */
export function hashPackageJson(packageJson: string): string {
  let hash = 0;
  for (let i = 0; i < packageJson.length; i++) {
    const char = packageJson.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Check if we have valid cached node_modules for a project
 */
export async function hasCachedNodeModules(
  projectId: string,
  packageJsonContent: string
): Promise<boolean> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.PROJECT_META, 'readonly');
    const store = tx.objectStore(STORES.PROJECT_META);

    return new Promise((resolve) => {
      const request = store.get(projectId);
      request.onsuccess = () => {
        const meta = request.result as ProjectMeta | undefined;
        if (!meta) {
          console.log('[IndexedDB] No cache metadata found for project');
          resolve(false);
          return;
        }

        const currentHash = hashPackageJson(packageJsonContent);
        const isValid = meta.packageJsonHash === currentHash;

        if (isValid) {
          console.log('[IndexedDB] Cache is valid! Cached at:', new Date(meta.cachedAt).toLocaleString());
        } else {
          console.log('[IndexedDB] Cache invalidated - package.json changed');
        }

        resolve(isValid);
      };
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('[IndexedDB] Error checking cache:', err);
    return false;
  }
}

/**
 * Save node_modules to IndexedDB cache
 */
export async function cacheNodeModules(
  projectId: string,
  packageJsonContent: string,
  files: Map<string, Uint8Array | string>
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.NODE_MODULES, STORES.PROJECT_META], 'readwrite');
    const nodeModulesStore = tx.objectStore(STORES.NODE_MODULES);
    const metaStore = tx.objectStore(STORES.PROJECT_META);

    console.log('[IndexedDB] Caching', files.size, 'node_modules files...');

    // First, clear existing cache for this project
    const index = nodeModulesStore.index('projectId');
    const cursorRequest = index.openCursor(IDBKeyRange.only(projectId));

    await new Promise<void>((resolve, reject) => {
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });

    // Save all files
    let totalSize = 0;
    for (const [path, content] of files) {
      const size = typeof content === 'string' ? content.length : content.byteLength;
      totalSize += size;

      nodeModulesStore.put({
        projectId,
        path,
        content,
        isDirectory: false,
      });
    }

    // Save metadata
    const meta: ProjectMeta = {
      projectId,
      packageJsonHash: hashPackageJson(packageJsonContent),
      cachedAt: Date.now(),
      nodeModulesSize: totalSize,
    };
    metaStore.put(meta);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('[IndexedDB] Cached', files.size, 'files (', (totalSize / 1024 / 1024).toFixed(2), 'MB)');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[IndexedDB] Error caching node_modules:', err);
  }
}

/**
 * Restore node_modules from IndexedDB cache
 */
export async function restoreNodeModules(
  projectId: string
): Promise<Map<string, Uint8Array | string> | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.NODE_MODULES, 'readonly');
    const store = tx.objectStore(STORES.NODE_MODULES);
    const index = store.index('projectId');

    console.log('[IndexedDB] Restoring node_modules from cache...');

    const files = new Map<string, Uint8Array | string>();

    return new Promise((resolve, reject) => {
      const cursorRequest = index.openCursor(IDBKeyRange.only(projectId));

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as CachedFile & { projectId: string };
          files.set(record.path, record.content);
          cursor.continue();
        } else {
          if (files.size === 0) {
            console.log('[IndexedDB] No cached files found');
            resolve(null);
          } else {
            console.log('[IndexedDB] Restored', files.size, 'files from cache');
            resolve(files);
          }
        }
      };

      cursorRequest.onerror = () => {
        console.error('[IndexedDB] Error restoring cache:', cursorRequest.error);
        reject(cursorRequest.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Error restoring node_modules:', err);
    return null;
  }
}

/**
 * Clear all cached data for a project
 */
export async function clearProjectCache(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(
      [STORES.NODE_MODULES, STORES.VITE_CACHE, STORES.PROJECT_META],
      'readwrite'
    );

    // Clear node_modules
    const nodeModulesStore = tx.objectStore(STORES.NODE_MODULES);
    const nmIndex = nodeModulesStore.index('projectId');
    const nmCursor = nmIndex.openCursor(IDBKeyRange.only(projectId));

    nmCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clear vite cache
    const viteCacheStore = tx.objectStore(STORES.VITE_CACHE);
    const vcIndex = viteCacheStore.index('projectId');
    const vcCursor = vcIndex.openCursor(IDBKeyRange.only(projectId));

    vcCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clear metadata
    const metaStore = tx.objectStore(STORES.PROJECT_META);
    metaStore.delete(projectId);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('[IndexedDB] Cleared cache for project:', projectId);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[IndexedDB] Error clearing cache:', err);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalProjects: number;
  totalSize: number;
  projects: Array<{ projectId: string; size: number; cachedAt: number }>;
}> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.PROJECT_META, 'readonly');
    const store = tx.objectStore(STORES.PROJECT_META);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const metas = request.result as ProjectMeta[];
        const totalSize = metas.reduce((sum, m) => sum + m.nodeModulesSize, 0);

        resolve({
          totalProjects: metas.length,
          totalSize,
          projects: metas.map((m) => ({
            projectId: m.projectId,
            size: m.nodeModulesSize,
            cachedAt: m.cachedAt,
          })),
        });
      };
      request.onerror = () => {
        resolve({ totalProjects: 0, totalSize: 0, projects: [] });
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Error getting cache stats:', err);
    return { totalProjects: 0, totalSize: 0, projects: [] };
  }
}

/**
 * Clear all caches (useful for debugging)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(
      [STORES.NODE_MODULES, STORES.VITE_CACHE, STORES.PROJECT_META],
      'readwrite'
    );

    tx.objectStore(STORES.NODE_MODULES).clear();
    tx.objectStore(STORES.VITE_CACHE).clear();
    tx.objectStore(STORES.PROJECT_META).clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('[IndexedDB] All caches cleared');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[IndexedDB] Error clearing all caches:', err);
  }
}
