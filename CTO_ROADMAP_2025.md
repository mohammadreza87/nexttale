# NextTale CTO Roadmap 2025

## Executive Summary

This document outlines a strategic plan to transform NextTale from an MVP into a scalable, maintainable, production-grade platform. The plan is divided into 4 phases, prioritizing foundational improvements before feature expansion.

---

## Current State Assessment

| Dimension | Score | Status |
|-----------|-------|--------|
| Code Quality | 5/10 | Large components, mixed concerns |
| Test Coverage | 1/10 | No tests |
| Performance | 6/10 | No optimization strategy |
| Scalability | 6/10 | Backend solid, frontend weak |
| Security | 8/10 | Well-handled |
| Developer Experience | 5/10 | No tooling, documentation sparse |
| Monitoring | 2/10 | Basic console.error logging |

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 Development Infrastructure

#### Monorepo Setup with Turborepo
```
nexttale/
├── apps/
│   ├── web/                    # React frontend
│   ├── api/                    # Supabase edge functions
│   └── docs/                   # Documentation site
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── types/                  # Shared TypeScript types
│   ├── config/                 # Shared configs (ESLint, TSConfig)
│   ├── utils/                  # Shared utilities
│   └── story-engine/           # Core story generation logic
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

**Why Turborepo?**
- Incremental builds (only rebuild what changed)
- Remote caching (CI builds are instant)
- Task orchestration (parallel builds)
- Perfect for scaling team size

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:migrate": "supabase db push",
    "db:generate-types": "supabase gen types typescript --local > packages/types/src/database.ts"
  }
}
```

### 1.2 Code Quality Tooling

#### ESLint Configuration (Strict)
```javascript
// packages/config/eslint-preset.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'max-lines': ['error', { max: 300, skipComments: true }],
    'complexity': ['error', 10]
  }
};
```

#### Pre-commit Hooks (Husky + lint-staged)
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": "prettier --write"
  }
}
```

#### Commit Convention (Commitlint)
```
feat(story-engine): add memory compression for long stories
fix(auth): handle expired refresh tokens gracefully
perf(reader): lazy load chapter images
docs(api): add edge function documentation
```

### 1.3 Testing Infrastructure

#### Test Stack
- **Unit Tests**: Vitest (fast, Vite-native)
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **API Tests**: Supertest + MSW (Mock Service Worker)

#### Coverage Targets
| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 80% | 0% |
| Integration | 70% | 0% |
| E2E Critical Paths | 100% | 0% |

#### Directory Structure
```
apps/web/
├── src/
│   ├── components/
│   │   ├── StoryReader/
│   │   │   ├── index.tsx
│   │   │   ├── StoryReader.test.tsx      # Unit tests
│   │   │   └── StoryReader.stories.tsx   # Storybook
├── tests/
│   ├── e2e/
│   │   ├── story-creation.spec.ts
│   │   ├── story-reading.spec.ts
│   │   └── subscription-flow.spec.ts
│   └── integration/
│       └── api/
```

### 1.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test -- --coverage
      - run: pnpm build

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e

  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: [validate, e2e]
    steps:
      - name: Deploy to Vercel Preview
        uses: vercel/action@v1
```

---

## Phase 2: Architecture Refactoring (Weeks 5-10)

### 2.1 Frontend Architecture

#### Component Decomposition

**Before (StoryReader.tsx - 2,072 lines):**
```
StoryReader
├── State (50+ useState calls)
├── Effects (15+ useEffect calls)
├── Audio logic
├── Image generation logic
├── Story progression logic
├── Edit mode logic
├── Reactions logic
└── 1,500 lines of JSX
```

**After:**
```
apps/web/src/features/story-reader/
├── components/
│   ├── ChapterView/
│   │   ├── index.tsx              # Main chapter display
│   │   ├── ChapterContent.tsx     # Text with word highlighting
│   │   ├── ChapterImage.tsx       # Image with loading state
│   │   └── ChapterActions.tsx     # Play, edit buttons
│   ├── ChoiceSelector/
│   │   ├── index.tsx
│   │   ├── ChoiceButton.tsx
│   │   ├── CustomChoiceInput.tsx
│   │   └── ChoiceVisibilityToggle.tsx
│   ├── StoryProgress/
│   │   ├── index.tsx
│   │   └── ChapterDot.tsx
│   ├── StoryEnding/
│   │   ├── index.tsx
│   │   ├── CreatorCard.tsx
│   │   └── ReactionButtons.tsx
│   └── EditMode/
│       ├── index.tsx
│       ├── ContentEditor.tsx
│       └── ChoiceEditor.tsx
├── hooks/
│   ├── useStoryReader.ts          # Main orchestration hook
│   ├── useChapterNavigation.ts    # Path tracking, progress saving
│   ├── useStoryGeneration.ts      # AI generation calls
│   ├── useAudioNarration.ts       # TTS logic
│   ├── useImageGeneration.ts      # Image generation queue
│   └── useStoryReactions.ts       # Like/dislike logic
├── context/
│   └── StoryReaderContext.tsx     # Shared state
├── types.ts
└── index.tsx                      # Public export
```

#### Custom Hooks Pattern

```typescript
// hooks/useStoryGeneration.ts
interface UseStoryGenerationOptions {
  storyId: string;
  storyContext: string;
  onChapterGenerated?: (chapter: StoryChapter) => void;
}

interface UseStoryGenerationReturn {
  generateNextChapter: (choice: string, previousContent: string) => Promise<GeneratedChapter>;
  isGenerating: boolean;
  progress: number;
  error: Error | null;
  retry: () => void;
}

export function useStoryGeneration(options: UseStoryGenerationOptions): UseStoryGenerationReturn {
  const [state, dispatch] = useReducer(generationReducer, initialState);

  const generateNextChapter = useCallback(async (choice: string, previousContent: string) => {
    dispatch({ type: 'START_GENERATION' });

    try {
      // Wait for backend worker first
      const resolvedNode = await waitForNodeResolution(nodeId);
      if (resolvedNode) {
        dispatch({ type: 'GENERATION_SUCCESS', payload: resolvedNode });
        return resolvedNode;
      }

      // Fallback to direct generation
      const result = await storyService.generateChapter({
        storyContext: options.storyContext,
        userChoice: choice,
        previousContent,
      });

      dispatch({ type: 'GENERATION_SUCCESS', payload: result });
      return result;
    } catch (error) {
      dispatch({ type: 'GENERATION_ERROR', payload: error });
      throw error;
    }
  }, [options.storyContext]);

  return {
    generateNextChapter,
    isGenerating: state.isGenerating,
    progress: state.progress,
    error: state.error,
    retry: () => dispatch({ type: 'RESET' }),
  };
}
```

### 2.2 State Management with Zustand

```typescript
// stores/useAppStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // User
  user: User | null;
  subscription: SubscriptionUsage | null;

  // UI Preferences
  autoNarration: boolean;
  theme: 'light' | 'dark';

  // Actions
  setUser: (user: User | null) => void;
  setSubscription: (sub: SubscriptionUsage) => void;
  toggleAutoNarration: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        subscription: null,
        autoNarration: true,
        theme: 'dark',

        setUser: (user) => set((state) => { state.user = user }),
        setSubscription: (sub) => set((state) => { state.subscription = sub }),
        toggleAutoNarration: () => set((state) => {
          state.autoNarration = !state.autoNarration
        }),
      })),
      { name: 'nexttale-store' }
    )
  )
);

// Separate store for current story reading session
interface StoryReaderState {
  storyId: string | null;
  chapters: StoryChapter[];
  currentChapterIndex: number;
  pathTaken: string[];
  isGenerating: boolean;

  // Actions
  initializeStory: (storyId: string) => Promise<void>;
  selectChoice: (chapterIndex: number, choice: StoryChoice) => Promise<void>;
  reset: () => void;
}

export const useStoryReaderStore = create<StoryReaderState>()(
  devtools(
    immer((set, get) => ({
      storyId: null,
      chapters: [],
      currentChapterIndex: 0,
      pathTaken: ['start'],
      isGenerating: false,

      initializeStory: async (storyId) => {
        set({ storyId, chapters: [], isGenerating: true });
        const story = await storyService.getStory(storyId);
        const firstChapter = await storyService.getStoryNode(storyId, 'start');
        set((state) => {
          state.chapters = [{ node: firstChapter, choices: [] }];
          state.isGenerating = false;
        });
      },

      selectChoice: async (chapterIndex, choice) => {
        // ... implementation
      },

      reset: () => set({ storyId: null, chapters: [], pathTaken: ['start'] }),
    }))
  )
);
```

### 2.3 API Layer with React Query

```typescript
// lib/queries/stories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const storyKeys = {
  all: ['stories'] as const,
  lists: () => [...storyKeys.all, 'list'] as const,
  list: (filters: StoryFilters) => [...storyKeys.lists(), filters] as const,
  details: () => [...storyKeys.all, 'detail'] as const,
  detail: (id: string) => [...storyKeys.details(), id] as const,
};

export function useStories(filters: StoryFilters) {
  return useQuery({
    queryKey: storyKeys.list(filters),
    queryFn: () => storyService.getStoriesPaginated(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStory(storyId: string) {
  return useQuery({
    queryKey: storyKeys.detail(storyId),
    queryFn: () => storyService.getStory(storyId),
    enabled: !!storyId,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyService.createStory,
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      queryClient.setQueryData(storyKeys.detail(newStory.id), newStory);
    },
  });
}

export function useStoryReaction(storyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reaction: 'like' | 'dislike') =>
      storyService.addReaction(storyId, reaction),
    onMutate: async (reaction) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: storyKeys.detail(storyId) });
      const previous = queryClient.getQueryData(storyKeys.detail(storyId));

      queryClient.setQueryData(storyKeys.detail(storyId), (old: Story) => ({
        ...old,
        likes_count: reaction === 'like' ? old.likes_count + 1 : old.likes_count,
        dislikes_count: reaction === 'dislike' ? old.dislikes_count + 1 : old.dislikes_count,
      }));

      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(storyKeys.detail(storyId), context?.previous);
    },
  });
}
```

### 2.4 Service Layer Refactoring

```typescript
// packages/story-engine/src/StoryEngine.ts
export class StoryEngine {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly storage: StorageProvider,
    private readonly config: StoryEngineConfig
  ) {}

  async generateOutline(prompt: string, language: string): Promise<StoryOutline> {
    const outline = await this.aiProvider.generateStructuredOutput<StoryOutline>({
      prompt: this.buildOutlinePrompt(prompt, language),
      schema: StoryOutlineSchema,
      temperature: 0.6,
    });

    return this.validateOutline(outline);
  }

  async generateChapter(
    outline: StoryOutline,
    memory: StoryMemory,
    userChoice: string,
    targetChapter: number
  ): Promise<GeneratedChapter> {
    const context = this.buildChapterContext(outline, memory, targetChapter);

    const chapter = await this.aiProvider.generateStructuredOutput<GeneratedChapter>({
      prompt: this.buildChapterPrompt(context, userChoice),
      schema: GeneratedChapterSchema,
      temperature: 0.55,
    });

    // Update memory with new chapter info
    const updatedMemory = this.updateMemory(memory, chapter, targetChapter);

    return {
      ...chapter,
      memory: updatedMemory,
    };
  }

  private validateOutline(outline: StoryOutline): StoryOutline {
    if (!outline.chapters || outline.chapters.length < 5) {
      throw new StoryEngineError('Outline must have at least 5 chapters');
    }
    if (!outline.characters || outline.characters.length === 0) {
      throw new StoryEngineError('Outline must have at least one character');
    }
    return outline;
  }
}

// Dependency injection for testing
export function createStoryEngine(config: StoryEngineConfig): StoryEngine {
  const aiProvider = new GeminiProvider(config.geminiApiKey);
  const storage = new SupabaseStorage(config.supabaseClient);
  return new StoryEngine(aiProvider, storage, config);
}
```

### 2.5 Type Safety Improvements

```typescript
// packages/types/src/story.ts
import { z } from 'zod';

// Zod schemas for runtime validation
export const StoryCharacterSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'love_interest', 'ally']),
  age: z.string().optional(),
  appearance: z.string().min(10),
  clothing: z.string().min(5),
  personality: z.string().min(10),
  motivation: z.string().optional(),
  goal: z.string().optional(),
});

export const StoryOutlineSchema = z.object({
  premise: z.string().min(20),
  theme: z.string(),
  genre: z.string(),
  tone: z.string(),
  setting: z.object({
    location: z.string(),
    timePeriod: z.string(),
    timeOfDay: z.string(),
    atmosphere: z.string(),
    consistentElements: z.array(z.string()),
  }),
  characters: z.array(StoryCharacterSchema).min(1),
  plotThreads: z.array(z.object({
    id: z.string(),
    description: z.string(),
    introducedInChapter: z.number(),
    stakes: z.string(),
  })),
  chapters: z.array(z.object({
    chapterNumber: z.number(),
    title: z.string(),
    keyEvent: z.string(),
    conflict: z.string(),
    emotionalBeat: z.string(),
    endState: z.string(),
    mustReference: z.array(z.string()),
  })).min(5),
  resolution: z.string(),
  totalChapters: z.number().min(5).max(10),
});

// Derive TypeScript types from Zod schemas
export type StoryCharacter = z.infer<typeof StoryCharacterSchema>;
export type StoryOutline = z.infer<typeof StoryOutlineSchema>;

// Database types (auto-generated from Supabase)
export type { Database } from './database';
export type Story = Database['public']['Tables']['stories']['Row'];
export type StoryNode = Database['public']['Tables']['story_nodes']['Row'];
export type StoryChoice = Database['public']['Tables']['story_choices']['Row'];
```

---

## Phase 3: Performance & Scalability (Weeks 11-16)

### 3.1 Frontend Performance

#### Code Splitting Strategy
```typescript
// App.tsx
import { lazy, Suspense } from 'react';

// Route-based code splitting
const StoryLibrary = lazy(() => import('./features/story-library'));
const StoryReader = lazy(() => import('./features/story-reader'));
const StoryCreator = lazy(() => import('./features/story-creator'));
const Profile = lazy(() => import('./features/profile'));

// Component-level code splitting
const UpgradeModal = lazy(() => import('./components/UpgradeModal'));
const StoryEditor = lazy(() => import('./features/story-editor'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<StoryLibrary />} />
        <Route path="/story/:id" element={<StoryReader />} />
        <Route path="/create" element={<StoryCreator />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

#### Image Optimization
```typescript
// components/OptimizedImage.tsx
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width, height, priority = false }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Use Supabase image transformation
  const optimizedSrc = src.includes('supabase')
    ? `${src}?width=${width}&quality=80&format=webp`
    : src;

  return (
    <div className="relative" style={{ aspectRatio: `${width}/${height}` }}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
```

#### Virtual Scrolling for Story Library
```typescript
// features/story-library/StoryList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function StoryList({ stories }: { stories: Story[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: stories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated card height
    overscan: 2,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <StoryCard story={stories[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.2 Backend Performance

#### Edge Function Optimization
```typescript
// supabase/functions/generate-story/index.ts

// 1. Add request deduplication
const pendingRequests = new Map<string, Promise<Response>>();

async function handleRequest(req: Request): Promise<Response> {
  const body = await req.clone().json();
  const requestKey = generateRequestKey(body);

  // Return existing promise if duplicate request
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }

  const responsePromise = processRequest(req, body);
  pendingRequests.set(requestKey, responsePromise);

  try {
    return await responsePromise;
  } finally {
    pendingRequests.delete(requestKey);
  }
}

// 2. Stream responses for long operations
async function streamStoryGeneration(req: Request): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send progress updates
        controller.enqueue(encoder.encode(`data: {"progress": 10, "status": "Generating outline..."}\n\n`));

        const outline = await generateOutline(prompt);
        controller.enqueue(encoder.encode(`data: {"progress": 40, "status": "Creating first chapter..."}\n\n`));

        const chapter = await generateFirstChapter(outline);
        controller.enqueue(encoder.encode(`data: {"progress": 100, "status": "Complete", "data": ${JSON.stringify(chapter)}}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error": "${error.message}"}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Database Query Optimization
```sql
-- Add composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_stories_public_created
ON stories(is_public, created_at DESC)
WHERE is_public = true;

CREATE INDEX CONCURRENTLY idx_story_nodes_story_key
ON story_nodes(story_id, node_key);

CREATE INDEX CONCURRENTLY idx_user_progress_user_story
ON user_story_progress(user_id, story_id);

-- Materialized view for story statistics
CREATE MATERIALIZED VIEW story_stats AS
SELECT
  s.id,
  s.title,
  COUNT(DISTINCT usp.user_id) as unique_readers,
  COUNT(DISTINCT CASE WHEN usp.completed THEN usp.user_id END) as completions,
  COALESCE(SUM(CASE WHEN sr.reaction_type = 'like' THEN 1 ELSE 0 END), 0) as likes,
  COALESCE(SUM(CASE WHEN sr.reaction_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes
FROM stories s
LEFT JOIN user_story_progress usp ON s.id = usp.story_id
LEFT JOIN story_reactions sr ON s.id = sr.story_id
WHERE s.is_public = true
GROUP BY s.id, s.title;

CREATE UNIQUE INDEX ON story_stats(id);

-- Refresh periodically
SELECT cron.schedule('refresh-story-stats', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY story_stats');
```

### 3.3 Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const cacheKeys = {
  story: (id: string) => `story:${id}`,
  storyList: (page: number) => `stories:list:${page}`,
  userSubscription: (userId: string) => `user:${userId}:subscription`,
  storyStats: (id: string) => `story:${id}:stats`,
};

export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Fetch and cache
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, data);
  return data;
}

// Usage in edge function
async function getStory(storyId: string): Promise<Story> {
  return cachedQuery(
    cacheKeys.story(storyId),
    async () => {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      return data;
    },
    600 // 10 minutes
  );
}
```

### 3.4 Background Job Queue

```typescript
// Use Supabase pg_cron + Edge Functions for background jobs

// supabase/functions/background-worker/index.ts
Deno.serve(async (req) => {
  const { task, payload } = await req.json();

  switch (task) {
    case 'generate-story-images':
      return handleImageGeneration(payload);
    case 'generate-story-audio':
      return handleAudioGeneration(payload);
    case 'cleanup-orphaned-nodes':
      return handleCleanup(payload);
    case 'refresh-story-stats':
      return handleStatsRefresh();
    default:
      return new Response('Unknown task', { status: 400 });
  }
});

async function handleImageGeneration({ storyId, nodeIds }: { storyId: string; nodeIds: string[] }) {
  for (const nodeId of nodeIds) {
    try {
      // Check if image already exists
      const { data: node } = await supabase
        .from('story_nodes')
        .select('image_url, content')
        .eq('id', nodeId)
        .single();

      if (node?.image_url) continue;

      // Generate and save image
      const imageUrl = await generateImage(node.content);
      await supabase
        .from('story_nodes')
        .update({ image_url: imageUrl })
        .eq('id', nodeId);

      // Rate limit to avoid API throttling
      await delay(1000);
    } catch (error) {
      console.error(`Failed to generate image for node ${nodeId}:`, error);
    }
  }

  return new Response(JSON.stringify({ success: true }));
}
```

---

## Phase 4: Observability & Operations (Weeks 17-20)

### 4.1 Error Tracking & Monitoring

#### Sentry Integration
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENV,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/],
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Custom error boundary
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} onReset={resetError} />
      )}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

// Track story generation errors specifically
export function trackStoryGenerationError(error: Error, context: {
  storyId?: string;
  chapterNumber?: number;
  userChoice?: string;
}) {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'story-generation');
    scope.setContext('story', context);
    Sentry.captureException(error);
  });
}
```

### 4.2 Analytics & Metrics

```typescript
// lib/analytics.ts
import posthog from 'posthog-js';

posthog.init(process.env.VITE_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com',
  capture_pageview: false, // Manual control
  capture_pageleave: true,
});

// Event types
type AnalyticsEvent =
  | { name: 'story_created'; properties: { storyId: string; artStyle: string; language: string } }
  | { name: 'story_started'; properties: { storyId: string; source: 'library' | 'share' | 'profile' } }
  | { name: 'chapter_completed'; properties: { storyId: string; chapterNumber: number; choiceText: string } }
  | { name: 'story_completed'; properties: { storyId: string; totalChapters: number; pathLength: number } }
  | { name: 'subscription_started'; properties: { plan: string; source: string } }
  | { name: 'custom_choice_used'; properties: { storyId: string; chapterNumber: number } };

export function trackEvent<T extends AnalyticsEvent>(event: T) {
  posthog.capture(event.name, event.properties);
}

// User identification
export function identifyUser(userId: string, traits: {
  email?: string;
  subscriptionTier: string;
  storiesCreated: number;
  storiesCompleted: number;
}) {
  posthog.identify(userId, traits);
}

// Feature flags
export async function getFeatureFlag(flag: string): Promise<boolean> {
  return posthog.isFeatureEnabled(flag) ?? false;
}
```

### 4.3 Logging Strategy

```typescript
// lib/logger.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true },
      },
  base: {
    env: process.env.NODE_ENV,
    version: process.env.VITE_APP_VERSION,
  },
});

// Structured logging helpers
export const storyLogger = logger.child({ module: 'story' });
export const authLogger = logger.child({ module: 'auth' });
export const paymentLogger = logger.child({ module: 'payment' });

// Usage
storyLogger.info({ storyId, userId, action: 'generate_chapter' }, 'Starting chapter generation');
storyLogger.error({ storyId, error: error.message }, 'Chapter generation failed');
```

### 4.4 Health Checks & Alerts

```typescript
// supabase/functions/health-check/index.ts
Deno.serve(async () => {
  const checks = {
    database: await checkDatabase(),
    gemini: await checkGeminiAPI(),
    stripe: await checkStripeAPI(),
    storage: await checkStorage(),
  };

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  return new Response(
    JSON.stringify({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    }),
    {
      status: allHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await supabase.from('stories').select('id').limit(1);
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

---

## Phase 5: Feature Roadmap (Ongoing)

### 5.1 Near-term Features (Q1 2025)

| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Story branching visualization | High | Medium | User engagement |
| Collaborative stories | High | High | Viral growth |
| Story remixing | Medium | Medium | Content creation |
| Reading streaks & achievements | Medium | Low | Retention |
| Push notifications | Medium | Low | Re-engagement |

### 5.2 Medium-term Features (Q2-Q3 2025)

| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Mobile apps (React Native) | High | High | Market reach |
| Real-time multiplayer stories | High | High | Differentiation |
| AI voice cloning for narration | Medium | Medium | Premium feature |
| Story marketplace | Medium | High | Monetization |
| API for third-party integration | Low | Medium | Platform growth |

### 5.3 Architecture Considerations for Scale

```
Current Architecture (MVP):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Supabase   │────▶│   Gemini    │
│  (Frontend) │     │  (Backend)  │     │    (AI)     │
└─────────────┘     └─────────────┘     └─────────────┘

Target Architecture (Scale):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Supabase   │────▶│   Redis     │
│  (Frontend) │     │ (Auth/DB)   │     │  (Cache)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐           │
       │            │   Workers   │◀──────────┘
       │            │  (BullMQ)   │
       │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│    CDN      │     │  AI Router  │
│ (Cloudflare)│     │ (Multi-LLM) │
└─────────────┘     └─────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │ Gemini  │ │ Claude  │ │  GPT-4  │
        └─────────┘ └─────────┘ └─────────┘
```

---

## Success Metrics

### Engineering Metrics
| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| Test Coverage | 0% | 80% |
| Build Time | ~30s | <10s |
| Lighthouse Score | ~70 | >90 |
| P95 API Latency | Unknown | <500ms |
| Error Rate | Unknown | <0.1% |
| Deployment Frequency | Manual | Daily |

### Business Metrics (to track)
| Metric | Description |
|--------|-------------|
| DAU/MAU | Daily/Monthly active users |
| Story Completion Rate | % of started stories completed |
| Pro Conversion Rate | Free to paid conversion |
| Churn Rate | Monthly subscription cancellations |
| NPS | Net Promoter Score |
| CAC/LTV | Customer acquisition cost vs lifetime value |

---

## Team Structure Recommendation

### Current (1-2 developers)
- Full-stack generalist approach
- Focus on Phase 1 & 2

### Growth (3-5 developers)
```
├── Frontend Engineer (React, Performance)
├── Backend Engineer (Supabase, Edge Functions)
├── AI/ML Engineer (Prompt Engineering, Model Optimization)
├── DevOps/Platform (CI/CD, Monitoring)
└── Product Engineer (Features, Analytics)
```

### Scale (6+ developers)
- Split into squads: Growth, Core Experience, AI/ML, Platform
- Add QA, Design, Product Management

---

## Budget Considerations

### Infrastructure Costs (Estimated Monthly)
| Service | Free Tier | Growth | Scale |
|---------|-----------|--------|-------|
| Supabase | $0 | $25-75 | $150+ |
| Vercel | $0 | $20 | $150+ |
| Gemini API | $0 | $50-200 | $500+ |
| OpenAI TTS | N/A | $50-100 | $300+ |
| Sentry | $0 | $26 | $80+ |
| PostHog | $0 | $0 | $450+ |
| Upstash Redis | $0 | $10 | $50+ |
| **Total** | **$0** | **~$300** | **~$1,700+** |

### Development Tools (Annual)
| Tool | Cost |
|------|------|
| GitHub Team | $44/user |
| Linear (Project Management) | $96/user |
| Figma (Design) | $144/user |
| Notion (Documentation) | $96/user |

---

## Conclusion

This roadmap transforms NextTale from an MVP into a scalable, maintainable platform through:

1. **Foundation** (Weeks 1-4): Monorepo, tooling, testing infrastructure
2. **Architecture** (Weeks 5-10): Component decomposition, state management, type safety
3. **Performance** (Weeks 11-16): Optimization, caching, background jobs
4. **Operations** (Weeks 17-20): Monitoring, analytics, alerting

The key principle throughout: **make the codebase boring**. Boring code is predictable, testable, and maintainable. The interesting parts should be the product features, not fighting with the architecture.

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Author: CTO Roadmap Generator*
