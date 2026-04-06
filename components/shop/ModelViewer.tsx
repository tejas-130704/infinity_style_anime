'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Center, Grid } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import { X, RotateCcw, Maximize2, Minimize2, Info } from 'lucide-react'

/* ── STL mesh ──────────────────────────────────────────────────────────── */
function STLModel({ url, paused }: { url: string; paused: boolean }) {
  const geometry = useLoader(STLLoader, url)
  const meshRef  = useRef<THREE.Mesh>(null!)

  geometry.computeBoundingBox()
  const box  = geometry.boundingBox!
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale  = 2.5 / maxDim

  useFrame((_, delta) => {
    if (!paused && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.28
    }
  })

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial
          color="#c9b08c"
          roughness={0.3}
          metalness={0.65}
          envMapIntensity={1.4}
        />
      </mesh>
    </Center>
  )
}

/* ── Canvas loading overlay ─────────────────────────────────────────────── */
function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#16140f]">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-mugen-dark border-t-mugen-magenta" />
        <div className="absolute inset-0 animate-ping rounded-full border border-mugen-magenta/20" />
      </div>
      <p className="font-sans text-xs text-white/35 tracking-widest uppercase">Loading 3D model…</p>
    </div>
  )
}

/* ── No model placeholder ───────────────────────────────────────────────── */
function NoModelPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full
                      border border-white/8 bg-white/4 ring-4 ring-mugen-magenta/5">
        <svg className="h-12 w-12 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>
      <div>
        <p className="font-cinzel text-sm font-bold text-white/30 mb-1">No 3D Model Attached</p>
        <p className="font-sans text-xs text-white/20 max-w-xs leading-relaxed">
          This product doesn't have a 3D model file yet. Upload an STL file in the admin panel.
        </p>
      </div>
    </div>
  )
}

/* ── Control hint pill ──────────────────────────────────────────────────── */
function HintPill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/6 bg-white/4 px-2.5 py-1">
      <span className="text-[11px] text-white/35">{icon}</span>
      <span className="font-sans text-[10px] text-white/30">{label}</span>
    </div>
  )
}

/* ── Main ModelViewer ───────────────────────────────────────────────────── */
interface ModelViewerProps {
  modelUrl: string | null
  onClose: () => void
}

export function ModelViewer({ modelUrl, onClose }: ModelViewerProps) {
  const [resetKey,   setResetKey]   = useState(0)
  const [expanded,   setExpanded]   = useState(false)
  const [paused,     setPaused]     = useState(false)
  const [showInfo,   setShowInfo]   = useState(false)

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl
                  border border-mugen-magenta/30 bg-[#16140f]
                  shadow-[0_0_60px_rgba(184,77,122,0.12)]
                  transition-all duration-500
                  ${expanded ? 'fixed inset-4 z-50' : ''}`}
      style={expanded ? {} : { minHeight: 440 }}
    >
      {/* Ambient glow top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px
                   bg-gradient-to-r from-transparent via-mugen-magenta/50 to-transparent"
      />

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mugen-magenta/60 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mugen-magenta" />
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/50">
            Interactive 3D Viewer
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Info toggle */}
          <button
            id="model-viewer-info"
            onClick={() => setShowInfo(v => !v)}
            title="Controls info"
            className={`flex h-7 w-7 items-center justify-center rounded-lg border
                        transition-all
                        ${showInfo
                          ? 'border-mugen-gold/40 bg-mugen-gold/10 text-mugen-gold'
                          : 'border-white/8 bg-white/4 text-white/35 hover:border-mugen-gold/30 hover:text-white/60'
                        }`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>

          {/* Pause/play auto-rotate */}
          <button
            id="model-viewer-pause"
            onClick={() => setPaused(p => !p)}
            title={paused ? 'Resume rotation' : 'Pause rotation'}
            className="flex h-7 w-7 items-center justify-center rounded-lg border
                       border-white/8 bg-white/4 text-white/35 transition-all
                       hover:border-mugen-magenta/40 hover:text-white/70"
          >
            {paused ? (
              /* Play icon */
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            ) : (
              /* Pause icon */
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>

          {/* Reset */}
          <button
            id="model-viewer-reset"
            onClick={() => setResetKey(k => k + 1)}
            title="Reset view"
            className="flex h-7 w-7 items-center justify-center rounded-lg border
                       border-white/8 bg-white/4 text-white/35 transition-all
                       hover:border-mugen-magenta/40 hover:text-white/70"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen toggle */}
          <button
            id="model-viewer-expand"
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Exit fullscreen' : 'Fullscreen'}
            className="flex h-7 w-7 items-center justify-center rounded-lg border
                       border-white/8 bg-white/4 text-white/35 transition-all
                       hover:border-mugen-gold/30 hover:text-white/70"
          >
            {expanded
              ? <Minimize2 className="h-3.5 w-3.5" />
              : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Close */}
          <button
            id="model-viewer-close"
            onClick={onClose}
            title="Close 3D view"
            className="flex h-7 w-7 items-center justify-center rounded-lg border
                       border-white/8 bg-white/4 text-white/35 transition-all
                       hover:border-red-500/40 hover:bg-red-950/20 hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Controls info panel ── */}
      {showInfo && (
        <div className="flex flex-wrap gap-2 border-b border-white/6 px-4 py-2.5 bg-white/2">
          <HintPill icon="⟳" label="Drag — Rotate 360°" />
          <HintPill icon="⊕" label="Scroll — Zoom in/out" />
          <HintPill icon="↔" label="Shift+Drag — Pan" />
          <HintPill icon="⟲" label="Double-click — Reset" />
        </div>
      )}

      {/* ── Canvas area ── */}
      <div className="relative flex-1" style={{ minHeight: 360 }}>
        {modelUrl ? (
          <Suspense fallback={<CanvasLoader />}>
            <Canvas
              key={resetKey}
              camera={{ position: [0, 1.8, 5], fov: 48 }}
              shadows
              gl={{ antialias: true, alpha: false }}
              dpr={[1, 2]}
              className="w-full h-full"
            >
              <color attach="background" args={['#16140f']} />

              {/* Lighting */}
              <ambientLight intensity={0.55} />
              <directionalLight
                position={[5, 9, 5]}
                intensity={2.0}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <pointLight position={[-4, 4, -4]} intensity={1.0} color="#b84d7a" />
              <pointLight position={[4, -2, 4]} intensity={0.7} color="#c6a86c" />
              <pointLight position={[0, 8, 0]} intensity={0.4} color="#ffffff" />

              {/* Model */}
              <Suspense fallback={null}>
                <STLModel url={modelUrl} paused={paused} />
                <Environment preset="studio" />
              </Suspense>

              {/* Grid floor */}
              <Grid
                receiveShadow
                infiniteGrid
                cellSize={0.4}
                cellThickness={0.4}
                sectionSize={2}
                sectionThickness={0.8}
                sectionColor="#863841"
                cellColor="#252320"
                fadeDistance={14}
                fadeStrength={1.8}
                position={[0, -1.5, 0]}
              />

              <OrbitControls
                makeDefault
                enablePan
                enableZoom
                enableRotate
                minDistance={1.5}
                maxDistance={12}
                autoRotate={false}
                dampingFactor={0.06}
                enableDamping
              />
            </Canvas>
          </Suspense>
        ) : (
          <NoModelPlaceholder />
        )}
      </div>

      {/* ── Footer badge strip ── */}
      {modelUrl && (
        <div className="flex items-center justify-center gap-4 border-t border-white/5 px-4 py-2 flex-shrink-0">
          {[
            { dot: 'bg-green-400', label: 'STL Loaded' },
            { dot: 'bg-mugen-gold', label: '360° Rotation' },
            { dot: 'bg-blue-400', label: 'Zoom & Pan' },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              <span className="font-sans text-[10px] text-white/25">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
