import path from 'path'

export { MAX_UPLOAD_BYTES } from './limits'

export const ALLOWED_PRIMARY_EXT = new Set([
  'stl',
  'obj',
  'step',
  'stp',
  'iges',
  'igs',
])

export const CAD_EXT = new Set(['step', 'stp', 'iges', 'igs'])

export const MESH_DIRECT_EXT = new Set(['stl', 'obj'])

/** Companion files allowed when primary is OBJ (textures + MTL). */
export const OBJ_COMPANION_EXT = new Set([
  'mtl',
  'png',
  'jpg',
  'jpeg',
  'bmp',
  'tga',
  'webp',
])

export const UPLOAD_ROOT = path.join(process.cwd(), '.data', 'uploads-3d')

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
