# AI Chat

The heart of Joyixir is the AI chat interface. Describe what you want, and watch it happen.

## How It Works

1. **You describe** what you want in natural language
2. **AI analyzes** your request with context from your project
3. **Code is generated** using React, TypeScript, and modern tooling
4. **Preview updates** instantly with your changes

## Writing Good Prompts

### Be Specific

::: code-group
```text [Bad]
Make a game
```

```text [Good]
Create a snake game with:
- Green snake on dark background
- Arrow key controls
- Red food that spawns randomly
- Score in top-right corner
```
:::

### Describe Visuals

The AI can't see your screen. Be explicit about:
- **Colors**: "blue button", "#1a1a1a background"
- **Sizes**: "32px font", "full-width container"
- **Positions**: "centered", "top-right corner"

### Iterate Step by Step

Don't try to build everything at once:

```
1. "Create a basic game canvas with a player square"
2. "Add arrow key movement"
3. "Add obstacles the player must avoid"
4. "Add a score counter"
5. "Add game over when hitting obstacles"
```

## Response Format

AI responses include:

- **Summary**: What was done
- **Features**: Bullet points with checkmarks
- **Next Steps**: Suggested improvements you can click

## Context Window

The AI remembers:
- Last 10 messages
- Current file contents
- Selected file (if any)
- Installed packages

::: warning
Very long conversations may lose context. If the AI forgets something, remind it or start fresh.
:::

## Magic Phrases

| Phrase | Effect |
|--------|--------|
| "Keep it simple" | Avoids over-engineering |
| "Production ready" | Adds error handling |
| "Like [game name]" | Uses familiar patterns |
| "Mobile friendly" | Adds touch controls |
