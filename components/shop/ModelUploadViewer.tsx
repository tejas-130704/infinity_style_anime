'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { MAX_UPLOAD_BYTES } from '@/lib/upload-3d/limits'

function getExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? ''
  const i = base.lastIndexOf('.')
  if (i <= 0) return ''
  return base.slice(i + 1).toLowerCase()
}

const PRIMARY_ORDER = ['stp', 'step', 'stl', 'obj', 'iges', 'igs']

function pickPrimary(files: File[]): { primary: File | null; companions: File[] } {
  const arr = [...files]
  for (const ext of PRIMARY_ORDER) {
    const idx = arr.findIndex((f) => getExtension(f.name) === ext)
    if (idx >= 0) {
      const [p] = arr.splice(idx, 1)
      return { primary: p, companions: arr }
    }
  }
  return { primary: arr[0] ?? null, companions: arr.slice(1) }
}

function graphToMergedGeometry(root: THREE.Object3D): THREE.BufferGeometry {
  root.updateMatrixWorld(true)
  const geos: THREE.BufferGeometry[] = []
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.geometry) {
      const g = o.geometry.clone()
      g.applyMatrix4(o.matrixWorld)
      geos.push(g)
    }
  })
  if (!geos.length) return new THREE.BufferGeometry()
  return mergeGeometries(geos, false) ?? new THREE.BufferGeometry()
}

function fitObjectForPreview(root: THREE.Object3D): void {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)
  root.position.x -= center.x
  root.position.z -= center.z
  root.position.y -= box.min.y
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
  const s = 4 / maxDim
  root.scale.setScalar(s)
}

function PreviewMesh({
  root,
  color,
}: {
  root: THREE.Object3D | null
  color: string
}) {
  const prepared = useMemo(() => {
    if (!root) return null
    const clone = root.clone(true)
    fitObjectForPreview(clone)
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of mats) {
          if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhongMaterial) {
            m.color = new THREE.Color(color)
            m.map = null
          }
        }
      }
    })
    return clone
  }, [root, color])

  if (!prepared) return null
  return <primitive object={prepared} />
}

function ViewerScene({
  objectRoot,
  color,
}: {
  objectRoot: THREE.Object3D | null
  color: string
}) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(4, 3, 5)
    camera.lookAt(0, 1.5, 0)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 10, 5]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 4, -4]} intensity={0.28} color="#c8d8e8" />
      <pointLight position={[0, 8, 2]} intensity={0.35} color="#863841" />
      <gridHelper args={[10, 10, '#334155', '#1e293b']} position={[0, 0, 0]} />
      <primitive object={new THREE.AxesHelper(2)} />
      <PreviewMesh root={objectRoot} color={color} />
      {!objectRoot && (
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1.5, 2.5, 1]} />
          <meshPhongMaterial color="#331a20" wireframe />
        </mesh>
      )}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={24}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 + 0.12}
      />
    </>
  )
}

async function pollCadJob(id: string): Promise<void> {
  const deadline = Date.now() + 5 * 60 * 1000
  while (Date.now() < deadline) {
    const r = await fetch(`/api/upload-3d/status?id=${encodeURIComponent(id)}`)
    const j = (await r.json()) as { status?: string; error?: string | null }
    if (!r.ok) throw new Error((j as { error?: string }).error || 'Status request failed.')
    if (j.status === 'completed') return
    if (j.status === 'failed') throw new Error(j.error || 'CAD conversion failed.')
    await new Promise((res) => setTimeout(res, 450))
  }
  throw new Error('CAD conversion timed out. Try a smaller file or export as STL/OBJ.')
}

export interface ModelUploadViewerProps {
  selectedColor: string
  infillPct: number
  onModelGeometry: (geometry: THREE.BufferGeometry | null) => void
  onFileInfo: (name: string | null, sizeBytes: number) => void
  onBusy: (busy: boolean) => void
  onError: (message: string | null) => void
}

export default function ModelUploadViewer({
  selectedColor,
  infillPct,
  onModelGeometry,
  onFileInfo,
  onBusy,
  onError,
}: ModelUploadViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [objectRoot, setObjectRoot] = useState<THREE.Object3D | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [displaySize, setDisplaySize] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'upload' | 'convert' | 'load'>('idle')

  const busy = phase !== 'idle'

  useEffect(() => {
    onBusy(busy)
  }, [busy, onBusy])

  const loadPreviewFromJob = useCallback(
    async (id: string, format: string) => {
      setPhase('load')
      onError(null)
      const base = `/api/model/${id}`

      try {
        if (format === 'stl') {
          const geo = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
            new STLLoader().load(base, resolve, undefined, reject)
          })
          const group = new THREE.Group()
          group.add(new THREE.Mesh(geo))
          setObjectRoot(group)
          onModelGeometry(geo.clone())
          return
        }

        if (format === 'obj') {
          const st = (await fetch(`/api/upload-3d/status?id=${encodeURIComponent(id)}`).then((r) =>
            r.json(),
          )) as { primaryDiskName?: string }
          const disk = st.primaryDiskName
          if (!disk) throw new Error('Could not resolve OBJ path on server.')

          const origin = window.location.origin
          const pathBase = `${origin}/api/model/${id}/`
          const objUrl = `${pathBase}${encodeURIComponent(disk)}`

          await new Promise<void>((resolve, reject) => {
            fetch(objUrl)
              .then((r) => r.text())
              .then((txt) => {
                const mtllibLine = txt.split(/\r?\n/).find((l) => l.trim().toLowerCase().startsWith('mtllib '))
                const mtlLoader = new MTLLoader()
                mtlLoader.setPath(pathBase)
                const objLoader = new OBJLoader()
                objLoader.setPath(pathBase)

                if (!mtllibLine) {
                  objLoader.load(
                    objUrl,
                    (o) => {
                      setObjectRoot(o)
                      onModelGeometry(graphToMergedGeometry(o))
                      resolve()
                    },
                    undefined,
                    reject,
                  )
                  return
                }

                const mtlFile = mtllibLine
                  .slice(7)
                  .trim()
                  .split(/\s+/)[0]
                mtlLoader.load(
                  mtlFile,
                  (materials) => {
                    materials.preload()
                    objLoader.setMaterials(materials)
                    objLoader.load(
                      objUrl,
                      (o) => {
                        setObjectRoot(o)
                        onModelGeometry(graphToMergedGeometry(o))
                        resolve()
                      },
                      undefined,
                      reject,
                    )
                  },
                  undefined,
                  reject,
                )
              })
              .catch(reject)
          })
          return
        }

        if (format === 'step' || format === 'iges') {
          const gltf = await new Promise<THREE.Group>((resolve, reject) => {
            new GLTFLoader().load(base, (g) => resolve(g.scene), undefined, reject)
          })
          setObjectRoot(gltf)
          onModelGeometry(graphToMergedGeometry(gltf))
          return
        }

        throw new Error('Unsupported preview format.')
      } catch (e) {
        onModelGeometry(null)
        setObjectRoot(null)
        onError(e instanceof Error ? e.message : 'Failed to load preview.')
      } finally {
        setPhase('idle')
      }
    },
    [onError, onModelGeometry],
  )

  const uploadAndLoad = useCallback(
    async (primary: File, companions: File[]) => {
      setPhase('upload')
      onError(null)
      onModelGeometry(null)
      setObjectRoot(null)
      setDisplayName(null)
      setDisplaySize(0)
      onFileInfo(null, 0)

      const total = primary.size + companions.reduce((a, f) => a + f.size, 0)
      if (total > MAX_UPLOAD_BYTES) {
        onError(`Total size exceeds ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`)
        setPhase('idle')
        return
      }

      const fd = new FormData()
      fd.append('primary', primary)
      for (const c of companions) fd.append('companions', c)

      const res = await fetch('/api/upload-3d', { method: 'POST', body: fd })
      const j = (await res.json()) as {
        id?: string
        status?: string
        format?: string
        error?: string
      }
      if (!res.ok) {
        onError(j.error || 'Upload failed.')
        setPhase('idle')
        return
      }

      const id = j.id!
      const format = j.format || ''
      setDisplayName(primary.name)
      setDisplaySize(total)
      onFileInfo(primary.name, total)

      const isCad = format === 'step' || format === 'iges'
      if (isCad) {
        setPhase('convert')
        try {
          await pollCadJob(id)
        } catch (e) {
          onError(e instanceof Error ? e.message : 'Conversion failed.')
          setPhase('idle')
          return
        }
      }

      await loadPreviewFromJob(id, format)
    },
    [loadPreviewFromJob, onError, onFileInfo, onModelGeometry],
  )

  const processFiles = useCallback(
    async (list: FileList | File[]) => {
      const arr = Array.from(list)
      if (!arr.length) return
      const { primary, companions } = pickPrimary(arr)
      if (!primary) {
        onError('No supported model file found.')
        return
      }
      const pext = getExtension(primary.name)
      if (!['stp', 'step', 'stl', 'obj', 'iges', 'igs'].includes(pext)) {
        onError('Unsupported file type.')
        return
      }
      if (pext !== 'obj' && companions.length) {
        onError(
          'Only OBJ uploads can include extra material/texture files. Drop the primary file alone, or include all OBJ companions together.',
        )
        return
      }
      await uploadAndLoad(primary, companions)
    },
    [uploadAndLoad, onError],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files
    if (f?.length) void processFiles(f)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) void processFiles(e.dataTransfer.files)
  }

  const fileUploaded = !!displayName && !busy

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117]" style={{ height: 340 }}>
        {displayName && (
          <div className="absolute top-3 left-3 z-10 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs text-white/80 font-mono max-w-[60%] truncate shadow-lg">
            <span className="text-white/50 mr-1.5">▶</span>
            {displayName}
            <span className="ml-2 text-white/40">{(displaySize / 1024 / 1024).toFixed(1)} MB</span>
            <span className="ml-2 text-indigo-300">{infillPct}%</span>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
              <span className="text-xs text-white/60">
                {phase === 'upload'
                  ? 'Uploading…'
                  : phase === 'convert'
                  ? 'Converting CAD to mesh…'
                  : 'Loading preview…'}
              </span>
            </div>
          </div>
        )}

        {!displayName && !busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="mx-auto mb-3 h-16 w-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-8 w-8 text-white/20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <p className="text-xs text-white/25 font-sans">Drop a 3D model to preview</p>
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
            <ViewerScene objectRoot={objectRoot} color={selectedColor} />
          </Suspense>
        </Canvas>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
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
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
              fileUploaded ? 'bg-green-500/15' : 'bg-white/5'
            }`}
          >
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
                <p className="text-sm font-semibold text-white/85 truncate">{displayName}</p>
                <p className="text-xs text-white/40">Click to replace · {(displaySize / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white/70">UPLOAD 3D MODEL</p>
                <p className="text-xs text-white/35">
                  Drag & drop or click · .stl .obj .step .stp .iges .igs · max 50 MB · add .mtl & textures with OBJ
                </p>
              </>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".stl,.obj,.step,.stp,.iges,.igs,.mtl,.png,.jpg,.jpeg,.webp"
          className="sr-only"
          aria-label="Upload 3D model files"
          onChange={handleFileChange}
        />
      </div>
    </>
  )
}
