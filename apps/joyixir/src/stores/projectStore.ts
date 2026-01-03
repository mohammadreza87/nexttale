/**
 * Project store using Zustand
 * Manages project list with caching and CRUD operations
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { JoyixirProject, CreateProjectInput } from '../types';
import {
  getProjects as fetchProjects,
  createProject as createNewProject,
  deleteProject as removeProject,
  updateProject as updateProjectData,
} from '../lib/projectService';

interface ProjectState {
  // Data
  projects: JoyixirProject[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Cache management
  lastFetched: number | null;
  cacheTimeout: number;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<JoyixirProject>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<JoyixirProject>) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      projects: [],
      isLoading: false,
      isCreating: false,
      error: null,
      lastFetched: null,
      cacheTimeout: CACHE_TIMEOUT,

      fetchProjects: async () => {
        const { lastFetched, cacheTimeout, projects, isLoading } = get();

        // Return cached data if still valid
        if (
          projects.length > 0 &&
          lastFetched &&
          Date.now() - lastFetched < cacheTimeout
        ) {
          return;
        }

        // Prevent duplicate fetches
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const data = await fetchProjects();
          set({
            projects: data,
            lastFetched: Date.now(),
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load projects',
            isLoading: false,
          });
        }
      },

      createProject: async (input) => {
        set({ isCreating: true, error: null });

        try {
          const project = await createNewProject(input);
          set((state) => ({
            projects: [project, ...state.projects],
            isCreating: false,
          }));
          return project;
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to create project',
            isCreating: false,
          });
          throw err;
        }
      },

      deleteProject: async (id) => {
        try {
          await removeProject(id);
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to delete project',
          });
          throw err;
        }
      },

      updateProject: async (id, updates) => {
        try {
          const updatedProject = await updateProjectData(id, updates);
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id ? updatedProject : p
            ),
          }));
        } catch (err) {
          console.error('Failed to update project:', err);
        }
      },

      clearError: () => set({ error: null }),

      invalidateCache: () => set({ lastFetched: null }),
    }),
    { name: 'ProjectStore' }
  )
);

// Selectors
export const selectProjects = (state: ProjectState) => state.projects;
export const selectRecentProjects = (state: ProjectState) =>
  state.projects.slice(0, 5);
export const selectIsLoading = (state: ProjectState) => state.isLoading;
export const selectIsCreating = (state: ProjectState) => state.isCreating;
