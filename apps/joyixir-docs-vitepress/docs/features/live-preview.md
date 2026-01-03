# Live Preview

See your game running in real-time with responsive device previews.

## Features

- **Instant Updates**: Changes appear in seconds
- **Hot Reload**: No page refresh needed
- **Device Preview**: Test on Desktop, Tablet, and Mobile sizes
- **Refresh Button**: Force refresh the preview
- **Full Screen**: Toggle fullscreen mode (coming soon)

## Device Toggles

Test how your game looks on different screen sizes without leaving the builder:

| Device | Size | Best For |
|--------|------|----------|
| **Desktop** | Full width | PC/Mac games |
| **Tablet** | 768px | iPad-style games |
| **Mobile** | 375px | Phone games |

Click the device icons in the preview header to switch between views.

::: tip Mobile-First
Building a mobile game? Start with the Mobile preview and work your way up to Desktop.
:::

## How It Works

Joyixir uses [WebContainer](https://webcontainers.io/) to run a full Node.js environment in your browser. Your code runs locally - nothing is sent to a server.

The preview panel is completely separate from the chat panel, with its own header containing:
- **Preview/Code tabs** - Switch between live preview and code editor
- **Device toggles** - Desktop, Tablet, Mobile views
- **Refresh button** - Force reload the preview
- **Action buttons** - Share, Upgrade, Publish

## Troubleshooting

### Preview Not Loading?

1. Check the terminal for errors (click "Terminal" at the bottom)
2. Make sure your code compiles
3. Try clicking the refresh button in the device toggles
4. Check if the WebContainer is still booting (see status in bottom bar)

### Preview Shows Wrong Size?

Click the device toggle button that matches your target device. The preview will resize automatically.

### Performance Issues?

Complex games may run slower in the preview. Export and run locally for best performance.
