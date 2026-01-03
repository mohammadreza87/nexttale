import { FileSystemTree } from '@webcontainer/api';
import { nextjsBaseTemplate } from './nextjs-base';
import { nextjsThreeJsTemplate } from './nextjs-threejs';
import { nextjsCanvasTemplate } from './nextjs-canvas';
import { nextjsPhaserTemplate } from './nextjs-phaser';
import { viteShadcnTemplate } from './vite-shadcn';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'starter' | 'game' | 'app' | '3d' | 'visualization';
  tags: string[];
  files: FileSystemTree;
  framework: 'nextjs' | 'vite';
}

// =============================================================================
// VITE TEMPLATES (Primary - Faster builds, simpler structure)
// =============================================================================

export const viteStarterTemplate: ProjectTemplate = {
  id: 'vite-starter',
  name: 'Vite + shadcn/ui',
  description: 'Fast React app with shadcn/ui components',
  icon: '⚡',
  category: 'starter',
  tags: ['vite', 'react', 'shadcn', 'tailwind', 'typescript'],
  files: viteShadcnTemplate,
  framework: 'vite',
};

// =============================================================================
// NEXT.JS TEMPLATES (For more complex apps)
// =============================================================================

export const nextjsStarterTemplate: ProjectTemplate = {
  id: 'nextjs-starter',
  name: 'Next.js Pro',
  description: 'Professional Next.js 14 + GSAP + Tailwind',
  icon: '🚀',
  category: 'app',
  tags: ['nextjs', 'gsap', 'tailwind', 'typescript', 'professional'],
  files: nextjsBaseTemplate,
  framework: 'nextjs',
};

export const nextjsThreeTemplate: ProjectTemplate = {
  id: 'nextjs-threejs',
  name: 'Three.js 3D',
  description: '3D experiences with React Three Fiber',
  icon: '🎮',
  category: '3d',
  tags: ['nextjs', 'threejs', 'r3f', 'gsap', '3d', 'webgl'],
  files: nextjsThreeJsTemplate,
  framework: 'nextjs',
};

export const nextjsCanvasGameTemplate: ProjectTemplate = {
  id: 'nextjs-canvas',
  name: 'Canvas 2D',
  description: 'Fast 2D arcade games with HTML5 Canvas',
  icon: '🕹️',
  category: 'game',
  tags: ['nextjs', 'canvas', '2d', 'arcade', 'game-loop'],
  files: nextjsCanvasTemplate,
  framework: 'nextjs',
};

export const nextjsPhaserGameTemplate: ProjectTemplate = {
  id: 'nextjs-phaser',
  name: 'Phaser 3',
  description: 'Full-featured 2D games with Phaser 3',
  icon: '👾',
  category: 'game',
  tags: ['nextjs', 'phaser', '2d', 'platformer', 'physics'],
  files: nextjsPhaserTemplate,
  framework: 'nextjs',
};

// =============================================================================
// ALL TEMPLATES
// =============================================================================

export const templates: ProjectTemplate[] = [
  viteStarterTemplate,
  nextjsCanvasGameTemplate,
  nextjsPhaserGameTemplate,
  nextjsThreeTemplate,
  nextjsStarterTemplate,
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: ProjectTemplate['category']
): ProjectTemplate[] {
  return templates.filter((t) => t.category === category);
}

// Re-export for convenience
export { viteShadcnTemplate } from './vite-shadcn';
export { nextjsBaseTemplate } from './nextjs-base';
export { nextjsThreeJsTemplate } from './nextjs-threejs';
export { nextjsCanvasTemplate } from './nextjs-canvas';
export { nextjsPhaserTemplate } from './nextjs-phaser';
