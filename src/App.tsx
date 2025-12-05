import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  Outlet,
  useOutletContext,
} from 'react-router-dom';
import { StoryLibrary } from './components/StoryLibrary';
import { StoryReader } from './components/StoryReader';
import { StoryDetail } from './components/StoryDetail';
import { Profile } from './components/Profile';
import { PublicProfile } from './components/PublicProfile';
import { StoryCreator } from './components/StoryCreator';
import { Subscription } from './components/Subscription';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Auth } from './components/Auth';
import { Quests } from './components/Quests';
import { LandingPage } from './components/LandingPage';
import { TermsOfService, PrivacyPolicy } from './components/legal';
import { AuthProvider, useAuth } from './lib/authContext';
import { useAnalytics } from './hooks/useAnalytics';
import { getSubscriptionUsage } from './lib/subscriptionService';

type ViewKey = 'home' | 'profile' | 'create' | 'subscription' | 'quests';

type AppOutletContext = {
  userId: string;
  isPro: boolean;
  handleSelectStory: (storyId: string) => void;
  handleStartStory: (storyId: string) => void;
  handleBackToLibrary: () => void;
  handleViewProfile: (userId: string) => void;
};

const viewToPath = (view: ViewKey) => {
  switch (view) {
    case 'home':
      return '/';
    case 'create':
      return '/create';
    case 'profile':
      return '/profile';
    case 'subscription':
      return '/subscription';
    case 'quests':
      return '/quests';
    default:
      return '/';
  }
};

const pathToView = (pathname: string): ViewKey => {
  if (pathname.startsWith('/create')) return 'create';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/subscription')) return 'subscription';
  if (pathname.startsWith('/quests')) return 'quests';
  return 'home';
};

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/story/') && pathname.includes('/read')) return 'Reading Story';
  if (pathname.startsWith('/story/')) return 'Story Detail';
  if (pathname.startsWith('/create')) return 'Create Story';
  if (pathname.startsWith('/subscription')) return 'Subscription';
  if (pathname.startsWith('/quests')) return 'Quests';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/user/')) return 'User Profile';
  if (pathname.startsWith('/landing')) return 'Landing';
  if (pathname.startsWith('/auth')) return 'Auth';
  return 'Story Library';
};

function useQueryRedirects() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const storyParam = params.get('story');
    if (storyParam) {
      const uuidMatch = storyParam.match(/[0-9a-fA-F-]{36}/);
      const storyId = uuidMatch ? uuidMatch[0] : storyParam.trim().split(/\s+/)[0];
      navigate(`/story/${storyId}`, { replace: true });
      return;
    }

    if (params.get('landing') === 'true') {
      navigate('/landing', { replace: true });
    }
  }, [location.search, navigate]);
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

function MainLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const analytics = useAnalytics();
  const [isPro, setIsPro] = useState(false);

  const userId = user?.id || '';
  const currentView = pathToView(location.pathname);

  // Subscription status
  useEffect(() => {
    const checkProStatus = async () => {
      if (!user?.id) {
        setIsPro(false);
        return;
      }
      const usage = await getSubscriptionUsage(user.id);
      setIsPro(usage.isPro);
    };
    checkProStatus();
  }, [user?.id]);

  // Analytics
  useEffect(() => {
    analytics.pageView(location.pathname, `${getPageTitle(location.pathname)} - Next Tale`);
  }, [analytics, location.pathname]);

  const handleSelectStory = (storyId: string) => navigate(`/story/${storyId}`);
  const handleStartStory = (storyId: string) => navigate(`/story/${storyId}/read`);
  const handleBackToLibrary = () => navigate('/');
  const handleViewProfile = (profileUserId: string) => navigate(`/user/${profileUserId}`);

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 text-white px-4 py-3 flex flex-col items-center justify-center z-40 shadow-lg ${isPro ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
        <div className="flex items-center gap-2 mb-1">
          <img src="/nexttale-logo.png" alt="Next Tale" className="w-10 h-10 drop-shadow-lg" />
          <span className="font-extrabold text-2xl">NEXT TALE</span>
        </div>
        <p className="text-[9px] font-extrabold tracking-widest">READ, CHOOSE, CREATE MAGIC</p>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-50">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => navigate(viewToPath(view))}
          isPro={isPro}
        />
      </div>

      <div className="lg:ml-64 pt-20 lg:pt-0 pb-20 lg:pb-0">
        <Outlet
          context={{
            userId,
            isPro,
            handleSelectStory,
            handleStartStory,
            handleBackToLibrary,
            handleViewProfile,
          } satisfies AppOutletContext}
        />
      </div>

      <div className="lg:hidden">
        <BottomNav
          currentView={currentView}
          onNavigate={(view) => navigate(viewToPath(view))}
          isPro={isPro}
        />
      </div>
    </div>
  );
}

function StoryLibraryRoute() {
  const { userId, isPro, handleSelectStory, handleViewProfile } = useOutletContext<AppOutletContext>();
  return (
    <StoryLibrary
      onSelectStory={handleSelectStory}
      onViewProfile={handleViewProfile}
      userId={userId}
      isPro={isPro}
    />
  );
}

function StoryDetailRoute() {
  const { storyId } = useParams();
  const { userId, isPro, handleStartStory, handleBackToLibrary, handleViewProfile } = useOutletContext<AppOutletContext>();

  if (!storyId) {
    return <Navigate to="/" replace />;
  }

  return (
    <StoryDetail
      storyId={storyId}
      userId={userId}
      onBack={handleBackToLibrary}
      onStartStory={() => handleStartStory(storyId)}
      onViewProfile={handleViewProfile}
      isPro={isPro}
    />
  );
}

function StoryReaderRoute() {
  const { storyId } = useParams();
  const { userId, handleBackToLibrary, handleViewProfile } = useOutletContext<AppOutletContext>();

  if (!storyId) {
    return <Navigate to="/" replace />;
  }

  return (
    <StoryReader
      storyId={storyId}
      userId={userId}
      onComplete={handleBackToLibrary}
      onViewProfile={handleViewProfile}
    />
  );
}

function StoryCreatorRoute() {
  const { userId, handleSelectStory } = useOutletContext<AppOutletContext>();
  return <StoryCreator userId={userId} onStoryCreated={handleSelectStory} />;
}

function SubscriptionRoute() {
  const { userId, handleBackToLibrary } = useOutletContext<AppOutletContext>();
  return <Subscription userId={userId} onBack={handleBackToLibrary} />;
}

function QuestsRoute() {
  const { userId } = useOutletContext<AppOutletContext>();
  return <Quests userId={userId} />;
}

function ProfileRoute() {
  const { userId, handleSelectStory } = useOutletContext<AppOutletContext>();
  return <Profile userId={userId} onSelectStory={handleSelectStory} />;
}

function PublicProfileRoute() {
  const { profileUserId } = useParams();
  const { handleBackToLibrary, handleSelectStory } = useOutletContext<AppOutletContext>();

  if (!profileUserId) {
    return <Navigate to="/" replace />;
  }

  return (
    <PublicProfile
      profileUserId={profileUserId}
      onBack={handleBackToLibrary}
      onSelectStory={handleSelectStory}
    />
  );
}

function LandingRoute() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onGetStarted={() => navigate('/')}
      onSelectStory={(storyId) => navigate(`/story/${storyId}`)}
    />
  );
}

function AuthRoute() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const initialMode = useMemo(() => (mode === 'signup' ? 'signup' : 'login'), [mode]);

  return (
    <Auth
      initialMode={initialMode}
      onAuthSuccess={() => navigate('/create')}
      featurePrompt={
        initialMode === 'signup'
          ? 'Create your account to start making magical stories'
          : 'Sign in to continue creating stories'
      }
    />
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  useQueryRedirects();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={<LandingRoute />} />
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/:mode" element={<AuthRoute />} />
      <Route element={<MainLayout />}>
        <Route index element={<StoryLibraryRoute />} />
        <Route path="story/:storyId" element={<StoryDetailRoute />} />
        <Route path="story/:storyId/read" element={<StoryReaderRoute />} />
        <Route
          path="create"
          element={
            <RequireAuth>
              <StoryCreatorRoute />
            </RequireAuth>
          }
        />
        <Route
          path="subscription"
          element={
            <RequireAuth>
              <SubscriptionRoute />
            </RequireAuth>
          }
        />
        <Route
          path="quests"
          element={
            <RequireAuth>
              <QuestsRoute />
            </RequireAuth>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfileRoute />
            </RequireAuth>
          }
        />
        <Route path="user/:profileUserId" element={<PublicProfileRoute />} />
      </Route>
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
