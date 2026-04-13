import fs from 'fs/promises'
import path from 'path'
import { convertCadBufferToGlb } from './convert-cad'
import { jobDir, readManifest, writeManifest } from './manifest'

const running = new Set<string>()

export async function enqueueCadConversion(id: string): Promise<void> {
  if (running.has(id)) return
  running.add(id)
  try {
    const m = await readManifest(id)
    if (!m || m.status === 'completed' || m.status === 'failed') return

    m.status = 'processing'
    await writeManifest(m)

    const primary = m.files.find((f) => f.diskName === m.primaryDiskName)
    if (!primary) throw new Error('Primary file missing from job.')

    const buf = await fs.readFile(path.join(jobDir(id), primary.diskName))
    const fmt = m.format === 'iges' ? 'iges' : 'step'
    const glb = await convertCadBufferToGlb(buf, fmt)
    const previewName = 'preview.glb'
    await fs.writeFile(path.join(jobDir(id), previewName), Buffer.from(glb))

    const done = await readManifest(id)
    if (!done) return
    done.previewDiskName = previewName
    done.status = 'completed'
    delete done.error
    await writeManifest(done)
  } catch (e) {
    const m = await readManifest(id)
    if (m) {
      m.status = 'failed'
      m.error =
        e instanceof Error
          ? e.message
          : 'CAD conversion failed. Try exporting as mesh (STL/OBJ) or a simpler STEP/IGES file.'
      await writeManifest(m)
    }
  } finally {
    running.delete(id)
  }
}
