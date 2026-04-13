export function mimeForFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'stl':
      return 'model/stl'
    case 'obj':
      return 'model/obj'
    case 'mtl':
      return 'text/plain; charset=utf-8'
    case 'glb':
      return 'model/gltf-binary'
    case 'gltf':
      return 'model/gltf+json'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'bmp':
      return 'image/bmp'
    case 'step':
    case 'stp':
      return 'application/step'
    case 'iges':
    case 'igs':
      return 'model/iges'
    default:
      return 'application/octet-stream'
  }
}
