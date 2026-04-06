'use client'

import { useState, useRef, useCallback, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ─────────────────────────────────────────────
   CONSTANTS & TYPES
───────────────────────────────────────────── */

type MaterialId = 'PLA' | 'PETG' | 'PLA+'

interface MaterialOption {
  id: MaterialId
  label: string
  desc: string
  density: number   // g/cm³
  rate: number      // ₹ per gram
  colors: string[]
}

const MATERIALS: MaterialOption[] = [
  {
    id: 'PLA',
    label: 'PLA',
    desc: 'Lightweight & affordable',
    density: 1.24,
    rate: 5,
    colors: ['#111111', '#f97316', '#3b82f6', '#facc15', '#22c55e', '#ef4444', '#9ca3af', '#d1d5db', '#ffffff', '#a855f7'],
  },
  {
    id: 'PETG',
    label: 'PETG',
    desc: 'Flexible & heat-resistant',
    density: 1.27,
    rate: 9,
    colors: ['#111111', '#3b82f6', '#f97316', '#ffffff', '#d97706', '#ef4444'],
  },
  {
    id: 'PLA+',
    label: 'PLA+',
    desc: 'Enhanced strength & detail',
    density: 1.25,
    rate: 6,
    colors: ['#111111', '#ffffff', '#9ca3af', '#ef4444', '#22c55e', '#3b82f6', '#facc15'],
  },
]

const INFILL_OPTIONS = [10, 15, 20, 30, 40, 50, 60, 70, 80, 90]
const GST_RATE = 0.18

/* ─────────────────────────────────────────────
   STL PARSING ENGINE
───────────────────────────────────────────── */

interface ModelStats {
  volumeCm3: number
  dimensions: { x: number; y: number; z: number } // in cm
  weightG: number
}

/**
 * Compute signed volume using the signed tetrahedron method.
 * Works for any closed mesh regardless of convexity.
 * Units: same as geometry position units (mm³ for most STLs)
 */
function computeSignedVolume(geometry: THREE.BufferGeometry): number {
  const pos = geometry.getAttribute('position')
  if (!pos) return 0
  let volume = 0
  const v1 = new THREE.Vector3()
  const v2 = new THREE.Vector3()
  const v3 = new THREE.Vector3()

  for (let i = 0; i < pos.count; i += 3) {
    v1.fromBufferAttribute(pos, i)
    v2.fromBufferAttribute(pos, i + 1)
    v3.fromBufferAttribute(pos, i + 2)
    // signed tetrahedron volume: (v1 · (v2 × v3)) / 6
    volume += v1.dot(v2.clone().cross(v3)) / 6
  }
  return Math.abs(volume)
}

function parseSTLBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
  // Detect binary vs ASCII STL
  const isBinary = (() => {
    const header = new Uint8Array(buffer, 0, 80)
    const decoder = new TextDecoder()
    const text = decoder.decode(header).trimStart()
    if (text.startsWith('solid')) {
      // Could still be binary — check triangle count
      const view = new DataView(buffer)
      const triCount = view.getUint32(80, true)
      const expectedSize = 84 + triCount * 50
      return buffer.byteLength === expectedSize
    }
    return true
  })()

  const geo = new THREE.BufferGeometry()

  if (isBinary) {
    const view = new DataView(buffer)
    const triCount = view.getUint32(80, true)
    const positions: number[] = []
    const normals: number[] = []

    for (let i = 0; i < triCount; i++) {
      const offset = 84 + i * 50
      const nx = view.getFloat32(offset, true)
      const ny = view.getFloat32(offset + 4, true)
      const nz = view.getFloat32(offset + 8, true)

      for (let v = 0; v < 3; v++) {
        const vOffset = offset + 12 + v * 12
        positions.push(
          view.getFloat32(vOffset, true),
          view.getFloat32(vOffset + 4, true),
          view.getFloat32(vOffset + 8, true),
        )
        normals.push(nx, ny, nz)
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  } else {
    // ASCII STL
    const text = new TextDecoder().decode(buffer)
    const lines = text.split('\n')
    const positions: number[] = []
    for (const line of lines) {
      const t = line.trim()
      if (t.startsWith('vertex ')) {
        const parts = t.split(/\s+/)
        positions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]))
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.computeVertexNormals()
  }

  return geo
}

function computeModelStats(
  geo: THREE.BufferGeometry,
  material: MaterialId,
  infill: number,
): ModelStats {
  const mat = MATERIALS.find((m) => m.id === material)!
  // Volume in mm³ → cm³
  const volumeMm3 = computeSignedVolume(geo)
  const volumeCm3 = volumeMm3 / 1000

  // Bounding box in mm → cm
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const size = new THREE.Vector3()
  bb.getSize(size)

  const weightG = volumeCm3 * mat.density * (infill / 100)

  return {
    volumeCm3,
    dimensions: { x: size.x / 10, y: size.y / 10, z: size.z / 10 },
    weightG,
  }
}

function computePrice(weightG: number, material: MaterialId): { base: number; gst: number; total: number } {
  const mat = MATERIALS.find((m) => m.id === material)!
  const base = weightG * mat.rate
  const gst = base * GST_RATE
  return { base, gst, total: Math.round(base + gst) }
}

/* ─────────────────────────────────────────────
   THREE.JS STL VIEWER COMPONENTS
───────────────────────────────────────────── */

function STLMesh({ geometry, color }: { geometry: THREE.BufferGeometry; color: string }) {
  const mesh = useMemo(() => {
    const g = geometry.clone()
    g.computeBoundingBox()
    const bb = g.boundingBox!
    const center = new THREE.Vector3()
    bb.getCenter(center)
    g.translate(-center.x, -bb.min.y, -center.z)

    // Scale to fit in a ~4 unit view
    const size = new THREE.Vector3()
    bb.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 4 / maxDim
    g.scale(scale, scale, scale)
    g.computeVertexNormals()
    return g
  }, [geometry])

  return (
    <mesh geometry={mesh} castShadow receiveShadow>
      <meshPhongMaterial
        color={color}
        specular={color === '#ffffff' ? '#cccccc' : '#888888'}
        shininess={color === '#111111' ? 20 : 55}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ViewerScene({ geometry, color }: { geometry: THREE.BufferGeometry | null; color: string }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(4, 3, 5)
    camera.lookAt(0, 1.5, 0)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-4, 4, -4]} intensity={0.3} color="#c8d8e8" />
      <pointLight position={[0, 8, 2]} intensity={0.4} color="#863841" />

      {/* Grid floor */}
      <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, 0, 0]} />

      {/* Axis helper */}
      <primitive object={new THREE.AxesHelper(2)} />

      {geometry && <STLMesh geometry={geometry} color={color} />}

      {!geometry && (
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1.5, 2.5, 1]} />
          <meshPhongMaterial color="#331a20" wireframe />
        </mesh>
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />
    </>
  )
}

/* ─────────────────────────────────────────────
   UI SUB-COMPONENTS
───────────────────────────────────────────── */

function StepHeader({
  number,
  label,
  active,
  done,
  onClick,
}: {
  number: number
  label: string
  active: boolean
  done: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
        active
          ? 'bg-white/5'
          : done
          ? 'opacity-80 hover:opacity-100'
          : 'opacity-40 cursor-default pointer-events-none'
      }`}
    >
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
          active
            ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
            : done
            ? 'bg-green-600/80 text-white'
            : 'border border-white/20 text-white/40'
        }`}
      >
        {done ? '✓' : number}
      </span>
      <span className={`font-semibold text-sm tracking-wide ${active ? 'text-white' : done ? 'text-white/70' : 'text-white/30'}`}>
        {label}
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function CustomActionFigure() {
  /* ── File + geometry state ── */
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number>(0)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  /* ── Config state ── */
  const [customMode, setCustomMode] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [material, setMaterial] = useState<MaterialId>('PLA')
  const [selectedColor, setSelectedColor] = useState('#111111')
  const [infill, setInfill] = useState(20)

  /* ── Derived stats ── */
  const stats: ModelStats | null = useMemo(() => {
    if (!geometry) return null
    return computeModelStats(geometry, material, infill)
  }, [geometry, material, infill])

  const price = useMemo(() => {
    if (!stats) return null
    return computePrice(stats.weightG, material)
  }, [stats, material])

  /* ── File processing ── */
  const processFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'stl') {
      setParseError('Please upload a .stl file')
      return
    }

    setFileName(file.name)
    setFileSize(file.size)
    setParseError(null)
    setParsing(true)
    setGeometry(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target!.result as ArrayBuffer
        const geo = parseSTLBuffer(buffer)
        setGeometry(geo)
      } catch {
        setParseError('Failed to parse STL. Please check the file is valid.')
      } finally {
        setParsing(false)
      }
    }
    reader.onerror = () => {
      setParseError('Failed to read file.')
      setParsing(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) processFile(f)
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files?.[0]
      if (f) processFile(f)
    },
    [processFile],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)

  /* ── Cart payload ── */
  const handleAddToCart = () => {
    if (!geometry || !stats || !price) return
    const payload = {
      productType: 'custom-print',
      file: fileName,
      material,
      color: selectedColor,
      infill,
      weight: parseFloat(stats.weightG.toFixed(2)),
      price: price.total,
      gstIncluded: true,
    }
    console.log('[Cart]', payload)
    alert(`Added to cart!\n\nMaterial: ${material}\nInfill: ${infill}%\nWeight: ${stats.weightG.toFixed(1)}g\nPrice: ₹${price.total} (incl. GST)`)
  }

  const fileUploaded = !!fileName && !parsing
  const currentMaterial = MATERIALS.find((m) => m.id === material)!

  return (
    <>
      {/* ─── Section header ─── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 id="caf-heading" className="font-cinzel text-2xl font-bold text-white md:text-3xl">
          Custom Action Figure
        </h2>
        <span className="rounded-full bg-mugen-crimson/70 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-white ring-1 ring-mugen-crimson/40">
          New
        </span>
      </div>
      <p className="mb-8 max-w-2xl text-sm text-white/60 font-sans leading-relaxed">
        Upload your <span className="font-medium text-white/90">.stl</span> file, choose your material and infill — we calculate the exact price from your geometry.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ═══════════════════════════════
            LEFT PANEL — Viewer + Upload
        ═══════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* 3D Viewer */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117]" style={{ height: 340 }}>
            {/* Overlay: file info */}
            {fileName && (
              <div className="absolute top-3 left-3 z-10 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs text-white/80 font-mono max-w-[60%] truncate shadow-lg">
                <span className="text-white/50 mr-1.5">▶</span>
                {fileName}
                <span className="ml-2 text-white/40">{(fileSize / 1024 / 1024).toFixed(1)} MB</span>
                <span className="ml-2 text-indigo-300">{infill}%</span>
              </div>
            )}

            {/* Parsing spinner */}
            {parsing && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                  <span className="text-xs text-white/60">Parsing geometry…</span>
                </div>
              </div>
            )}

            {/* No file placeholder */}
            {!fileName && !parsing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-16 w-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-8 w-8 text-white/20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/25 font-sans">Upload a .stl file to preview</p>
                </div>
              </div>
            )}

            <Canvas
              camera={{ position: [4, 3, 5], fov: 45, near: 0.1, far: 200 }}
              gl={{ antialias: true, alpha: false }}
              shadows
              className="w-full h-full"
            >
              <Suspense fallback={null}>
                <ViewerScene geometry={geometry} color={selectedColor} />
              </Suspense>
            </Canvas>
          </div>

          {/* Upload zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative rounded-xl border-2 border-dashed px-5 py-4 transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500/70 bg-indigo-500/8'
                : fileUploaded
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-white/12 bg-white/2 hover:border-white/25 hover:bg-white/4'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                fileUploaded ? 'bg-green-500/15' : 'bg-white/5'
              }`}>
                {fileUploaded ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-white/40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.25 5.25 0 0 1 1.23 9.095H6.75Z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {fileUploaded ? (
                  <>
                    <p className="text-sm font-semibold text-white/85 truncate">{fileName}</p>
                    <p className="text-xs text-white/40">Click to replace · {(fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white/70">
                      UPLOAD MODEL
                    </p>
                    <p className="text-xs text-white/35">Drag & drop or click · .stl supported · Max 50 MB</p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="stl-upload"
              type="file"
              accept=".stl"
              className="sr-only"
              aria-label="Upload STL file"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-mugen-crimson/80 font-semibold -mt-2">
            We currently support stl file format
          </p>

          {parseError && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-xs text-red-300">
              {parseError}
            </p>
          )}

          {/* File Unit row */}
          <div className="flex items-center gap-6 text-xs text-white/50 font-sans">
            <span className="font-semibold text-white/40 uppercase tracking-widest">File Unit:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="unit" defaultChecked className="accent-indigo-500" />
              <span className="text-white/70">mm</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="unit" className="accent-indigo-500" />
              <span className="text-white/70">inch</span>
            </label>
          </div>

          {/* Model Stats */}
          <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white/40 border-b border-white/6">
              Model Stats
            </p>
            <table className="w-full text-xs">
              <tbody>
                {(
                  [
                    ['Material Volume', stats ? `${stats.volumeCm3.toFixed(2)} cm³` : '—'],
                    [
                      'Model Dimensions',
                      stats
                        ? `${stats.dimensions.x.toFixed(2)} × ${stats.dimensions.y.toFixed(2)} × ${stats.dimensions.z.toFixed(2)} cm`
                        : '—',
                    ],
                    ['Estimated Weight', stats ? `${stats.weightG.toFixed(2)} g` : '—'],
                    ['Print Time (hh:mm:ss)', '00:00:00'],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <tr key={label} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-white/45 font-medium">{label}</td>
                    <td className="px-4 py-2.5 text-white/75 font-mono text-right">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════
            RIGHT PANEL — Steps
        ═══════════════════════════════ */}
        <div className="flex flex-col gap-3">

          {/* ── Custom Configuration Toggle ── */}
          <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/85">Enable Custom Configuration</p>
              <p className="text-xs text-white/35 mt-0.5">
                {customMode ? 'Editing print settings — price updates live.' : 'Using standard defaults. Toggle to fine-tune.'}
              </p>
            </div>
            <button
              id="caf-custom-toggle"
              role="switch"
              aria-checked={customMode}
              onClick={() => { setCustomMode((v) => !v); setActiveStep(1) }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                customMode ? 'bg-indigo-600' : 'bg-white/20'
              }`}
              aria-label="Toggle custom print settings"
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                customMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* ── Default mode summary ── */}
          {!customMode && (
            <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Default Configuration</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ['Printer', '0.2 mm Standard Quality'],
                  ['Material', 'PLA'],
                  ['Infill', '20%'],
                  ['Finish', 'Natural'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-white/28 font-semibold">{k}</span>
                    <span className="text-xs text-white/65">{v}</span>
                  </div>
                ))}
              </div>

              {/* Price in default mode */}
              <div className="mt-4 rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Estimated Price</p>
                {price ? (
                  <p className="font-cinzel text-2xl font-bold text-white tracking-wide">
                    ₹{price.total}
                    <span className="ml-2 text-xs text-white/40 font-sans font-normal">incl. 18% GST</span>
                  </p>
                ) : (
                  <p className="font-cinzel text-2xl font-bold text-white/20">— —</p>
                )}
                <p className="text-[10px] text-white/30 mt-1">Upload a .stl file to get your personalised quote.</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════
              STEP-BASED UI (Custom mode)
          ═══════════════════════ */}
          {customMode && (
            <div className="flex flex-col gap-2">

              {/* ── STEP 1: Printer ── */}
              <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
                <StepHeader
                  number={1}
                  label="Printer"
                  active={activeStep === 1}
                  done={activeStep > 1}
                  onClick={() => setActiveStep(1)}
                />
                {activeStep === 1 && (
                  <div className="px-4 pb-4">
                    {/* Selected badge */}
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/60">
                      <span className="font-semibold text-white/80">Printer :</span>
                      0.2 mm Standard Quality
                    </div>

                    <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="printer"
                          defaultChecked
                          className="accent-indigo-500 h-4 w-4"
                          readOnly
                        />
                        <span className="text-sm text-white/85 font-medium">0.2 mm Standard Quality</span>
                      </label>
                      <p className="ml-6.5 mt-1 text-xs text-white/40">
                        Balanced speed and surface quality — best for action figures
                      </p>
                    </div>

                    <button
                      id="caf-step1-next"
                      onClick={() => setActiveStep(2)}
                      className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                    >
                      NEXT
                    </button>
                  </div>
                )}
              </div>

              {/* ── STEP 2: Material ── */}
              <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
                <StepHeader
                  number={2}
                  label="Material"
                  active={activeStep === 2}
                  done={activeStep > 2}
                  onClick={() => activeStep > 2 && setActiveStep(2)}
                />
                {activeStep === 2 && (
                  <div className="px-4 pb-4">
                    {/* Selected badge */}
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/60">
                      <span
                        className="h-3 w-3 rounded-sm border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <span className="font-semibold text-white/80">Material :</span>
                      {material} — {currentMaterial.colors.indexOf(selectedColor) >= 0
                        ? selectedColor === '#111111' ? 'Black'
                          : selectedColor === '#ffffff' ? 'White'
                          : selectedColor === '#9ca3af' ? 'Grey'
                          : selectedColor === '#ef4444' ? 'Red'
                          : selectedColor === '#3b82f6' ? 'Blue'
                          : 'Custom'
                        : 'Custom'}
                    </div>

                    <div className="flex flex-col gap-2">
                      {MATERIALS.map((mat) => (
                        <div key={mat.id} className="rounded-lg border border-white/8 bg-white/2 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-white/85">{mat.label}</span>
                            <span className="text-xs text-white/40">{mat.desc}</span>
                          </div>
                          {/* Color swatches */}
                          <div className="flex flex-wrap gap-1.5">
                            {mat.colors.map((color) => {
                              const isSelected = material === mat.id && selectedColor === color
                              return (
                                <button
                                  key={color}
                                  type="button"
                                  title={color}
                                  onClick={() => { setMaterial(mat.id); setSelectedColor(color) }}
                                  className={`h-6 w-6 rounded-sm border-2 transition-all hover:scale-110 ${
                                    isSelected
                                      ? 'border-indigo-400 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                                      : 'border-white/15 hover:border-white/40'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Select ${mat.label} ${color}`}
                                  aria-pressed={isSelected}
                                />
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setActiveStep(1)}
                        className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
                      >
                        BACK
                      </button>
                      <button
                        id="caf-step2-next"
                        onClick={() => setActiveStep(3)}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── STEP 3: Infill ── */}
              <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
                <StepHeader
                  number={3}
                  label="Infill"
                  active={activeStep === 3}
                  done={activeStep > 3}
                  onClick={() => activeStep > 3 && setActiveStep(3)}
                />
                {activeStep === 3 && (
                  <div className="px-4 pb-4">
                    {/* Selected badge */}
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/60">
                      <span className="font-semibold text-white/80">Infill :</span>
                      {infill}%
                    </div>

                    <p className="mb-3 text-xs text-white/35 leading-relaxed">
                      Higher infill = more material = heavier & stronger = higher cost.
                    </p>

                    <div className="flex flex-col gap-1.5">
                      {INFILL_OPTIONS.map((pct) => (
                        <label
                          key={pct}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                            infill === pct
                              ? 'border-indigo-500/50 bg-indigo-500/8'
                              : 'border-white/6 bg-white/2 hover:border-white/15'
                          }`}
                        >
                          <input
                            type="radio"
                            name="infill"
                            value={pct}
                            checked={infill === pct}
                            onChange={() => setInfill(pct)}
                            className="accent-indigo-500 h-3.5 w-3.5"
                          />
                          <span className={`text-sm font-medium ${infill === pct ? 'text-white' : 'text-white/65'}`}>
                            {pct}%
                          </span>
                          {pct === 20 && (
                            <span className="ml-auto text-[10px] text-indigo-400/80 font-semibold uppercase tracking-wide">Recommended</span>
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
                      >
                        BACK
                      </button>
                      <button
                        id="caf-step3-next"
                        onClick={() => setActiveStep(4)}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── STEP 4: Finalize ── */}
              <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
                <StepHeader
                  number={4}
                  label="Finalize"
                  active={activeStep === 4}
                  done={false}
                  onClick={() => activeStep === 4 ? undefined : setActiveStep(4)}
                />
                {activeStep === 4 && (
                  <div className="px-4 pb-4">
                    {/* Config summary */}
                    <div className="rounded-lg border border-white/8 bg-white/3 p-3 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-2">Configuration Summary</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                          ['Printer', '0.2mm Standard'],
                          ['Material', material],
                          ['Infill', `${infill}%`],
                          ['Weight', stats ? `${stats.weightG.toFixed(1)} g` : '—'],
                          ['Volume', stats ? `${stats.volumeCm3.toFixed(2)} cm³` : '—'],
                          ['Dimensions', stats ? `${stats.dimensions.x.toFixed(1)}×${stats.dimensions.y.toFixed(1)}×${stats.dimensions.z.toFixed(1)} cm` : '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase tracking-widest text-white/28 font-semibold">{k}</span>
                            <span className="text-xs text-white/70 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-indigo-400/70 mb-2 font-semibold">Final Price</p>
                      {price ? (
                        <>
                          <p className="font-cinzel text-3xl font-bold text-white tracking-wide">
                            ₹{price.total}
                          </p>
                          <p className="text-xs text-white/40 mt-1">Includes 18% GST</p>
                        </>
                      ) : (
                        <>
                          <p className="font-cinzel text-3xl font-bold text-white/20">— —</p>
                          <p className="text-xs text-white/30 mt-1">Upload a .stl file above to get pricing</p>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveStep(3)}
                        className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
                      >
                        BACK
                      </button>
                      <button
                        id="caf-add-to-cart"
                        type="button"
                        disabled={!fileUploaded || !stats}
                        onClick={handleAddToCart}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold font-cinzel uppercase tracking-widest text-white transition-all ${
                          fileUploaded && stats
                            ? 'bg-mugen-crimson/80 hover:bg-mugen-crimson cursor-pointer shadow-[0_0_20px_rgba(134,56,65,0.35)] hover:shadow-[0_0_28px_rgba(134,56,65,0.5)]'
                            : 'bg-mugen-crimson/25 opacity-50 cursor-not-allowed'
                        }`}
                        aria-label="Add custom print to cart"
                      >
                        Add to Cart
                      </button>
                    </div>
                    {!fileUploaded && (
                      <p className="mt-2 text-center text-xs text-white/30">Upload a .stl file to enable checkout</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Quick Add to Cart (default mode) ── */}
          {!customMode && (
            <button
              id="caf-order-btn"
              type="button"
              disabled={!fileUploaded || !stats}
              onClick={handleAddToCart}
              className={`w-full rounded-xl px-6 py-3.5 font-cinzel text-sm font-bold uppercase tracking-widest text-white transition-all ${
                fileUploaded && stats
                  ? 'bg-mugen-crimson/80 hover:bg-mugen-crimson cursor-pointer shadow-[0_0_20px_rgba(134,56,65,0.35)] hover:shadow-[0_0_28px_rgba(134,56,65,0.5)]'
                  : 'bg-mugen-crimson/30 opacity-50 cursor-not-allowed'
              }`}
              aria-label="Submit custom action figure order"
            >
              Add to Cart
            </button>
          )}
          {!customMode && !fileUploaded && (
            <p className="text-center text-xs text-white/30">Upload a .stl file above to enable this button</p>
          )}
        </div>
      </div>
    </>
  )
}
