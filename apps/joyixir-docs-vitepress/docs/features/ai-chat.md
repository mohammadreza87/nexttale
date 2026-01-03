# AI Chat

The heart of Joyixir is the AI chat interface. Describe what you want, and watch it happen.

## Chat Panel Overview

The chat panel (left side) includes:

| Feature | Description |
|---------|-------------|
| **Project Dropdown** | Access project settings, credits, and navigation |
| **History Button** | Toggle chat history to view past sessions |
| **Copy Button** | Copy the entire chat to clipboard |
| **Chat Messages** | Your conversation with the AI |
| **Credits Panel** | Shows remaining credits with "Add credits" option |
| **Chat Input** | Type your prompts here |

## How It Works

1. **You describe** what you want in natural language
2. **AI analyzes** your request with context from your project
3. **Code is generated** using React, TypeScript, and modern tooling
4. **Preview updates** instantly with your changes

## Chat History

Joyixir automatically saves your chat sessions. To access them:

1. Click the **History** button (clock icon) in the chat header
2. Browse your previous chat sessions
3. Click a session to load it
4. Click **New Chat** to start fresh

::: tip Session Titles
Sessions are automatically titled based on your first message. Long titles are truncated for readability.
:::

## Project Dropdown

Click the project name to access:

- **Go to Dashboard** - Return to your projects list
- **Credits** - View remaining credits and usage
- **Get free credits** - Learn how to earn more
- **Settings** - Project settings
- **Remix project** - Create a copy
- **Rename project** - Change the project name
- **Star project** - Mark as favorite

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
- **Next Steps**: Clickable suggestion cards for common next actions

## Next Steps Cards

After each AI response, you'll see suggestion cards like:
- "Add sound effects"
- "Improve the UI"
- "Add a leaderboard"

Click any card to automatically send that prompt to the AI.

## Context Window

The AI remembers:
- Last 10 messages
- Current file contents
- Selected file (if any)
- Installed packages

::: warning
Very long conversations may lose context. If the AI forgets something, remind it or start a new chat session.
:::

## Magic Phrases

| Phrase | Effect |
|--------|--------|
| "Keep it simple" | Avoids over-engineering |
| "Production ready" | Adds error handling |
| "Like [game name]" | Uses familiar patterns |
| "Mobile friendly" | Adds touch controls |
| "3D" | Automatically installs Three.js |
