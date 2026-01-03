import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Plus,
  Sparkles,
  Folder,
  Trash2,
  Clock,
  Loader2,
  LogOut,
  Gamepad2,
} from 'lucide-react';
import {
  getProjects,
  createProject,
  deleteProject,
  type JoyixirProject,
} from '../lib/projectService';

interface ProjectsPageProps {
  user: User;
  onSignOut: () => void;
  onSelectProject: (project: JoyixirProject) => void;
}

export function ProjectsPage({ user, onSignOut, onSelectProject }: ProjectsPageProps) {
  const [projects, setProjects] = useState<JoyixirProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const project = await createProject({ name: newProjectName.trim() });
      setShowNewModal(false);
      setNewProjectName('');
      onSelectProject(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: JoyixirProject['status']) => {
    const styles = {
      draft: 'bg-gray-700 text-gray-300',
      building: 'bg-yellow-900 text-yellow-300',
      ready: 'bg-green-900 text-green-300',
      published: 'bg-violet-900 text-violet-300',
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-xl font-bold text-transparent">
                Joyixir
              </h1>
              <p className="text-xs text-gray-500">Game Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={user.user_metadata?.avatar_url || ''}
              alt=""
              className="h-8 w-8 rounded-full"
            />
            <button
              onClick={onSignOut}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Title and create button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Games</h2>
            <p className="mt-1 text-gray-400">
              Create and manage your game projects
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-5 w-5" />
            New Game
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800">
              <Gamepad2 className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              No games yet
            </h3>
            <p className="mb-6 text-gray-400">
              Create your first game project and start building with AI
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500"
            >
              <Plus className="h-5 w-5" />
              Create Your First Game
            </button>
          </div>
        ) : (
          /* Projects grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group relative rounded-xl border border-gray-800 bg-gray-900 p-5 text-left transition-all hover:border-violet-500/50 hover:bg-gray-800"
              >
                {/* Thumbnail or placeholder */}
                <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gray-800">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Folder className="h-12 w-12 text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-white group-hover:text-violet-400">
                    {project.name}
                  </h3>
                  {getStatusBadge(project.status)}
                </div>

                {project.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-gray-400">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Updated {formatDate(project.updated_at)}</span>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 opacity-0 transition-all hover:bg-gray-700 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* New project modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Create New Game
            </h3>

            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              placeholder="Game name..."
              className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setNewProjectName('');
                }}
                className="rounded-lg px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreating}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
