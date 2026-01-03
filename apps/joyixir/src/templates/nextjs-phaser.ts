/**
 * Next.js + Phaser 3 Game Template
 * Full-featured 2D game development with Phaser
 */

import { FileSystemTree } from '@webcontainer/api';

export const nextjsPhaserTemplate: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'joyixir-phaser-game',
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
            phaser: '^3.80.0',
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
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
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
  title: 'Phaser Game',
  description: 'Built with Joyixir + Phaser 3',
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

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-[800px] items-center justify-center rounded-lg bg-gray-800">
      <p className="text-gray-400">Loading game...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">Phaser Game</h1>
      <PhaserGame />
      <p className="mt-4 text-sm text-gray-400">
        Use arrow keys or WASD to move • Click to interact
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
          'PhaserGame.tsx': {
            file: {
              contents: `'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '@/game/scenes/MainScene';

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: false,
        },
      },
      scene: [MainScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border-2 border-violet-500/50 shadow-lg shadow-violet-500/20"
    />
  );
}
`,
            },
          },
        },
      },
      game: {
        directory: {
          scenes: {
            directory: {
              'MainScene.ts': {
                file: {
                  contents: `import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private stars!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create simple graphics for game objects
    this.createPlayerGraphic();
    this.createPlatformGraphic();
    this.createStarGraphic();
  }

  create() {
    // Create platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    this.platforms.create(400, 580, 'platform').setScale(4, 0.5).refreshBody();

    // Floating platforms
    this.platforms.create(600, 400, 'platform');
    this.platforms.create(50, 250, 'platform');
    this.platforms.create(750, 220, 'platform');
    this.platforms.create(400, 300, 'platform');

    // Create player
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Create stars
    this.stars = this.physics.add.group({
      key: 'star',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate((child) => {
      const star = child as Phaser.Physics.Arcade.Sprite;
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      return true;
    });

    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'monospace',
    });

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this
    );

    // Controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // WASD support
    this.input.keyboard!.addKeys('W,A,S,D');
  }

  update() {
    const keys = this.input.keyboard!;
    const left = this.cursors.left?.isDown || keys.checkDown(keys.addKey('A'));
    const right = this.cursors.right?.isDown || keys.checkDown(keys.addKey('D'));
    const up = this.cursors.up?.isDown || keys.checkDown(keys.addKey('W'));

    if (left) {
      this.player.setVelocityX(-160);
    } else if (right) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (up && this.player.body?.touching.down) {
      this.player.setVelocityY(-330);
    }
  }

  private collectStar(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    star: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    const starSprite = star as Phaser.Physics.Arcade.Sprite;
    starSprite.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    // Respawn stars when all collected
    if (this.stars.countActive(true) === 0) {
      this.stars.children.iterate((child) => {
        const s = child as Phaser.Physics.Arcade.Sprite;
        s.enableBody(true, s.x, 0, true, true);
        return true;
      });
    }
  }

  private createPlayerGraphic() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x8b5cf6);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture('player', 32, 48);
    graphics.destroy();
  }

  private createPlatformGraphic() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x4a5568);
    graphics.fillRect(0, 0, 100, 20);
    graphics.generateTexture('platform', 100, 20);
    graphics.destroy();
  }

  private createStarGraphic() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xfbbf24);
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('star', 24, 24);
    graphics.destroy();
  }
}
`,
                },
              },
            },
          },
        },
      },
    },
  },
};
