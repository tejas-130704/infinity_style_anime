import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { UUID_RE } from './constants'
import { mimeForFilename } from './mime'
import { jobDir, readManifest } from './manifest'
import { assertNoPathTraversal } from './sanitize'

export async function serveModelFile(id: string, pathSegs: string[] | undefined) {
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 })
  }

  const m = await readManifest(id)
  if (!m) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const allowed = new Set(m.files.map((f) => f.diskName))
  if (m.previewDiskName) allowed.add(m.previewDiskName)

  const isCad = m.format === 'step' || m.format === 'iges'

  let filename: string
  if (!pathSegs?.length) {
    if (isCad) {
      if (m.status === 'failed') {
        return NextResponse.json(
          { error: m.error || 'CAD conversion failed.' },
          { status: 422 },
        )
      }
      if (m.status === 'completed' && m.previewDiskName) {
        filename = m.previewDiskName
      } else if (m.status === 'queued' || m.status === 'processing') {
        return NextResponse.json(
          { error: 'CAD preview mesh is still processing. Try again in a few seconds.' },
          { status: 425 },
        )
      } else {
        filename = m.primaryDiskName
      }
    } else {
      filename = m.primaryDiskName
    }
  } else {
    filename = pathSegs.join('/')
  }

  try {
    assertNoPathTraversal(filename)
  } catch {
    return NextResponse.json({ error: 'Invalid path.' }, { status: 400 })
  }

  if (!allowed.has(filename)) {
    return NextResponse.json({ error: 'File not part of this upload.' }, { status: 403 })
  }

  const abs = path.join(jobDir(id), filename)
  const data = await fs.readFile(abs)
  const headers = new Headers()
  headers.set('Content-Type', mimeForFilename(filename))
  headers.set('Cache-Control', 'private, max-age=3600')
  return new NextResponse(data, { headers })
}
