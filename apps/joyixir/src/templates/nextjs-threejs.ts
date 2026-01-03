import { FileSystemTree } from '@webcontainer/api';
import { nextjsBaseTemplate } from './nextjs-base';

/**
 * Next.js + Three.js / React Three Fiber template
 * Extends the base template with 3D capabilities
 */

// =============================================================================
// THREE.JS SCENE COMPONENT
// =============================================================================
const threeScene = `'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedBox({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        scale={clicked ? 1.5 : 1}
        onClick={() => setClicked(!clicked)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hovered ? '#a855f7' : '#8b5cf6'}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

function AnimatedSphere({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={hovered ? '#22d3ee' : '#06b6d4'}
        metalness={0.8}
        roughness={0.1}
      />
    </mesh>
  );
}

function AnimatedTorus({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.8;
      meshRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.6, 0.2, 16, 32]} />
        <meshStandardMaterial
          color="#ec4899"
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#8b5cf6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function ThreeScene() {
  return (
    <div className="h-screen w-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#a855f7" />

        {/* Environment */}
        <Environment preset="city" />

        {/* Background */}
        <color attach="background" args={['#0a0a0a']} />

        {/* Particles */}
        <ParticleField />

        {/* 3D Objects */}
        <AnimatedBox position={[-2, 0, 0]} />
        <AnimatedSphere position={[0, 0, 0]} />
        <AnimatedTorus position={[2, 0, 0]} />
      </Canvas>
    </div>
  );
}
`;

// =============================================================================
// THREE.JS PAGE
// =============================================================================
const threeJsPage = `'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import to avoid SSR issues with Three.js
const ThreeScene = dynamic(
  () => import('@/components/three/scene').then((mod) => mod.ThreeScene),
  { ssr: false }
);

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg-page">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
        <p className="text-text-secondary">Loading 3D Scene...</p>
      </div>
    </div>
  );
}

export default function ThreePage() {
  return (
    <main className="relative">
      <Suspense fallback={<LoadingScreen />}>
        <ThreeScene />
      </Suspense>

      {/* Overlay UI */}
      <div className="absolute inset-x-0 top-0 p-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Interactive 3D Experience
          </h1>
          <p className="mt-2 text-text-secondary">
            Click and drag to orbit • Scroll to zoom • Click objects to interact
          </p>
        </div>
      </div>
    </main>
  );
}
`;

// =============================================================================
// UPDATED MAIN PAGE WITH 3D LINK
// =============================================================================
const updatedMainPage = `'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Layers, Box } from 'lucide-react';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

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
            <span className="text-sm text-brand-muted">Next.js + Three.js + GSAP</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-white via-brand-muted to-brand bg-clip-text text-transparent">
              Build Immersive
            </span>
            <br />
            <span className="text-white">3D Experiences</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
            Create stunning 3D web experiences with React Three Fiber,
            beautiful animations with GSAP, and the power of Next.js.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/three">
              <Button size="lg">
                <Box className="mr-2 h-5 w-5" />
                View 3D Demo
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Powerful Stack
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">GSAP</h3>
              <p className="text-text-secondary">
                Professional-grade animations
              </p>
            </Card>

            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Three.js</h3>
              <p className="text-text-secondary">
                3D graphics with R3F
              </p>
            </Card>

            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Next.js 14</h3>
              <p className="text-text-secondary">
                App Router & RSC
              </p>
            </Card>

            <Card className="feature-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <Box className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">TypeScript</h3>
              <p className="text-text-secondary">
                Full type safety
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
// COMPONENTS INDEX
// =============================================================================
const threeComponentsIndex = `export { ThreeScene } from './scene';
`;

// =============================================================================
// BUILD FILE TREE
// =============================================================================

// Deep clone the base template
function deepClone(obj: FileSystemTree): FileSystemTree {
  return JSON.parse(JSON.stringify(obj));
}

export const nextjsThreeJsTemplate: FileSystemTree = (() => {
  const template = deepClone(nextjsBaseTemplate);

  // Get src directory
  const srcDir = template.src as { directory: FileSystemTree };
  const appDir = srcDir.directory.app as { directory: FileSystemTree };
  const componentsDir = srcDir.directory.components as { directory: FileSystemTree };

  // Update main page
  appDir.directory['page.tsx'] = {
    file: { contents: updatedMainPage },
  };

  // Add three page
  appDir.directory.three = {
    directory: {
      'page.tsx': {
        file: { contents: threeJsPage },
      },
    },
  };

  // Add three components
  componentsDir.directory.three = {
    directory: {
      'scene.tsx': {
        file: { contents: threeScene },
      },
      'index.ts': {
        file: { contents: threeComponentsIndex },
      },
    },
  };

  return template;
})();
