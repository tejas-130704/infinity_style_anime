'use client'

import { Suspense, useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Box, Center, Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { cn } from '@/lib/utils'
import { SectionTitle } from './SectionTitle'

/** Matches GLB files in public/assests/models */
const characters = [
  {
    id: 'beast-titan',
    name: 'Beast Titan',
    model: '/assests/models/beast_titan_hip_hop_dancing.glb',
  },
  {
    id: 'gojo',
    name: 'Satoru Gojo',
    model: '/assests/models/gojo.glb',
  },
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    model: '/assests/models/monkey_d._luffy.glb',
  },
  {
    id: 'naruto',
    name: 'Naruto Uzumaki',
    model: '/assests/models/naruto_sage.glb',
  },
  {
    id: 'sasuke',
    name: 'Sasuke Uchiha',
    model: '/assests/models/saske_sharingan.glb',
  },
  {
    id: 'sukuna',
    name: 'Ryomen Sukuna',
    model: '/assests/models/sukuna.glb',
  },
  {
    id: 'yuji',
    name: 'Yuji Itadori',
    model: '/assests/models/yuji_itadori__season_3_design.glb',
  },
  {
    id: 'zoro',
    name: 'Roronoa Zoro',
    model: '/assests/models/zoro.glb',
  },
] as const

/** Gojo / Sasuke GLBs frame tighter after fit — start the camera farther back. */
const CAMERA_DISTANCE_OVERRIDES: Partial<
  Record<(typeof characters)[number]['id'], number>
> = {
  gojo: 6.9,
  sasuke: 6.9,
}

function getCameraDistance(characterId: string): number {
  const base = 4.4
  const extra = CAMERA_DISTANCE_OVERRIDES[characterId as keyof typeof CAMERA_DISTANCE_OVERRIDES]
  return extra ?? base
}

type ModelAvailability = 'checking' | 'yes' | 'no'

/** R3F error boundaries do not catch useGLTF load failures; probe the URL first. */
function useModelFileAvailability(url: string): ModelAvailability {
  const [state, setState] = useState<ModelAvailability>('checking')

  useEffect(() => {
    let cancelled = false
    setState('checking')

    ;(async () => {
      try {
        let res = await fetch(url, { method: 'HEAD' })
        if (res.status === 405 || res.status === 501) {
          res = await fetch(url)
        }
        if (!cancelled) setState(res.ok ? 'yes' : 'no')
      } catch {
        if (!cancelled) setState('no')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}

function PlaceholderModel({
  fileName,
  displayName,
}: {
  fileName: string
  displayName: string
}) {
  return (
    <Center bottom>
      <group>
      <Box args={[1.2, 2.2, 0.7]} rotation={[0, 0.4, 0]}>
        <meshStandardMaterial color="#8B1538" metalness={0.35} roughness={0.45} />
      </Box>
      <Html position={[0, 0, 0.6]} center>
        <div className="pointer-events-none w-[min(240px,70vw)] rounded-lg border border-mugen-crimson/40 bg-mugen-black/90 px-3 py-2 text-center font-sans text-[11px] leading-snug text-white/90 font-medium shadow-lg">
          <p className="mb-1 text-mugen-gold">{displayName}</p>
          <p>
            Missing <span className="font-mono text-mugen-white/90">{fileName}</span>. Add GLB files under{' '}
            <span className="text-mugen-gold">public/assests/models/</span>.
          </p>
        </div>
      </Html>
      </group>
    </Center>
  )
}

/** Every GLB has different scale/pivot — fit to a stable frame in scene units. */
const FIT_MAX_DIMENSION = 2.4

function normalizeModelRoot(root: THREE.Object3D): { lookAtY: number } {
  root.position.set(0, 0, 0)
  root.rotation.set(0, 0, 0)
  root.scale.set(1, 1, 1)
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  if (box.isEmpty()) return { lookAtY: 1.1 }

  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z, 1e-5)
  let uniform = FIT_MAX_DIMENSION / maxDim
  uniform = Math.min(Math.max(uniform, 0.04), 25)
  root.scale.setScalar(uniform)
  root.updateMatrixWorld(true)

  box.setFromObject(root)
  const cx = (box.min.x + box.max.x) / 2
  const cz = (box.min.z + box.max.z) / 2
  // Feet on ground: keeps full figure in frame (centering bbox Y was clipping Gojo / Beast Titan).
  root.position.set(-cx, -box.min.y, -cz)
  root.updateMatrixWorld(true)

  box.setFromObject(root)
  const lookAtY = (box.min.y + box.max.y) / 2
  return { lookAtY: Number.isFinite(lookAtY) ? lookAtY : 1.1 }
}

interface LoadedGltfModelProps {
  modelPath: string
  characterId: string
}

function NormalizedModel({
  object,
  modelPath,
  characterId,
}: {
  object: THREE.Object3D
  modelPath: string
  characterId: string
}) {
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const controls = useThree((s) => s.controls) as
    | { target: THREE.Vector3; update: () => void }
    | undefined

  useLayoutEffect(() => {
    const { lookAtY } = normalizeModelRoot(object)
    const y = lookAtY

    const applyCamera = () => {
      if (camera.isPerspectiveCamera) {
        const dist = getCameraDistance(characterId)
        const eyeY = y * 0.36 + 0.32
        camera.position.set(0, eyeY, dist)
        camera.near = 0.08
        camera.far = 120
        camera.lookAt(0, y, 0)
        camera.updateProjectionMatrix()
      }
      if (controls) {
        controls.target.set(0, y, 0)
        controls.update()
      }
      invalidate()
    }

    applyCamera()
    const id = requestAnimationFrame(applyCamera)
    return () => cancelAnimationFrame(id)
  }, [object, modelPath, characterId, camera, controls, invalidate])

  return <primitive object={object} />
}

function LoadedGltfModel({ modelPath, characterId }: LoadedGltfModelProps) {
  const { scene } = useGLTF(modelPath)
  const clone = useMemo(() => scene.clone(true), [scene, modelPath])

  return (
    <NormalizedModel
      object={clone}
      modelPath={modelPath}
      characterId={characterId}
    />
  )
}

function ModelViewer({
  modelPath,
  fileName,
  characterName,
  characterId,
}: {
  modelPath: string
  fileName: string
  characterName: string
  characterId: string
}) {
  const availability = useModelFileAvailability(modelPath)

  return (
    <Canvas
      camera={{ position: [0, 0.35, 4.25], fov: 42, near: 0.1, far: 100 }}
      className="w-full h-full bg-gradient-to-b from-mugen-dark/50 to-mugen-black"
      key={modelPath}
      gl={{ antialias: true, alpha: false }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-4, 4, -4]} intensity={0.35} color="#e5dcc8" />
      <pointLight position={[0, 6, 2]} intensity={0.45} color="#863841" />

      {availability === 'no' && (
        <PlaceholderModel fileName={fileName} displayName={characterName} />
      )}
      {availability === 'yes' && (
        <Suspense fallback={null}>
          <LoadedGltfModel modelPath={modelPath} characterId={characterId} />
        </Suspense>
      )}

      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={2.2}
        enableZoom
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.6}
        maxDistance={characterId === 'gojo' || characterId === 'sasuke' ? 14 : 11}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 + 0.18}
        target={[0, 1, 0]}
      />
    </Canvas>
  )
}

export function ThreeDModelViewer() {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0].id)

  return (
    <section className="relative py-20 md:py-32 lg:py-40 bg-mugen-black">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div
          className="mb-12 md:mb-16"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <SectionTitle
            title="Meet the Characters"
            japaneseSubtitle="キャラクターに会う"
            subtitle="Interactive 3D character viewer with full 360° rotation"
          />
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-96 lg:h-[600px]">
          {/* Character Selection */}
          <div
            className="relative flex flex-col gap-3 order-2 lg:order-1"
            data-aos="fade-right"
            data-aos-duration="850"
            data-aos-delay="80"
          >
            <p className="font-sans text-xs uppercase tracking-widest text-white/90 font-semibold mb-4">
              Select Character
            </p>

            <div className="relative flex flex-col gap-2.5">
              {characters.map((char) => {
                const isActive = selectedCharacter === char.id
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedCharacter(char.id)}
                    data-character={char.id}
                    className={cn(
                      'group relative w-full overflow-hidden rounded-xl px-3.5 py-3 text-left font-sans text-sm font-semibold transition-all duration-300 ease-out',
                      'border focus:outline-none focus-visible:ring-2 focus-visible:ring-mugen-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-mugen-black',
                      isActive
                        ? 'z-[1] scale-[1.02] border-mugen-glow/70 bg-gradient-to-br from-mugen-glow/18 via-mugen-glow-deep/12 to-mugen-dark/95 text-mugen-white shadow-[0_0_32px_rgba(255,211,77,0.45),inset_0_1px_0_rgba(255,211,77,0.15)] ring-1 ring-mugen-glow/50'
                        : 'border-white/10 bg-mugen-dark/40 text-white/80 font-medium hover:-translate-y-0.5 hover:scale-[1.01] hover:border-mugen-glow/55 hover:bg-mugen-glow/10 hover:text-mugen-white hover:shadow-[0_10px_32px_rgba(255,211,77,0.3)] active:scale-[0.99]'
                    )}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[200%] group-hover:opacity-100"
                    />
                    <span className="relative flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-mugen-white transition-all duration-300',
                          'bg-gradient-to-br from-mugen-glow-deep to-mugen-glow shadow-md',
                          isActive
                            ? 'ring-2 ring-mugen-glow shadow-[0_0_20px_rgba(255,211,77,0.65)]'
                            : 'group-hover:ring-2 group-hover:ring-mugen-glow/55 group-hover:shadow-[0_0_16px_rgba(255,211,77,0.45)]'
                        )}
                      >
                        {char.name[0]}
                      </span>
                      <span className="min-w-0 truncate">{char.name}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Info Box */}
            <div className="mt-auto pt-8 border-t border-mugen-gray">
              <p className="font-sans text-xs text-white/90 font-medium mb-3">
                Drag to rotate • Scroll to zoom
              </p>
              <div className="flex gap-2">
                <div className="text-center flex-1">
                  <p className="text-xl font-cinzel font-extrabold text-mugen-gold">
                    360°
                  </p>
                  <p className="text-xs text-white/85 font-medium">Rotation</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xl font-cinzel font-extrabold text-mugen-gold">
                    HD
                  </p>
                  <p className="text-xs text-white/85 font-medium">Quality</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Viewer */}
          <div
            className="col-span-1 lg:col-span-3 order-1 lg:order-2 rounded-xl overflow-hidden border border-mugen-crimson/20 glass-strong bg-mugen-dark/50"
            data-aos="fade-left"
            data-aos-duration="850"
            data-aos-delay="120"
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white/90 font-sans text-sm font-semibold">
                    Loading model...
                  </p>
                </div>
              }
            >
              <ModelViewer
                characterId={selectedCharacter}
                modelPath={
                  characters.find((c) => c.id === selectedCharacter)?.model ?? ''
                }
                fileName={
                  characters
                    .find((c) => c.id === selectedCharacter)
                    ?.model.split('/')
                    .pop() ?? ''
                }
                characterName={
                  characters.find((c) => c.id === selectedCharacter)?.name ??
                  selectedCharacter
                }
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-mugen-crimson/10 rounded-full blur-3xl opacity-20" />
    </section>
  )
}
