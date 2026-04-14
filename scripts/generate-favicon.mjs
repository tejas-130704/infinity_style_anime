/**
 * Generate favicon assets from /public/favicon.svg
 *
 * Outputs:
 *   /public/favicon.ico          — multi-res ICO (16, 32, 48 px)
 *   /public/favicon-16x16.png
 *   /public/favicon-32x32.png
 *   /public/favicon-48x48.png
 *   /public/favicon-192x192.png  — Android home-screen / PWA
 *   /public/favicon-512x512.png  — PWA splash
 *   /public/apple-touch-icon.png — iOS home-screen (180×180)
 *   /public/icon.svg             — replaces the generic SVG with the branded one
 *
 * Run: node scripts/generate-favicon.mjs
 */

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC   = path.resolve(__dirname, '..', 'public')
const SVG_SRC  = path.join(PUBLIC, 'favicon.svg')

/* ─── Inline ICO writer (no extra deps) ─────────────────────────────────── */
// An ICO file is: ICONDIR header + ICONDIRENTRY[] + image data (BMP or PNG).
// Modern browsers support PNG-in-ICO so we embed raw PNGs directly.
async function buildIco(pngBuffers, sizes) {
  const NUM   = pngBuffers.length
  const IDIR  = 6              // ICONDIR  = 3 × WORD
  const ENTRY = 16             // ICONDIRENTRY = 16 bytes each
  const headerSize = IDIR + ENTRY * NUM

  // Calculate offsets
  const offsets = []
  let offset = headerSize
  for (const buf of pngBuffers) {
    offsets.push(offset)
    offset += buf.length
  }

  const totalSize = offset
  const ico = Buffer.alloc(totalSize)
  let pos = 0

  // ICONDIR
  ico.writeUInt16LE(0,   pos);     pos += 2  // reserved, must be 0
  ico.writeUInt16LE(1,   pos);     pos += 2  // type: 1 = icon
  ico.writeUInt16LE(NUM, pos);     pos += 2  // image count

  // One ICONDIRENTRY per image
  for (let i = 0; i < NUM; i++) {
    const sz  = sizes[i]
    const dim = sz >= 256 ? 0 : sz  // 0 means 256 in ICO spec

    ico.writeUInt8(dim,              pos);     pos += 1  // width
    ico.writeUInt8(dim,              pos);     pos += 1  // height
    ico.writeUInt8(0,                pos);     pos += 1  // color count (0 = no palette)
    ico.writeUInt8(0,                pos);     pos += 1  // reserved
    ico.writeUInt16LE(1,             pos);     pos += 2  // color planes
    ico.writeUInt16LE(32,            pos);     pos += 2  // bits per pixel
    ico.writeUInt32LE(pngBuffers[i].length, pos); pos += 4  // image data size
    ico.writeUInt32LE(offsets[i],    pos);     pos += 4  // image data offset
  }

  // Image data
  for (const buf of pngBuffers) {
    buf.copy(ico, pos)
    pos += buf.length
  }

  return ico
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
async function main() {
  console.log('📐 Reading favicon.svg…')
  const svgBuf = await fs.readFile(SVG_SRC)

  const tasks = [
    { name: 'favicon-16x16.png',    size: 16  },
    { name: 'favicon-32x32.png',    size: 32  },
    { name: 'favicon-48x48.png',    size: 48  },
    { name: 'favicon-192x192.png',  size: 192 },
    { name: 'favicon-512x512.png',  size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ]

  const pngBuffers = {}

  for (const { name, size } of tasks) {
    const buf = await sharp(svgBuf)
      .resize(size, size)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer()

    pngBuffers[name] = { buf, size }
    await fs.writeFile(path.join(PUBLIC, name), buf)
    console.log(`  ✅ ${name} (${size}×${size})`)
  }

  // ── Build favicon.ico with 16, 32, 48 ──────────────────────────────────
  const icoSizes = [16, 32, 48]
  const icoPngs  = icoSizes.map(s =>
    pngBuffers[`favicon-${s}x${s}.png`].buf
  )

  const icoBuf = await buildIco(icoPngs, icoSizes)
  await fs.writeFile(path.join(PUBLIC, 'favicon.ico'), icoBuf)
  console.log('  ✅ favicon.ico (16, 32, 48 px)')

  // ── Replace icon.svg with the branded version ───────────────────────────
  const brandedSvg = await fs.readFile(SVG_SRC)
  await fs.writeFile(path.join(PUBLIC, 'icon.svg'), brandedSvg)
  console.log('  ✅ icon.svg updated')

  console.log('\n🎉 All favicon assets generated successfully!')
}

main().catch((err) => {
  console.error('❌ Favicon generation failed:', err)
  process.exit(1)
})
