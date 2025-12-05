import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/authContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Override render method
export { customRender as render };

// Test data factories
export const createMockStory = (overrides = {}) => ({
  id: 'test-story-1',
  title: 'Test Story',
  description: 'A test story description',
  age_range: '8-12',
  estimated_duration: 15,
  story_context: 'Fantasy adventure',
  created_by: 'user-1',
  is_public: true,
  is_user_generated: false,
  generation_status: 'fully_generated' as const,
  generation_progress: 100,
  language: 'en',
  art_style: 'fantasy',
  narrator_enabled: true,
  cover_image_url: 'https://example.com/cover.png',
  image_prompt: null,
  likes_count: 10,
  dislikes_count: 2,
  comment_count: 5,
  completion_count: 50,
  story_outline: null,
  story_memory: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockStoryNode = (overrides = {}) => ({
  id: 'test-node-1',
  story_id: 'test-story-1',
  node_key: 'start',
  content: 'This is the beginning of the story...',
  is_ending: false,
  ending_type: null,
  sequence_order: 0,
  parent_choice_id: null,
  image_url: 'https://example.com/node-image.png',
  image_prompt: null,
  audio_url: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockStoryChoice = (overrides = {}) => ({
  id: 'test-choice-1',
  from_node_id: 'test-node-1',
  to_node_id: 'test-node-2',
  choice_text: 'Go left into the forest',
  consequence_hint: 'You might find something interesting',
  choice_order: 0,
  is_public: true,
  created_by: null,
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {
    display_name: 'Test User',
  },
  ...overrides,
});

export const createMockUserProfile = (overrides = {}) => ({
  id: 'user-1',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'A test user bio',
  avatar_url: 'https://example.com/avatar.png',
  subscription_tier: 'free' as const,
  is_grandfathered: false,
  total_points: 100,
  reading_points: 50,
  creating_points: 50,
  stories_generated_today: 0,
  last_generation_date: null,
  total_stories_generated: 5,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: null,
  subscription_period_end: null,
  created_at: new Date().toISOString(),
  ...overrides,
});
