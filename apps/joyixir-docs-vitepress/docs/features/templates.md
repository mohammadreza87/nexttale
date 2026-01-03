# Templates

Start faster with pre-built game templates.

## Available Templates

### Vite + shadcn/ui (Default)
Fast React app with beautiful UI components.

**Includes:**
- Vite for instant hot reload
- shadcn/ui components
- Tailwind CSS
- TypeScript

**Best for:** UI apps, tools, simple games

### Canvas 2D
HTML5 Canvas with optimized game loop.

**Includes:**
- Rendering pipeline
- Input handling (keyboard, mouse, touch)
- Collision detection helpers
- Score overlays

**Best for:** Snake, Pong, Breakout, arcade games

### Three.js
React Three Fiber for 3D experiences.

**Includes:**
- 3D scene setup
- Orbit controls
- Lighting and materials
- Model loading

**Best for:** 3D games, visualizations, WebGL

## Auto-Detection

Joyixir automatically upgrades to Three.js when you use:

- "3D", "three.js", "WebGL"
- "first-person", "third-person"
- "3D models", "3D scene"
- "orbit controls", "perspective camera"

## Project Structure

All templates follow this structure:

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Root component
├── index.css         # Tailwind styles
├── pages/
│   └── Index.tsx     # Main game page
├── components/
│   └── ui/           # shadcn components
├── hooks/            # Custom hooks
└── lib/
    └── utils.ts      # Utilities
```

## Choosing a Template

| Use Case | Template |
|----------|----------|
| Simple UI apps | Vite + shadcn |
| 2D arcade games | Canvas 2D |
| 3D experiences | Three.js |
