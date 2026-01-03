import { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Sparkles,
  Home as HomeIcon,
  Search,
  LayoutGrid,
  Star,
  Compass,
  BookOpen,
  Zap,
  Send,
  LogOut,
  ChevronDown,
  Gamepad2,
  Settings,
  Plus,
  MoreHorizontal,
  Grid3X3,
  List,
  Users,
} from 'lucide-react';
import {
  getProjects,
  createProject,
  type JoyixirProject,
} from '../lib/projectService';
import { SettingsModal, SearchModal, Avatar } from '../components';

interface HomePageProps {
  user: User;
  onSignOut: () => void;
  onSelectProject: (project: JoyixirProject) => void;
  onStartNewProject: (prompt: string) => void;
}

// Game template suggestions
const TEMPLATES = [
  { id: 'snake', name: 'Snake Game', icon: '🐍', prompt: 'Create a classic snake game' },
  { id: 'platformer', name: '2D Platformer', icon: '🏃', prompt: 'Create a 2D platformer game' },
  { id: 'puzzle', name: 'Puzzle Game', icon: '🧩', prompt: 'Create a puzzle matching game' },
  { id: '3d-scene', name: '3D Experience', icon: '🎮', prompt: 'Create an interactive 3D scene' },
];

export function HomePage({ user, onSignOut, onSelectProject, onStartNewProject }: HomePageProps) {
  const [projects, setProjects] = useState<JoyixirProject[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeNav, setActiveNav] = useState('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    onStartNewProject(inputValue.trim());
  };

  const handleTemplateClick = (prompt: string) => {
    onStartNewProject(prompt);
  };

  const handleCreateNewProject = async () => {
    if (isCreatingProject) return;
    setIsCreatingProject(true);
    try {
      const project = await createProject({ name: 'Untitled Game' });
      onSelectProject(project);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentProjects = projects.slice(0, 5);
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-gray-800 bg-gray-900">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-lg font-bold text-transparent">
            Joyixir
          </span>
        </div>

        {/* User dropdown */}
        <div className="relative border-b border-gray-800 p-3" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex w-full items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-left hover:bg-gray-700"
          >
            <Avatar
              src={user.user_metadata?.avatar_url}
              name={user.user_metadata?.full_name || user.email}
              size="sm"
              className="h-6 w-6"
            />
            <span className="flex-1 truncate text-sm text-white">
              {user.user_metadata?.full_name || 'User'}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User menu dropdown */}
          {showUserMenu && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setShowSettings(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <div className="border-t border-gray-700" />
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <NavItem
              icon={HomeIcon}
              label="Home"
              active={activeNav === 'home'}
              onClick={() => setActiveNav('home')}
            />
            <NavItem
              icon={Search}
              label="Search"
              active={showSearch}
              onClick={() => setShowSearch(true)}
            />
          </div>

          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Projects
            </p>
            <div className="space-y-1">
              <NavItem
                icon={LayoutGrid}
                label="All projects"
                active={activeNav === 'projects'}
                onClick={() => setActiveNav('projects')}
              />
              <NavItem
                icon={Star}
                label="Starred"
                active={activeNav === 'starred'}
                onClick={() => setActiveNav('starred')}
              />
              <NavItem
                icon={Users}
                label="Shared with me"
                active={activeNav === 'shared'}
                onClick={() => setActiveNav('shared')}
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Resources
            </p>
            <div className="space-y-1">
              <NavItem
                icon={Compass}
                label="Discover"
                active={activeNav === 'discover'}
                onClick={() => setActiveNav('discover')}
              />
              <NavItem
                icon={Gamepad2}
                label="Templates"
                active={activeNav === 'templates'}
                onClick={() => setActiveNav('templates')}
              />
              <NavItem
                icon={BookOpen}
                label="Learn"
                active={activeNav === 'learn'}
                onClick={() => setActiveNav('learn')}
              />
            </div>
          </div>

          {/* Recent projects */}
          {recentProjects.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Recent
              </p>
              <div className="space-y-1">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
                  >
                    <Gamepad2 className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-800 p-3 space-y-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 px-3 py-2.5 text-left hover:from-violet-600/30 hover:to-fuchsia-600/30"
          >
            <Zap className="h-4 w-4 text-violet-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Upgrade to Pro</p>
              <p className="text-xs text-gray-500">Unlock more features</p>
            </div>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {activeNav === 'projects' || activeNav === 'starred' || activeNav === 'shared' ? (
          /* Projects View */
          <div className="flex-1 overflow-y-auto bg-gray-950 p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {activeNav === 'projects' ? 'Projects' : activeNav === 'starred' ? 'Starred' : 'Shared with me'}
                </h1>
                <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="mb-6 flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-72 rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Filters */}
                <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 outline-none">
                  <option>Last edited</option>
                  <option>Name</option>
                  <option>Created</option>
                </select>
                <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 outline-none">
                  <option>Any visibility</option>
                  <option>Public</option>
                  <option>Private</option>
                </select>
                <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 outline-none">
                  <option>Any status</option>
                  <option>Draft</option>
                  <option>Building</option>
                  <option>Ready</option>
                  <option>Published</option>
                </select>

                {/* View toggle */}
                <div className="ml-2 flex rounded-lg border border-gray-700 bg-gray-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-l-lg p-2 ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-r-lg p-2 ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {/* Create New Project Card */}
              <button
                onClick={handleCreateNewProject}
                disabled={isCreatingProject}
                className="group flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-transparent transition-all hover:border-gray-500 hover:bg-gray-900/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-600 text-gray-500 transition-colors group-hover:border-gray-400 group-hover:text-gray-300">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="mt-4 text-sm font-medium text-gray-400 group-hover:text-gray-300">
                  {isCreatingProject ? 'Creating...' : 'Create new project'}
                </span>
              </button>

              {/* Project Cards */}
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="group text-left"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/20 to-gray-900 transition-all group-hover:border-violet-500/50">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gamepad2 className="h-16 w-16 text-gray-700" />
                      </div>
                    )}
                  </div>

                  {/* Project info */}
                  <div className="mt-3 flex items-start gap-3">
                    <Avatar
                      src={user.user_metadata?.avatar_url}
                      name={user.user_metadata?.full_name || user.email}
                      size="sm"
                      className="h-8 w-8"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate font-medium text-white group-hover:text-violet-400">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Edited {formatTimeAgo(project.updated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Empty state */}
            {filteredProjects.length === 0 && searchQuery && (
              <div className="mt-12 text-center">
                <p className="text-gray-400">No projects found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Home View */
          <>
            {/* Gradient background area */}
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/20 to-gray-950" />
              <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
              <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-600/20 blur-[100px]" />

              {/* Content */}
              <div className="relative z-10 w-full max-w-2xl px-6">
                <h1 className="mb-8 text-center text-4xl font-bold text-white">
                  Got an idea, {firstName}?
                </h1>

                {/* Input box */}
                <div className="rounded-2xl border border-gray-700 bg-gray-900/80 p-4 backdrop-blur-sm">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Describe the game you want to create..."
                    className="w-full bg-transparent text-lg text-white placeholder-gray-500 outline-none"
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Could add attach/theme buttons here */}
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!inputValue.trim()}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates section */}
            <div className="border-t border-gray-800 bg-gray-900/50 px-6 py-6">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-white">Templates</h2>
                  <button
                    onClick={() => setActiveNav('templates')}
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    Browse all →
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateClick(template.prompt)}
                      className="group rounded-xl border border-gray-800 bg-gray-900 p-4 text-left transition-all hover:border-violet-500/50 hover:bg-gray-800"
                    >
                      <span className="mb-2 block text-2xl">{template.icon}</span>
                      <span className="text-sm font-medium text-white group-hover:text-violet-400">
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        projects={projects}
        onSelectProject={onSelectProject}
        userAvatar={user.user_metadata?.avatar_url}
        userName={user.user_metadata?.full_name}
      />
    </div>
  );
}

// Navigation item component
function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
