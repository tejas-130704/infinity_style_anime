import fs from 'fs/promises'
import path from 'path'
import { UPLOAD_ROOT } from './constants'
import type { JobManifest } from './types'

export function jobDir(id: string): string {
  return path.join(UPLOAD_ROOT, id)
}

export function manifestPath(id: string): string {
  return path.join(jobDir(id), 'manifest.json')
}

export async function readManifest(id: string): Promise<JobManifest | null> {
  try {
    const raw = await fs.readFile(manifestPath(id), 'utf8')
    return JSON.parse(raw) as JobManifest
  } catch {
    return null
  }
}

export async function writeManifest(m: JobManifest): Promise<void> {
  const dir = jobDir(m.id)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(manifestPath(m.id), JSON.stringify(m, null, 2), 'utf8')
}

export async function ensureUploadRoot(): Promise<void> {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true })
}
