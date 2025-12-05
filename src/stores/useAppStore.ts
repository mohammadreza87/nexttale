import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

interface SubscriptionUsage {
  isPro: boolean;
  canGenerate: boolean;
  storiesUsedToday: number;
  dailyLimit: number;
  totalStoriesGenerated: number;
  subscriptionTier: 'free' | 'pro';
  isGrandfathered: boolean;
}

interface AppState {
  // User state
  user: User | null;
  subscription: SubscriptionUsage | null;
  isLoading: boolean;

  // UI Preferences (persisted)
  autoNarration: boolean;
  theme: 'light' | 'dark';

  // Actions
  setUser: (user: User | null) => void;
  setSubscription: (subscription: SubscriptionUsage | null) => void;
  setLoading: (isLoading: boolean) => void;
  toggleAutoNarration: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  reset: () => void;
}

const initialState = {
  user: null,
  subscription: null,
  isLoading: true,
  autoNarration: true,
  theme: 'dark' as const,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) => set({ user }, false, 'setUser'),

        setSubscription: (subscription) => set({ subscription }, false, 'setSubscription'),

        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

        toggleAutoNarration: () =>
          set((state) => ({ autoNarration: !state.autoNarration }), false, 'toggleAutoNarration'),

        setTheme: (theme) => set({ theme }, false, 'setTheme'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'nexttale-app-store',
        partialize: (state) => ({
          autoNarration: state.autoNarration,
          theme: state.theme,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// Selectors for optimized re-renders
export const useUser = () => useAppStore((state) => state.user);
export const useSubscription = () => useAppStore((state) => state.subscription);
export const useIsPro = () => useAppStore((state) => state.subscription?.isPro ?? false);
export const useAutoNarration = () => useAppStore((state) => state.autoNarration);
export const useTheme = () => useAppStore((state) => state.theme);
