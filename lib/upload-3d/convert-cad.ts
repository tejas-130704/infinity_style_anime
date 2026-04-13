import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import type { JobManifest } from './types'

type OcctModule = {
  ReadStepFile: (content: Uint8Array, params: Record<string, unknown> | null) => OcctResult
  ReadIgesFile: (content: Uint8Array, params: Record<string, unknown> | null) => OcctResult
}

interface OcctResult {
  success: boolean
  meshes: OcctMesh[]
}

interface OcctMesh {
  name?: string
  color?: [number, number, number]
  attributes: {
    position: { array: Float32Array | number[] }
    normal?: { array: Float32Array | number[] }
  }
  index: { array: Uint32Array | Uint16Array | number[] }
}

function toFloat32Array(data: Float32Array | number[]): Float32Array {
  if (data instanceof Float32Array) return data
  return new Float32Array(data)
}

function buildGeometryFromOcctMesh(m: OcctMesh): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const pos = toFloat32Array(m.attributes.position.array)
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  if (m.attributes.normal?.array) {
    const n = toFloat32Array(m.attributes.normal.array)
    geo.setAttribute('normal', new THREE.BufferAttribute(n, 3))
  } else {
    geo.computeVertexNormals()
  }
  const idx = m.index.array
  if (idx instanceof Uint32Array) {
    geo.setIndex(idx)
  } else if (idx instanceof Uint16Array) {
    geo.setIndex(idx)
  } else {
    geo.setIndex(new Uint32Array(idx as number[]))
  }
  return geo
}

async function loadOcct(): Promise<OcctModule> {
  const mod = await import('occt-import-js')
  const factory = (mod as { default?: () => Promise<OcctModule> }).default ?? (mod as unknown as () => Promise<OcctModule>)
  return typeof factory === 'function' ? factory() : Promise.reject(new Error('occt-import-js: invalid export'))
}

export async function convertCadBufferToGlb(
  buffer: Buffer,
  format: 'step' | 'iges',
): Promise<ArrayBuffer> {
  const occt = await loadOcct()
  const u8 = new Uint8Array(buffer)
  const result: OcctResult =
    format === 'step' ? occt.ReadStepFile(u8, null) : occt.ReadIgesFile(u8, null)

  if (!result.success || !result.meshes?.length) {
    throw new Error(
      'Could not read this CAD file. It may be corrupt or use unsupported STEP/IGES features.',
    )
  }

  const group = new THREE.Group()
  for (let i = 0; i < result.meshes.length; i++) {
    const om = result.meshes[i] as OcctMesh
    const geo = buildGeometryFromOcctMesh(om)
    const color = om.color
    const mat = new THREE.MeshStandardMaterial({
      color: color ? new THREE.Color(color[0], color[1], color[2]) : 0x9ca3af,
      metalness: 0.15,
      roughness: 0.55,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.name = om.name || `mesh_${i}`
    group.add(mesh)
  }

  const exporter = new GLTFExporter()
  return new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (glb) => {
        if (glb instanceof ArrayBuffer) {
          resolve(glb)
        } else {
          reject(new Error('Expected binary glTF output'))
        }
      },
      (err) => {
        reject(err instanceof Error ? err : new Error(String(err)))
      },
      { binary: true },
    )
  })
}

export function cadFormatFromManifest(m: JobManifest): 'step' | 'iges' | null {
  if (m.format === 'step') return 'step'
  if (m.format === 'iges') return 'iges'
  return null
}
