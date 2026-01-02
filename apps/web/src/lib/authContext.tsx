import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if URL contains OAuth callback tokens
function hasOAuthTokens(): boolean {
  const hash = window.location.hash;
  const search = window.location.search;
  return hash.includes('access_token') ||
         hash.includes('refresh_token') ||
         search.includes('code=');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have OAuth tokens in URL, wait for auth state change instead of getSession
    // This prevents race condition where getSession returns null before tokens are processed
    const isOAuthCallback = hasOAuthTokens();

    if (!isOAuthCallback) {
      // Normal flow - get existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // For OAuth callbacks, only set loading to false after we get the auth event
      if (isOAuthCallback || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setLoading(false);
      }

      // Clean up OAuth tokens from URL after successful sign in
      if (isOAuthCallback && event === 'SIGNED_IN' && session) {
        // Remove hash fragment with tokens from URL
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', cleanUrl);
      }
    });

    // Timeout fallback for OAuth callbacks in case something goes wrong
    if (isOAuthCallback) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);
      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
