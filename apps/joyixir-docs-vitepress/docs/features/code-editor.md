# Code Editor

Full Monaco editor with syntax highlighting and file browser.

## Accessing Code View

Click the **Code** tab in the preview header to switch from Preview to Code view. The Code view shows:

- **File Browser** (left) - Browse all project files
- **Code Editor** (right) - Edit the selected file

Click **Preview** tab to return to the live preview.

## Features

- Syntax highlighting for TypeScript, CSS, JSON
- IntelliSense autocomplete
- Error highlighting
- Line numbers and minimap
- File browser with folder navigation
- Auto-save on edit

## File Browser

The file browser panel shows your project structure:

- Click a file to open it in the editor
- Files are organized by folders
- Common files: `src/`, `package.json`, `index.html`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save file |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + F` | Find |
| `Cmd/Ctrl + /` | Toggle comment |

## When to Edit Code

Most of the time, just talk to the AI. But manual editing is useful for:

- Small tweaks (colors, sizes, text)
- Debugging issues
- Learning how the code works
- Fine-tuning AI-generated code

::: tip Read-Only Warning
In Code view, you'll see a "Read only" indicator. This is a reminder that the AI generates code - you can still edit, but changes may be overwritten by AI responses.
:::
