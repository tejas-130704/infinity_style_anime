'use client'

import { useState, useRef, useCallback } from 'react'

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

interface PosterSize {
  id: string
  label: string
  dims: string       // display dimensions
  widthCm: number
  heightCm: number
  price: number      // ₹ base price
}

const POSTER_SIZES: PosterSize[] = [
  { id: 'a4',   label: 'A4',        dims: '21 × 29.7 cm',    widthCm: 21,   heightCm: 29.7, price: 199 },
  { id: 'a3',   label: 'A3',        dims: '29.7 × 42 cm',    widthCm: 29.7, heightCm: 42,   price: 349 },
  { id: 'a2',   label: 'A2',        dims: '42 × 59.4 cm',    widthCm: 42,   heightCm: 59.4, price: 599 },
  { id: '1824', label: '18 × 24″',  dims: '45.7 × 61 cm',    widthCm: 45.7, heightCm: 61,   price: 649 },
  { id: '2436', label: '24 × 36″',  dims: '60.9 × 91.4 cm',  widthCm: 60.9, heightCm: 91.4, price: 999 },
]

const FINISH_OPTIONS = [
  { id: 'matte',  label: 'Matte',   desc: 'Glare-free, gallery quality' },
  { id: 'glossy', label: 'Glossy',  desc: 'Vivid, high-contrast colours' },
  { id: 'satin',  label: 'Satin',   desc: 'Balanced sheen, versatile' },
]

const GST_RATE = 0.18

/* ─────────────────────────────────────────────
   STEP HEADER (same pattern as CustomActionFigure)
───────────────────────────────────────────── */

function StepHeader({
  number, label, active, done, onClick,
}: {
  number: number; label: string; active: boolean; done: boolean; onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
        active ? 'bg-white/5' : done ? 'opacity-80 hover:opacity-100' : 'opacity-40 cursor-default pointer-events-none'
      }`}
    >
      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
        active ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
               : done ? 'bg-green-600/80 text-white'
               : 'border border-white/20 text-white/40'
      }`}>
        {done ? '✓' : number}
      </span>
      <span className={`font-semibold text-sm tracking-wide ${
        active ? 'text-white' : done ? 'text-white/70' : 'text-white/30'
      }`}>
        {label}
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function PersonalizedPosters() {
  /* ── Image state ── */
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageSrc, setImageSrc]       = useState<string | null>(null)
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [isDragging, setIsDragging]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  /* ── Config state ── */
  const [activeStep, setActiveStep]   = useState(1)
  const [selectedSize, setSelectedSize] = useState<PosterSize | null>(null)
  const [selectedFinish, setSelectedFinish] = useState('matte')
  const [instructions, setInstructions] = useState('')

  /* ── Derived price ── */
  const price = selectedSize
    ? { base: selectedSize.price, total: Math.round(selectedSize.price * (1 + GST_RATE)) }
    : null

  /* ── File handling ── */
  const processFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowed = ['jpg', 'jpeg', 'png', 'webp']
    if (!allowed.includes(ext ?? '')) {
      setUploadError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20 MB.')
      return
    }
    setUploadError(null)
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImageSrc(url)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }, [processFile])

  const handleAddToCart = () => {
    if (!imageFile || !selectedSize) return
    const payload = {
      productType: 'personalized-poster',
      file: imageFile.name,
      size: selectedSize.label,
      dimensions: selectedSize.dims,
      finish: selectedFinish,
      price: price!.total,
      gstIncluded: true,
    }
    console.log('[Cart]', payload)
    alert(`Added to cart!\n\nSize: ${selectedSize.label} (${selectedSize.dims})\nFinish: ${selectedFinish}\nPrice: ₹${price!.total} (incl. GST)`)
  }

  const fileUploaded = !!imageSrc && !!imageFile

  return (
    <>
      {/* ─── Section header ─── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 id="pp-heading" className="font-cinzel text-2xl font-bold text-white md:text-3xl">
          Personalized Posters
        </h2>
        <span className="rounded-full bg-mugen-crimson/70 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-white ring-1 ring-mugen-crimson/40">
          New
        </span>
      </div>
      <p className="mb-8 max-w-2xl text-sm text-white/60 font-sans leading-relaxed">
        Upload your image and choose a print size. We deliver gallery-quality archival prints straight to your door.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ═══════════════════════════════
            LEFT PANEL — Image Preview + Upload
        ═══════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* Image preview area */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117] flex items-center justify-center"
            style={{ minHeight: 340 }}
          >
            {imageSrc ? (
              <>
                {/* Aspect ratio overlay for selected size */}
                {selectedSize && (
                  <div className="absolute top-3 left-3 z-10 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs text-white/80 font-mono shadow-lg">
                    <span className="text-indigo-300 font-semibold">{selectedSize.label}</span>
                    <span className="ml-2 text-white/40">{selectedSize.dims}</span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Poster preview"
                  className="max-h-[340px] max-w-full object-contain rounded-xl"
                  style={selectedSize ? {
                    aspectRatio: `${selectedSize.widthCm} / ${selectedSize.heightCm}`,
                    objectFit: 'cover',
                    maxHeight: 320,
                  } : undefined}
                />
                {/* Replace hint overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
                >
                  Replace image ↑
                </button>
              </>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                  {/* Image/photo icon */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-8 w-8 text-white/20">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
                  </svg>
                </div>
                <p className="text-xs text-white/25 font-sans">Upload your image to preview</p>
                <p className="text-[10px] text-white/15 mt-1">JPG · PNG · WebP</p>
              </div>
            )}
          </div>

          {/* Upload zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed px-5 py-4 transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500/70 bg-indigo-500/8'
                : fileUploaded
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-white/12 bg-white/2 hover:border-white/25 hover:bg-white/4'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                fileUploaded ? 'bg-green-500/15' : 'bg-white/5'
              }`}>
                {fileUploaded ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-white/40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.25 5.25 0 0 1 1.23 9.095H6.75Z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {fileUploaded ? (
                  <>
                    <p className="text-sm font-semibold text-white/85 truncate">{imageFile!.name}</p>
                    <p className="text-xs text-white/40">Click to replace · {(imageFile!.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white/70">UPLOAD IMAGE</p>
                    <p className="text-xs text-white/35">Drag & drop or click · JPG / PNG / WebP · Max 20 MB</p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="pp-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Upload poster image"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-mugen-crimson/80 font-semibold -mt-2">
            We support JPG, PNG, and WebP formats
          </p>

          {uploadError && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2.5 text-xs text-red-300">
              {uploadError}
            </p>
          )}

          {/* Image stats */}
          <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white/40 border-b border-white/6">
              Image Info
            </p>
            <table className="w-full text-xs">
              <tbody>
                {([
                  ['File', imageFile?.name ?? '—'],
                  ['Size', imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : '—'],
                  ['Print Size', selectedSize ? `${selectedSize.label} (${selectedSize.dims})` : '—'],
                  ['Finish', selectedFinish ? FINISH_OPTIONS.find(f => f.id === selectedFinish)?.label ?? '—' : '—'],
                ] as [string, string][]).map(([label, value]) => (
                  <tr key={label} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-white/45 font-medium">{label}</td>
                    <td className="px-4 py-2.5 text-white/75 text-right truncate max-w-[140px]">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════
            RIGHT PANEL — Steps
        ═══════════════════════════════ */}
        <div className="flex flex-col gap-3">

          {/* ── STEP 1: Size ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
            <StepHeader number={1} label="Print Size" active={activeStep === 1} done={activeStep > 1}
              onClick={() => setActiveStep(1)} />
            {activeStep === 1 && (
              <div className="px-4 pb-4">
                {selectedSize && (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/60">
                    <span className="font-semibold text-white/80">Size :</span>
                    {selectedSize.label} — {selectedSize.dims}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {POSTER_SIZES.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                        selectedSize?.id === s.id
                          ? 'border-indigo-500/50 bg-indigo-500/8'
                          : 'border-white/6 bg-white/2 hover:border-white/15'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poster-size"
                        value={s.id}
                        checked={selectedSize?.id === s.id}
                        onChange={() => setSelectedSize(s)}
                        className="accent-indigo-500 h-3.5 w-3.5 flex-shrink-0"
                      />
                      <span className={`text-sm font-semibold ${selectedSize?.id === s.id ? 'text-white' : 'text-white/65'}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-white/35 ml-1">{s.dims}</span>
                      <span className={`ml-auto text-xs font-bold ${selectedSize?.id === s.id ? 'text-indigo-300' : 'text-white/45'}`}>
                        ₹{s.price}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  id="pp-step1-next"
                  onClick={() => setActiveStep(2)}
                  className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
                >
                  NEXT
                </button>
              </div>
            )}
          </div>

          {/* ── STEP 2: Finish ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
            <StepHeader number={2} label="Paper Finish" active={activeStep === 2} done={activeStep > 2}
              onClick={() => activeStep > 2 && setActiveStep(2)} />
            {activeStep === 2 && (
              <div className="px-4 pb-4">
                {selectedFinish && (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs text-white/60">
                    <span className="font-semibold text-white/80">Finish :</span>
                    {FINISH_OPTIONS.find(f => f.id === selectedFinish)?.label}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {FINISH_OPTIONS.map((f) => (
                    <label
                      key={f.id}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                        selectedFinish === f.id
                          ? 'border-indigo-500/50 bg-indigo-500/8'
                          : 'border-white/6 bg-white/2 hover:border-white/15'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poster-finish"
                        value={f.id}
                        checked={selectedFinish === f.id}
                        onChange={() => setSelectedFinish(f.id)}
                        className="accent-indigo-500 h-3.5 w-3.5 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span className={`text-sm font-semibold ${selectedFinish === f.id ? 'text-white' : 'text-white/65'}`}>
                          {f.label}
                        </span>
                        <p className="text-xs text-white/35 mt-0.5">{f.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => setActiveStep(1)}
                    className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5">
                    BACK
                  </button>
                  <button id="pp-step2-next" onClick={() => setActiveStep(3)}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]">
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── STEP 3: Finalize ── */}
          <div className="rounded-xl border border-white/8 overflow-hidden bg-white/2">
            <StepHeader number={3} label="Finalize" active={activeStep === 3} done={false}
              onClick={() => undefined} />
            {activeStep === 3 && (
              <div className="px-4 pb-4">

                {/* Special instructions */}
                <div className="mb-3">
                  <label htmlFor="pp-instructions" className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1.5 block">
                    Special Instructions <span className="normal-case font-normal text-white/20">(optional)</span>
                  </label>
                  <textarea
                    id="pp-instructions"
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. rolled or flat packaging, border preference…"
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Summary */}
                <div className="rounded-lg border border-white/8 bg-white/3 p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-2">Order Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      ['Size', selectedSize?.label ?? '—'],
                      ['Dimensions', selectedSize?.dims ?? '—'],
                      ['Finish', FINISH_OPTIONS.find(f => f.id === selectedFinish)?.label ?? '—'],
                      ['Paper', '200 gsm Archival'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest text-white/28 font-semibold">{k}</span>
                        <span className="text-xs text-white/70 font-mono">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-indigo-400/70 mb-2 font-semibold">Final Price</p>
                  {price ? (
                    <>
                      <p className="font-cinzel text-3xl font-bold text-white tracking-wide">₹{price.total}</p>
                      <p className="text-xs text-white/40 mt-1">Includes 18% GST</p>
                    </>
                  ) : (
                    <>
                      <p className="font-cinzel text-3xl font-bold text-white/20">— —</p>
                      <p className="text-xs text-white/30 mt-1">Select a size to see pricing</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setActiveStep(2)}
                    className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5">
                    BACK
                  </button>
                  <button
                    id="pp-add-to-cart"
                    type="button"
                    disabled={!fileUploaded || !selectedSize}
                    onClick={handleAddToCart}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold font-cinzel uppercase tracking-widest text-white transition-all ${
                      fileUploaded && selectedSize
                        ? 'bg-mugen-crimson/80 hover:bg-mugen-crimson cursor-pointer shadow-[0_0_20px_rgba(134,56,65,0.35)] hover:shadow-[0_0_28px_rgba(134,56,65,0.5)]'
                        : 'bg-mugen-crimson/25 opacity-50 cursor-not-allowed'
                    }`}
                    aria-label="Add personalized poster to cart"
                  >
                    Add to Cart
                  </button>
                </div>
                {!fileUploaded && (
                  <p className="mt-2 text-center text-xs text-white/30">Upload an image to enable checkout</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
