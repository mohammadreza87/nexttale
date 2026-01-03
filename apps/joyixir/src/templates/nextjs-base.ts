import { FileSystemTree } from '@webcontainer/api';

/**
 * World-class Next.js template inspired by royal-match-prototype
 * Features:
 * - Next.js 14 App Router
 * - TypeScript with strict mode
 * - GSAP animations
 * - Three.js / React Three Fiber
 * - Tailwind CSS
 * - shadcn/ui ready
 * - Professional component architecture
 */

// =============================================================================
// PACKAGE.JSON
// =============================================================================
const packageJson = {
  name: 'joyixir-app',
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint',
  },
  dependencies: {
    next: '^14.2.0',
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    gsap: '^3.12.5',
    '@react-three/fiber': '^8.16.0',
    '@react-three/drei': '^9.105.0',
    three: '^0.164.0',
    clsx: '^2.1.1',
    'tailwind-merge': '^2.3.0',
    'lucide-react': '^0.378.0',
    'class-variance-authority': '^0.7.0',
  },
  devDependencies: {
    '@types/node': '^20',
    '@types/react': '^18',
    '@types/react-dom': '^18',
    '@types/three': '^0.164.0',
    typescript: '^5',
    tailwindcss: '^3.4.0',
    postcss: '^8',
    autoprefixer: '^10',
    eslint: '^8',
    'eslint-config-next': '^14.2.0',
  },
};

// =============================================================================
// NEXT.JS CONFIG
// =============================================================================
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap'],
  },
};

module.exports = nextConfig;
`;

// =============================================================================
// TYPESCRIPT CONFIG
// =============================================================================
const tsConfig = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

// =============================================================================
// TAILWIND CONFIG
// =============================================================================
const tailwindConfig = `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          muted: '#a78bfa',
        },
        // Semantic colors
        bg: {
          page: '#0a0a0a',
          card: '#141414',
          muted: '#1f1f1f',
          inverse: '#ffffff',
        },
        text: {
          primary: '#fafafa',
          secondary: '#a3a3a3',
          muted: '#737373',
          inverse: '#0a0a0a',
        },
        border: {
          DEFAULT: '#262626',
          strong: '#404040',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
`;

// =============================================================================
// POSTCSS CONFIG
// =============================================================================
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

// =============================================================================
// GLOBAL CSS
// =============================================================================
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-inter: 'Inter', system-ui, sans-serif;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  background: #0a0a0a;
  color: #fafafa;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #141414;
}

::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #525252;
}

/* Selection */
::selection {
  background: rgba(139, 92, 246, 0.3);
}
`;

// =============================================================================
// ROOT LAYOUT
// =============================================================================
const rootLayout = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Joyixir App',
  description: 'Built with Joyixir - The magic potion for building apps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg-page text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;

// =============================================================================
// MAIN PAGE
// =============================================================================
const mainPage = `'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Layers } from 'lucide-react';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.from(heroRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Cards stagger animation
      gsap.from('.feature-card', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-sm text-brand-muted">Welcome to Your App</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-white via-brand-muted to-brand bg-clip-text text-transparent">
              Build Something
            </span>
            <br />
            <span className="text-white">Amazing</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
            Start with this template and customize it to build your next great project.
            Everything you need is already set up and ready to go.
          </p>

          <div className="flex justify-center gap-4">
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={cardsRef} className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Everything You Need
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">GSAP Animations</h3>
              <p className="text-text-secondary">
                Smooth, professional animations powered by GSAP for delightful interactions.
              </p>
            </Card>

            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Three.js Ready</h3>
              <p className="text-text-secondary">
                Create stunning 3D experiences with React Three Fiber integration.
              </p>
            </Card>

            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Next.js 14</h3>
              <p className="text-text-secondary">
                Built on the latest Next.js with App Router for optimal performance.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
`;

// =============================================================================
// PROVIDERS
// =============================================================================
const providers = `'use client';

import { NavigationProvider } from '@/store/navigation-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      {children}
    </NavigationProvider>
  );
}
`;

// =============================================================================
// NAVIGATION CONTEXT
// =============================================================================
const navigationContext = `'use client';

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';

// Types
export type PageId = 'home' | 'about' | 'contact' | 'dashboard' | 'settings';
export type ModalId = 'confirm' | 'info' | 'settings' | 'profile';

interface NavigationState {
  currentPage: PageId;
  previousPage: PageId | null;
  modalStack: ModalId[];
  pageParams: Record<string, unknown>;
  modalParams: Record<string, unknown>;
}

type NavigationAction =
  | { type: 'NAVIGATE'; payload: { page: PageId; params?: Record<string, unknown> } }
  | { type: 'GO_BACK' }
  | { type: 'OPEN_MODAL'; payload: { modal: ModalId; params?: Record<string, unknown> } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CLOSE_ALL_MODALS' };

// Initial State
const initialState: NavigationState = {
  currentPage: 'home',
  previousPage: null,
  modalStack: [],
  pageParams: {},
  modalParams: {},
};

// Reducer
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NAVIGATE':
      return {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload.page,
        pageParams: action.payload.params || {},
        modalStack: [],
        modalParams: {},
      };

    case 'GO_BACK':
      if (!state.previousPage) return state;
      return {
        ...state,
        currentPage: state.previousPage,
        previousPage: null,
        pageParams: {},
        modalStack: [],
        modalParams: {},
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        modalStack: [...state.modalStack, action.payload.modal],
        modalParams: action.payload.params || state.modalParams,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modalStack: state.modalStack.slice(0, -1),
      };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modalStack: [],
        modalParams: {},
      };

    default:
      return state;
  }
}

// Context
interface NavigationContextValue {
  state: NavigationState;
  navigate: (page: PageId, params?: Record<string, unknown>) => void;
  goBack: () => void;
  openModal: (modal: ModalId, params?: Record<string, unknown>) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  currentModal: ModalId | null;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// Provider
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  const navigate = useCallback((page: PageId, params?: Record<string, unknown>) => {
    dispatch({ type: 'NAVIGATE', payload: { page, params } });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const openModal = useCallback((modal: ModalId, params?: Record<string, unknown>) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal, params } });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const closeAllModals = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_MODALS' });
  }, []);

  const currentModal = state.modalStack[state.modalStack.length - 1] || null;
  const canGoBack = state.previousPage !== null;

  return (
    <NavigationContext.Provider
      value={{
        state,
        navigate,
        goBack,
        openModal,
        closeModal,
        closeAllModals,
        currentModal,
        canGoBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// Hook
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
`;

// =============================================================================
// GSAP ANIMATION HOOKS
// =============================================================================
const gsapAnimationHooks = `'use client';

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

export type AnimationType = 'slideDown' | 'slideUp' | 'slideLeft' | 'slideRight' | 'fadeIn' | 'scale';

interface AnimationConfig {
  duration?: number;
  ease?: string;
  delay?: number;
}

const defaultConfig: AnimationConfig = {
  duration: 0.4,
  ease: 'power3.out',
  delay: 0,
};

/**
 * Hook for modal open/close animations
 */
export function useModalAnimation(isOpen: boolean, config: AnimationConfig = {}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const duration = config.duration ?? defaultConfig.duration ?? 0.4;
  const ease = config.ease ?? defaultConfig.ease ?? 'power3.out';
  const delay = config.delay ?? defaultConfig.delay ?? 0;

  useEffect(() => {
    if (!overlayRef.current || !contentRef.current) return;

    const overlay = overlayRef.current;
    const content = contentRef.current;

    if (isOpen) {
      gsap.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: duration * 0.6, ease: 'power2.out' }
      );
      gsap.fromTo(
        content,
        { y: -100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration, ease, delay }
      );
    }
  }, [isOpen, duration, ease, delay]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      if (!overlayRef.current || !contentRef.current) {
        onComplete?.();
        return;
      }

      const overlay = overlayRef.current;
      const content = contentRef.current;

      gsap.to(content, {
        y: -80,
        opacity: 0,
        scale: 0.95,
        duration: duration * 0.7,
        ease: 'power3.in',
      });
      gsap.to(overlay, {
        opacity: 0,
        duration: duration * 0.5,
        delay: duration * 0.2,
        ease: 'power2.in',
        onComplete,
      });
    },
    [duration]
  );

  return { overlayRef, contentRef, animateOut };
}

/**
 * Hook for tab change animations
 */
export function useTabAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number>(0);

  const animateTabChange = useCallback((newIndex: number, contentElement: HTMLElement | null) => {
    if (!contentElement) return;

    const prevIndex = prevIndexRef.current;
    const direction = newIndex > prevIndex ? 1 : -1;
    prevIndexRef.current = newIndex;

    gsap.fromTo(
      contentElement,
      { x: direction * 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
  }, []);

  return { containerRef, animateTabChange };
}

/**
 * Hook for slide animations
 */
export function useSlideAnimation() {
  const elementRef = useRef<HTMLDivElement>(null);

  const slideIn = useCallback(
    (fromDirection: 'left' | 'right' | 'top' | 'bottom' = 'right') => {
      if (!elementRef.current) return;

      const axis = fromDirection === 'left' || fromDirection === 'right' ? 'x' : 'y';
      const distance = fromDirection === 'left' || fromDirection === 'top' ? -50 : 50;

      gsap.fromTo(
        elementRef.current,
        { [axis]: distance, opacity: 0 },
        { [axis]: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    },
    []
  );

  const slideOut = useCallback(
    (toDirection: 'left' | 'right' | 'top' | 'bottom' = 'left', onComplete?: () => void) => {
      if (!elementRef.current) {
        onComplete?.();
        return;
      }

      const axis = toDirection === 'left' || toDirection === 'right' ? 'x' : 'y';
      const distance = toDirection === 'left' || toDirection === 'top' ? -50 : 50;

      gsap.to(elementRef.current, {
        [axis]: distance,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete,
      });
    },
    []
  );

  return { elementRef, slideIn, slideOut };
}

/**
 * Hook for stagger animations
 */
export function useStaggerAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const animateChildren = useCallback((selector: string = '.stagger-item') => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current.querySelectorAll(selector),
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
      }
    );
  }, []);

  return { containerRef, animateChildren };
}
`;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const utilsCn = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

// =============================================================================
// UI COMPONENTS - BUTTON
// =============================================================================
const buttonComponent = `import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white hover:bg-brand-hover active:scale-[0.98]',
        outline: 'border-2 border-border bg-transparent text-text-primary hover:bg-bg-muted active:scale-[0.98]',
        ghost: 'bg-transparent text-text-primary hover:bg-bg-muted',
        secondary: 'bg-bg-muted text-text-primary hover:bg-border',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-13 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
`;

// =============================================================================
// UI COMPONENTS - CARD
// =============================================================================
const cardComponent = `import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl border border-border bg-bg-card p-6 transition-all hover:border-border-strong',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mb-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold text-text-primary', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-text-secondary', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
`;

// =============================================================================
// UI COMPONENTS - MODAL
// =============================================================================
const modalComponent = `'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  title,
  showCloseButton = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  // Animate in on open
  useEffect(() => {
    if (!isOpen || !overlayRef.current || !contentRef.current) return;

    const overlay = overlayRef.current;
    const content = contentRef.current;

    gsap.set(overlay, { opacity: 0 });
    gsap.set(content, { y: -80, opacity: 0, scale: 0.92 });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
    });
    gsap.to(content, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.2)',
      delay: 0.05,
    });
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (!overlayRef.current || !contentRef.current) {
      onClose();
      return;
    }

    const overlay = overlayRef.current;
    const content = contentRef.current;

    gsap.to(content, {
      y: -60,
      opacity: 0,
      scale: 0.95,
      duration: 0.25,
      ease: 'power3.in',
    });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.2,
      delay: 0.1,
      ease: 'power2.in',
      onComplete: () => {
        isAnimatingRef.current = false;
        onClose();
      },
    });
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={cn(
          'w-full max-w-md mx-4 bg-bg-card rounded-2xl border border-border overflow-hidden',
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-text-muted hover:bg-bg-muted hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
`;

// =============================================================================
// STORE INDEX
// =============================================================================
const storeIndex = `export { NavigationProvider, useNavigation } from './navigation-context';
export type { PageId, ModalId } from './navigation-context';
`;

// =============================================================================
// HOOKS INDEX
// =============================================================================
const hooksIndex = `export {
  useModalAnimation,
  useTabAnimation,
  useSlideAnimation,
  useStaggerAnimation,
} from './use-gsap-animation';
`;

// =============================================================================
// COMPONENTS UI INDEX
// =============================================================================
const componentsUiIndex = `export { Button, buttonVariants, type ButtonProps } from './button';
export { Card, CardHeader, CardTitle, CardContent } from './card';
export { Modal } from './modal';
`;

// =============================================================================
// LIB INDEX
// =============================================================================
const libIndex = `export { cn } from './utils';
`;

// =============================================================================
// NEXT-ENV.D.TS (Required for TypeScript)
// =============================================================================
const nextEnvDts = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`;

// =============================================================================
// .NPMRC (Better npm compatibility in WebContainer)
// =============================================================================
const npmrc = `legacy-peer-deps=true
auto-install-peers=true
`;

// =============================================================================
// .ESLINTRC.JSON
// =============================================================================
const eslintrc = `{
  "extends": "next/core-web-vitals"
}
`;

// =============================================================================
// BUILD FILE TREE
// =============================================================================
export const nextjsBaseTemplate: FileSystemTree = {
  'package.json': {
    file: { contents: JSON.stringify(packageJson, null, 2) },
  },
  'next.config.js': {
    file: { contents: nextConfig },
  },
  'tsconfig.json': {
    file: { contents: tsConfig },
  },
  'tailwind.config.ts': {
    file: { contents: tailwindConfig },
  },
  'postcss.config.js': {
    file: { contents: postcssConfig },
  },
  'next-env.d.ts': {
    file: { contents: nextEnvDts },
  },
  '.npmrc': {
    file: { contents: npmrc },
  },
  '.eslintrc.json': {
    file: { contents: eslintrc },
  },
  src: {
    directory: {
      app: {
        directory: {
          'globals.css': {
            file: { contents: globalsCss },
          },
          'layout.tsx': {
            file: { contents: rootLayout },
          },
          'page.tsx': {
            file: { contents: mainPage },
          },
        },
      },
      components: {
        directory: {
          'providers.tsx': {
            file: { contents: providers },
          },
          ui: {
            directory: {
              'button.tsx': {
                file: { contents: buttonComponent },
              },
              'card.tsx': {
                file: { contents: cardComponent },
              },
              'modal.tsx': {
                file: { contents: modalComponent },
              },
              'index.ts': {
                file: { contents: componentsUiIndex },
              },
            },
          },
        },
      },
      hooks: {
        directory: {
          'use-gsap-animation.ts': {
            file: { contents: gsapAnimationHooks },
          },
          'index.ts': {
            file: { contents: hooksIndex },
          },
        },
      },
      lib: {
        directory: {
          'utils.ts': {
            file: { contents: utilsCn },
          },
          'index.ts': {
            file: { contents: libIndex },
          },
        },
      },
      store: {
        directory: {
          'navigation-context.tsx': {
            file: { contents: navigationContext },
          },
          'index.ts': {
            file: { contents: storeIndex },
          },
        },
      },
    },
  },
};
