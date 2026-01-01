# Technical Specification: Chat-Based Game Iteration

## Overview

This document outlines the technical requirements for implementing Lovable-style chat-based iteration for NextTale's AI game builder.

---

## Current State

### What Exists
- Single-shot game generation from prompt
- Generated HTML/JS games stored in database
- Basic game preview and embed functionality

### What's Missing
- Conversational interface for refinement
- Incremental game updates (not full regeneration)
- Version history and undo
- Change visualization

---

## Target User Experience

```
┌────────────────────────────────────────────────────────────┐
│                    GAME PREVIEW                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │              🎮 [Live Game Preview]                  │  │
│  │                                                      │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💬 CONVERSATION                                      │  │
│  │                                                      │  │
│  │ You: Make a space shooter game                      │  │
│  │ AI: ✅ Created! Your game has a ship that shoots    │  │
│  │     lasers at incoming asteroids. Use arrow keys    │  │
│  │     to move and space to shoot.                     │  │
│  │                                                      │  │
│  │ You: Make the ship faster and add power-ups         │  │
│  │ AI: ✅ Done! I made these changes:                  │  │
│  │     • Ship speed increased by 50%                   │  │
│  │     • Added 3 power-ups: shield, rapid fire, bomb   │  │
│  │     [View diff]                                      │  │
│  │                                                      │  │
│  │ You: The power-ups appear too rarely               │  │
│  │ AI: ✅ Adjusted spawn rate from every 30s to 15s   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Type your changes...]                      [Send ➤] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [↩️ Undo] [📋 History] [🔗 Share] [⬇️ Export]           │
└────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Tables

```sql
-- Game versions for history/undo
CREATE TABLE game_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES interactive_content(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  html_content TEXT NOT NULL,
  prompt TEXT, -- What user said to create this version
  changes_summary TEXT, -- AI description of what changed
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(game_id, version_number)
);

-- Conversation history
CREATE TABLE game_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES interactive_content(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  version_created INTEGER, -- Which version this message created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_game_versions_game_id ON game_versions(game_id);
CREATE INDEX idx_game_versions_latest ON game_versions(game_id, version_number DESC);
CREATE INDEX idx_game_conversations_game_id ON game_conversations(game_id);
```

### Modified Tables

```sql
-- Add to interactive_content
ALTER TABLE interactive_content
  ADD COLUMN current_version INTEGER DEFAULT 1,
  ADD COLUMN total_versions INTEGER DEFAULT 1,
  ADD COLUMN conversation_context JSONB; -- Summarized context for AI
```

---

## API Endpoints

### 1. Create Game (Initial Generation)

```typescript
// POST /functions/v1/create-game
interface CreateGameRequest {
  prompt: string;
  template?: string; // 'quiz' | 'platformer' | 'shooter' | etc.
  style?: string; // 'pixel' | 'cartoon' | 'minimal'
}

interface CreateGameResponse {
  gameId: string;
  version: number;
  htmlContent: string;
  previewUrl: string;
  summary: string; // AI description of the game
}
```

### 2. Iterate Game (Chat-Based Editing)

```typescript
// POST /functions/v1/iterate-game
interface IterateGameRequest {
  gameId: string;
  message: string; // User's change request
}

interface IterateGameResponse {
  version: number;
  htmlContent: string;
  changesSummary: string; // What the AI changed
  diff?: string; // Optional: highlighted changes
}
```

### 3. Get Game History

```typescript
// GET /functions/v1/game-history/:gameId
interface GameHistoryResponse {
  currentVersion: number;
  versions: {
    version: number;
    prompt: string;
    summary: string;
    createdAt: string;
  }[];
  conversation: {
    role: 'user' | 'assistant';
    content: string;
    version?: number;
    createdAt: string;
  }[];
}
```

### 4. Restore Version

```typescript
// POST /functions/v1/restore-version
interface RestoreVersionRequest {
  gameId: string;
  version: number;
}

interface RestoreVersionResponse {
  newVersion: number; // Creates new version from restored content
  htmlContent: string;
}
```

---

## AI Prompt Engineering

### System Prompt for Iteration

```typescript
const ITERATION_SYSTEM_PROMPT = `
You are an AI game developer assistant. You help users modify and improve their games through natural conversation.

CONTEXT:
- You have access to the current game code
- You should make targeted changes based on user requests
- Preserve existing functionality unless explicitly asked to change it
- Always explain what you changed

RULES:
1. Make minimal changes to achieve the user's goal
2. Don't break existing features
3. Keep the game playable and fun
4. Explain your changes clearly
5. If the request is unclear, ask for clarification

OUTPUT FORMAT:
Return a JSON object with:
{
  "changes_summary": "Brief description of what changed",
  "html_content": "Complete updated game HTML",
  "clarification_needed": null | "Question to ask user"
}
`;
```

### Context Management

```typescript
interface GameContext {
  // Summarized game state (not full code)
  gameType: string; // 'shooter', 'quiz', 'platformer'
  features: string[]; // ['scoring', 'power-ups', 'levels']
  recentChanges: string[]; // Last 5 changes made
  userPreferences: {
    difficulty: 'easy' | 'medium' | 'hard';
    style: string;
  };
}
```

### Prompt Construction

```typescript
function buildIterationPrompt(
  currentHtml: string,
  context: GameContext,
  userMessage: string,
  conversationHistory: Message[]
): string {
  return `
${ITERATION_SYSTEM_PROMPT}

CURRENT GAME:
Type: ${context.gameType}
Features: ${context.features.join(', ')}
Recent changes: ${context.recentChanges.slice(-3).join('; ')}

CONVERSATION HISTORY:
${conversationHistory.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')}

CURRENT CODE:
\`\`\`html
${currentHtml}
\`\`\`

USER REQUEST:
${userMessage}

Please update the game according to the user's request.
`;
}
```

---

## Frontend Components

### GameEditor Component

```typescript
// src/components/game-editor/GameEditor.tsx
interface GameEditorProps {
  gameId: string;
}

export function GameEditor({ gameId }: GameEditorProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setConversation(prev => [...prev, { role: 'user', content: input }]);

    try {
      const response = await iterateGame(gameId, input);

      setGame(prev => ({
        ...prev!,
        htmlContent: response.htmlContent,
        currentVersion: response.version,
      }));

      setConversation(prev => [...prev, {
        role: 'assistant',
        content: response.changesSummary,
        version: response.version,
      }]);
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <GamePreview html={game?.htmlContent} />
      <ConversationPanel messages={conversation} />
      <InputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
      />
      <ActionBar
        onUndo={() => restoreVersion(gameId, game!.currentVersion - 1)}
        onHistory={() => openHistoryPanel()}
        onShare={() => openShareDialog()}
        onExport={() => exportGame(gameId)}
      />
    </div>
  );
}
```

### GamePreview Component

```typescript
// src/components/game-editor/GamePreview.tsx
interface GamePreviewProps {
  html: string | undefined;
}

export function GamePreview({ html }: GamePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="flex-1 bg-gray-900 p-4">
      <iframe
        ref={iframeRef}
        className="w-full h-full rounded-lg border border-gray-700"
        sandbox="allow-scripts"
        title="Game Preview"
      />
    </div>
  );
}
```

### ConversationPanel Component

```typescript
// src/components/game-editor/ConversationPanel.tsx
interface Message {
  role: 'user' | 'assistant';
  content: string;
  version?: number;
}

interface ConversationPanelProps {
  messages: Message[];
}

export function ConversationPanel({ messages }: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-64 overflow-y-auto p-4 bg-gray-800">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div
            className={`inline-block p-3 rounded-lg max-w-[80%] ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-100'
            }`}
          >
            {msg.content}
            {msg.version && (
              <span className="text-xs opacity-50 ml-2">v{msg.version}</span>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

---

## Edge Function Implementation

### iterate-game/index.ts

```typescript
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

Deno.serve(async (req) => {
  const { gameId, message } = await req.json();

  // 1. Get current game state
  const { data: game } = await supabase
    .from('interactive_content')
    .select('*, game_versions(*), game_conversations(*)')
    .eq('id', gameId)
    .single();

  if (!game) {
    return new Response(JSON.stringify({ error: 'Game not found' }), {
      status: 404,
    });
  }

  // 2. Get current HTML content
  const currentVersion = game.game_versions
    .sort((a, b) => b.version_number - a.version_number)[0];

  // 3. Build conversation history
  const conversationHistory = game.game_conversations
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(c => ({ role: c.role, content: c.content }));

  // 4. Build prompt
  const prompt = buildIterationPrompt(
    currentVersion.html_content,
    game.conversation_context,
    message,
    conversationHistory
  );

  // 5. Call Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent(prompt);
  const response = JSON.parse(result.response.text());

  // 6. If clarification needed, return question
  if (response.clarification_needed) {
    // Save assistant question to conversation
    await supabase.from('game_conversations').insert({
      game_id: gameId,
      role: 'assistant',
      content: response.clarification_needed,
    });

    return new Response(JSON.stringify({
      needsClarification: true,
      question: response.clarification_needed,
    }));
  }

  // 7. Save new version
  const newVersionNumber = currentVersion.version_number + 1;

  await supabase.from('game_versions').insert({
    game_id: gameId,
    version_number: newVersionNumber,
    html_content: response.html_content,
    prompt: message,
    changes_summary: response.changes_summary,
  });

  // 8. Save conversation
  await supabase.from('game_conversations').insert([
    { game_id: gameId, role: 'user', content: message },
    {
      game_id: gameId,
      role: 'assistant',
      content: response.changes_summary,
      version_created: newVersionNumber,
    },
  ]);

  // 9. Update game current version
  await supabase
    .from('interactive_content')
    .update({
      current_version: newVersionNumber,
      total_versions: newVersionNumber,
      html_content: response.html_content,
    })
    .eq('id', gameId);

  // 10. Return response
  return new Response(JSON.stringify({
    version: newVersionNumber,
    htmlContent: response.html_content,
    changesSummary: response.changes_summary,
  }));
});
```

---

## Performance Considerations

### Caching Strategy

```typescript
// Cache compiled game templates
const templateCache = new Map<string, string>();

// Cache recent game versions in memory
const versionCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 30, // 30 minutes
});
```

### Optimizations

1. **Incremental updates:** Don't regenerate entire game, patch changes
2. **Context compression:** Summarize game state, don't pass full code every time
3. **Streaming responses:** Stream AI response for faster perceived performance
4. **Lazy loading:** Load game preview after HTML is ready
5. **Debounced saves:** Don't save every keystroke, batch updates

---

## Testing Strategy

### Unit Tests

```typescript
describe('GameIteration', () => {
  it('should update game based on user request', async () => {
    const game = await createGame('Make a simple quiz');
    const updated = await iterateGame(game.id, 'Add 5 more questions');

    expect(updated.version).toBe(2);
    expect(updated.changesSummary).toContain('questions');
  });

  it('should preserve game state between iterations', async () => {
    const game = await createGame('Make a shooter game');
    await iterateGame(game.id, 'Add power-ups');
    const final = await iterateGame(game.id, 'Make ship faster');

    // Power-ups should still exist
    expect(final.htmlContent).toContain('powerUp');
  });

  it('should handle undo correctly', async () => {
    const game = await createGame('Make a puzzle');
    await iterateGame(game.id, 'Make it harder');
    const restored = await restoreVersion(game.id, 1);

    expect(restored.newVersion).toBe(3);
    // Content should match v1
  });
});
```

### Integration Tests

```typescript
describe('GameEditor E2E', () => {
  it('should allow full iteration workflow', async () => {
    // 1. Create game
    // 2. Send iteration message
    // 3. Verify game updates in preview
    // 4. Undo change
    // 5. Verify previous version restored
  });
});
```

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging
- Team testing
- Bug fixes

### Phase 2: Beta Users (Week 2-3)
- 100 invited users
- Collect feedback
- Iterate on UX

### Phase 3: Full Launch (Week 4)
- Enable for all users
- Monitor performance
- Scaling as needed

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Avg iterations per game | 3+ |
| Iteration success rate | >90% |
| Time per iteration | <30 seconds |
| User satisfaction (NPS) | >50 |
| Retention (D7) for iterators | 50%+ |

---

## Dependencies

### External
- Google Gemini API (2.0-flash-exp or higher)
- Supabase (database, auth, edge functions)

### Internal
- Existing game generation system
- User authentication
- Credit/billing system

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI breaks game during iteration | Validation layer, auto-rollback |
| Context window overflow | Summarization, sliding window |
| Slow response times | Caching, streaming, model optimization |
| High API costs | Credit system, rate limiting |

---

*Document Version: 1.0*
*Last Updated: January 2025*
