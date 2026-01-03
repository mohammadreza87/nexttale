import { useState, useEffect } from 'react';
import { getSupabase } from '@nexttale/shared';
import type { User } from '@supabase/supabase-js';
import { BuilderPage } from './pages/Builder';
import { LandingPage } from './pages/Landing';
import { HomePage } from './pages/Home';
import { ErrorBoundary } from './components';
import { createProject, type JoyixirProject } from './lib/projectService';

type View = 'landing' | 'home' | 'builder';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [currentProject, setCurrentProject] = useState<JoyixirProject | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setCurrentProject(null);
    setInitialPrompt(null);
    setCurrentView('landing');
  };

  const handleSelectProject = (project: JoyixirProject) => {
    setCurrentProject(project);
    setInitialPrompt(null); // Existing project, no initial prompt
    setCurrentView('builder');
  };

  const handleStartNewProject = async (prompt: string) => {
    // Generate a project name from the prompt (first few words)
    const words = prompt.split(' ').slice(0, 4);
    const projectName = words.length > 0
      ? words.join(' ').substring(0, 50) + (prompt.length > 50 ? '...' : '')
      : 'New Game';

    try {
      // Auto-create project
      const project = await createProject({ name: projectName });
      setCurrentProject(project);
      setInitialPrompt(prompt); // Pass the initial prompt to builder
      setCurrentView('builder');
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleBackToHome = () => {
    setCurrentProject(null);
    setInitialPrompt(null);
    setCurrentView('home');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage onSignIn={handleSignIn} />;
  }

  // Show builder for selected project
  if (currentView === 'builder' && currentProject) {
    return (
      <BuilderPage
        user={user}
        project={currentProject}
        initialPrompt={initialPrompt}
        onSignOut={handleSignOut}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // Show home page (default for authenticated users)
  return (
    <HomePage
      user={user}
      onSignOut={handleSignOut}
      onSelectProject={handleSelectProject}
      onStartNewProject={handleStartNewProject}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
