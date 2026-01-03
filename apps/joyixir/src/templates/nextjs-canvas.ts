/**
 * Next.js + Canvas 2D Game Template
 * Optimized for 2D arcade games with canvas rendering
 */

import { FileSystemTree } from '@webcontainer/api';

export const nextjsCanvasTemplate: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'joyixir-canvas-game',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev --turbo -p 3000',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
          },
          dependencies: {
            next: '^14.2.0',
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
          devDependencies: {
            typescript: '^5.4.0',
            '@types/node': '^20.0.0',
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            autoprefixer: '^10.4.0',
            postcss: '^8.4.0',
            tailwindcss: '^3.4.0',
          },
        },
        null,
        2
      ),
    },
  },
  'next.config.mjs': {
    file: {
      contents: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

export default nextConfig;
`,
    },
  },
  'tsconfig.json': {
    file: {
      contents: JSON.stringify(
        {
          compilerOptions: {
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
            paths: { '@/*': ['./src/*'] },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
          exclude: ['node_modules'],
        },
        null,
        2
      ),
    },
  },
  'tailwind.config.ts': {
    file: {
      contents: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
`,
    },
  },
  'postcss.config.mjs': {
    file: {
      contents: `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`,
    },
  },
  src: {
    directory: {
      app: {
        directory: {
          'layout.tsx': {
            file: {
              contents: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Canvas Game',
  description: 'Built with Joyixir',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">{children}</body>
    </html>
  )
}
`,
            },
          },
          'globals.css': {
            file: {
              contents: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
            },
          },
          'page.tsx': {
            file: {
              contents: `'use client';

import { GameCanvas } from '@/components/GameCanvas';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">Canvas Game</h1>
      <GameCanvas />
      <p className="mt-4 text-sm text-gray-400">
        Use arrow keys or WASD to move
      </p>
    </main>
  );
}
`,
            },
          },
        },
      },
      components: {
        directory: {
          'GameCanvas.tsx': {
            file: {
              contents: `'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

interface GameState {
  player: Player;
  score: number;
  isRunning: boolean;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 400,
      y: 300,
      width: 40,
      height: 40,
      speed: 5,
      color: '#8b5cf6',
    },
    score: 0,
    isRunning: true,
  });

  const keysPressed = useRef<Set<string>>(new Set());

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game update function
  const update = (deltaTime: number) => {
    if (!gameState.isRunning) return;

    setGameState(prev => {
      const newPlayer = { ...prev.player };
      const keys = keysPressed.current;

      // Movement
      if (keys.has('arrowup') || keys.has('w')) {
        newPlayer.y -= newPlayer.speed;
      }
      if (keys.has('arrowdown') || keys.has('s')) {
        newPlayer.y += newPlayer.speed;
      }
      if (keys.has('arrowleft') || keys.has('a')) {
        newPlayer.x -= newPlayer.speed;
      }
      if (keys.has('arrowright') || keys.has('d')) {
        newPlayer.x += newPlayer.speed;
      }

      // Keep player in bounds
      newPlayer.x = Math.max(0, Math.min(800 - newPlayer.width, newPlayer.x));
      newPlayer.y = Math.max(0, Math.min(600 - newPlayer.height, newPlayer.y));

      return {
        ...prev,
        player: newPlayer,
      };
    });
  };

  // Render function
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a4e';
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw player
    const { player } = gameState;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw player glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(\`Score: \${gameState.score}\`, 10, 30);
  };

  // Use game loop
  useGameLoop(update, render);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="rounded-lg border-2 border-violet-500/50 shadow-lg shadow-violet-500/20"
    />
  );
}
`,
            },
          },
        },
      },
      hooks: {
        directory: {
          'useGameLoop.ts': {
            file: {
              contents: `'use client';

import { useEffect, useRef } from 'react';

export function useGameLoop(
  update: (deltaTime: number) => void,
  render: () => void
) {
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      update(deltaTime);
      render();

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [update, render]);
}
`,
            },
          },
        },
      },
    },
  },
};
