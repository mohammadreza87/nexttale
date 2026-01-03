/**
 * Main application store using Zustand
 * Manages global app state like current project, UI state, etc.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { JoyixirProject, NavItem, ViewMode } from '../types';

interface AppState {
  // Current project
  currentProject: JoyixirProject | null;
  initialPrompt: string | null;

  // UI State
  activeNav: NavItem;
  viewMode: ViewMode;
  leftPanelOpen: boolean;
  bottomPanelOpen: boolean;

  // Actions
  setCurrentProject: (project: JoyixirProject | null) => void;
  setInitialPrompt: (prompt: string | null) => void;
  setActiveNav: (nav: NavItem) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleLeftPanel: () => void;
  toggleBottomPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentProject: null,
  initialPrompt: null,
  activeNav: 'home' as NavItem,
  viewMode: 'grid' as ViewMode,
  leftPanelOpen: true,
  bottomPanelOpen: true,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setCurrentProject: (project) =>
          set({ currentProject: project }, false, 'setCurrentProject'),

        setInitialPrompt: (prompt) =>
          set({ initialPrompt: prompt }, false, 'setInitialPrompt'),

        setActiveNav: (nav) =>
          set({ activeNav: nav }, false, 'setActiveNav'),

        setViewMode: (mode) =>
          set({ viewMode: mode }, false, 'setViewMode'),

        toggleLeftPanel: () =>
          set((state) => ({ leftPanelOpen: !state.leftPanelOpen }), false, 'toggleLeftPanel'),

        toggleBottomPanel: () =>
          set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen }), false, 'toggleBottomPanel'),

        setLeftPanelOpen: (open) =>
          set({ leftPanelOpen: open }, false, 'setLeftPanelOpen'),

        setBottomPanelOpen: (open) =>
          set({ bottomPanelOpen: open }, false, 'setBottomPanelOpen'),

        reset: () =>
          set(initialState, false, 'reset'),
      }),
      {
        name: 'joyixir-app-storage',
        partialize: (state) => ({
          viewMode: state.viewMode,
          leftPanelOpen: state.leftPanelOpen,
          bottomPanelOpen: state.bottomPanelOpen,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// Selectors for better performance
export const selectCurrentProject = (state: AppState) => state.currentProject;
export const selectActiveNav = (state: AppState) => state.activeNav;
export const selectViewMode = (state: AppState) => state.viewMode;
