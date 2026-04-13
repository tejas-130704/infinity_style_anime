import { NextResponse } from 'next/server'
import { UUID_RE } from '@/lib/upload-3d/constants'
import { readManifest } from '@/lib/upload-3d/manifest'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id') || ''
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 })
  }

  const m = await readManifest(id)
  if (!m) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
  }

  return NextResponse.json({
    id: m.id,
    status: m.status,
    format: m.format,
    error: m.error ?? null,
    primaryDiskName: m.primaryDiskName,
    previewReady:
      m.status === 'ready' ||
      m.status === 'completed' ||
      (m.format === 'obj' && m.status === 'ready'),
    modelBasePath: `/api/model/${m.id}`,
    previewFile:
      m.previewDiskName ||
      (m.format === 'stl' || m.format === 'obj' ? m.primaryDiskName : null),
  })
}
