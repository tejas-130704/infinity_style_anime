export type JobFormat = 'stl' | 'obj' | 'step' | 'iges'

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'failed'

export interface JobManifestFile {
  /** Safe filename on disk (no path segments). */
  diskName: string
  /** Original client filename (for display). */
  originalName: string
  size: number
}

export interface JobManifest {
  id: string
  createdAt: string
  format: JobFormat
  status: JobStatus
  files: JobManifestFile[]
  /** Primary mesh file (relative name = diskName). */
  primaryDiskName: string
  /** For CAD: converted preview binary. */
  previewDiskName?: string
  /** Human-readable error when status === failed */
  error?: string
}
