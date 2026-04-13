import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import {
  ALLOWED_PRIMARY_EXT,
  CAD_EXT,
  MAX_UPLOAD_BYTES,
  OBJ_COMPANION_EXT,
} from '@/lib/upload-3d/constants'
import { enqueueCadConversion } from '@/lib/upload-3d/job-runner'
import { ensureUploadRoot, jobDir, writeManifest } from '@/lib/upload-3d/manifest'
import { extractMtllibNames, normalizeName } from '@/lib/upload-3d/obj-deps'
import { getExtension, sanitizeBasename } from '@/lib/upload-3d/sanitize'
import type { JobFormat, JobManifest } from '@/lib/upload-3d/types'

function mapPrimaryExtToFormat(ext: string): JobFormat {
  if (ext === 'stl' || ext === 'obj') return ext
  if (ext === 'stp' || ext === 'step') return 'step'
  return 'iges'
}

function validateStlBuffer(buf: Buffer): void {
  if (buf.length < 80) {
    throw new Error('STL file is too small or corrupted.')
  }
  const head = buf.subarray(0, 5).toString('ascii')
  const isAscii = head.toLowerCase().startsWith('solid')
  if (isAscii) return
  const tri = buf.readUInt32LE(80)
  const expected = 84 + tri * 50
  if (tri < 0 || tri > 2_000_000_000 || buf.length < expected) {
    throw new Error('Binary STL appears corrupted (triangle count mismatch).')
  }
}

function uniqueDiskName(used: Set<string>, desired: string): string {
  if (!used.has(desired)) {
    used.add(desired)
    return desired
  }
  const ext = getExtension(desired)
  const stem = ext ? desired.slice(0, -(ext.length + 1)) : desired
  let i = 2
  while (i < 10000) {
    const candidate = ext ? `${stem}_${i}.${ext}` : `${stem}_${i}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
    i++
  }
  throw new Error('Too many filename collisions.')
}

export async function POST(req: Request) {
  try {
    await ensureUploadRoot()
    const ct = req.headers.get('content-type') || ''
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 })
    }

    const form = await req.formData()
    const primary = form.get('primary')
    if (!(primary instanceof File) || primary.size <= 0) {
      return NextResponse.json({ error: 'Missing primary file.' }, { status: 400 })
    }

    const companionsRaw = form.getAll('companions').filter((x): x is File => x instanceof File)

    let total = primary.size
    for (const c of companionsRaw) total += c.size
    if (total > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `Total upload size exceeds ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
        },
        { status: 413 },
      )
    }

    const primaryExt = getExtension(primary.name)
    if (!ALLOWED_PRIMARY_EXT.has(primaryExt)) {
      return NextResponse.json(
        {
          error: `Unsupported format ".${primaryExt}". Use .stl, .obj, .step, .stp, .iges, or .igs.`,
        },
        { status: 400 },
      )
    }

    const primaryBuf = Buffer.from(await primary.arrayBuffer())

    if (primaryExt === 'stl') {
      try {
        validateStlBuffer(primaryBuf)
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'Invalid STL file.' },
          { status: 400 },
        )
      }
    }

    if (primaryExt === 'obj') {
      const text = new TextDecoder().decode(primaryBuf.subarray(0, Math.min(primaryBuf.length, 65536)))
      const mtls = extractMtllibNames(text)
      const namesPresent = new Set<string>()
      namesPresent.add(normalizeName(sanitizeBasename(primary.name)))
      namesPresent.add(normalizeName(primary.name.split(/[/\\]/).pop() || ''))
      for (const f of companionsRaw) {
        namesPresent.add(normalizeName(sanitizeBasename(f.name)))
        namesPresent.add(normalizeName(f.name.split(/[/\\]/).pop() || ''))
      }
      for (const m of mtls) {
        if (!namesPresent.has(normalizeName(m))) {
          return NextResponse.json(
            {
              error: `OBJ references material library "${m}" but that file was not uploaded. Include all .mtl and texture files.`,
            },
            { status: 400 },
          )
        }
      }
      for (const f of companionsRaw) {
        const e = getExtension(f.name)
        if (!OBJ_COMPANION_EXT.has(e)) {
          return NextResponse.json(
            {
              error: `Companion file ".${e}" is not allowed for OBJ uploads. Use .mtl or common image formats.`,
            },
            { status: 400 },
          )
        }
      }
    } else if (companionsRaw.length > 0) {
      return NextResponse.json(
        { error: 'Companion files are only supported when the primary file is .obj.' },
        { status: 400 },
      )
    }

    const id = randomUUID()
    const dir = jobDir(id)
    await fs.mkdir(dir, { recursive: true })

    const used = new Set<string>()
    const files: JobManifest['files'] = []

    const primaryDisk = uniqueDiskName(used, sanitizeBasename(primary.name))
    await fs.writeFile(path.join(dir, primaryDisk), primaryBuf)
    files.push({
      diskName: primaryDisk,
      originalName: primary.name,
      size: primaryBuf.length,
    })

    for (const f of companionsRaw) {
      const disk = uniqueDiskName(used, sanitizeBasename(f.name))
      const b = Buffer.from(await f.arrayBuffer())
      await fs.writeFile(path.join(dir, disk), b)
      files.push({
        diskName: disk,
        originalName: f.name,
        size: b.length,
      })
    }

    const format = mapPrimaryExtToFormat(primaryExt)
    const isCad = CAD_EXT.has(primaryExt)

    const manifest: JobManifest = {
      id,
      createdAt: new Date().toISOString(),
      format,
      status: isCad ? 'queued' : 'ready',
      files,
      primaryDiskName: primaryDisk,
    }

    await writeManifest(manifest)

    if (isCad) {
      void enqueueCadConversion(id)
    }

    return NextResponse.json({
      id,
      status: manifest.status,
      format,
      modelBasePath: `/api/model/${id}`,
      message: isCad
        ? 'CAD file received. Conversion to preview mesh has started.'
        : 'Upload complete. You can load the preview now.',
    })
  } catch (e) {
    console.error('[upload-3d]', e)
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : 'Upload failed. Please try again with a valid model file.',
      },
      { status: 500 },
    )
  }
}
