'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, Upload, Trash2, Pencil, AlertCircle, CheckCircle2,
  Image as ImageIcon, Box, Palette, Ruler, Package, Tag
} from 'lucide-react'
import type { ProductRow } from '@/components/shop/ProductCard'

/* ── Constants ─────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'posters',              label: 'Posters' },
  { value: 'action_figures',       label: 'Action Figures' },
  { value: 'limited_edition',      label: 'Limited Edition' },
  { value: 'custom_action_figure', label: 'Custom Action Figure' },
  { value: 'personalized_posters', label: 'Personalized Posters' },
] as const
type CategoryValue = (typeof CATEGORIES)[number]['value']

const POSTER_SIZES = ['A4', 'A3', 'A2', '24×36"', '18×24"']

const COLOR_MAP: Record<string, string> = {
  red: '#e53e3e', pink: '#ed64a6', blue: '#4299e1', navy: '#2b4375',
  black: '#1a1a1a', white: '#f5f5f5', grey: '#9ca3af', gray: '#9ca3af',
  green: '#48bb78', yellow: '#ecc94b', orange: '#ed8936', purple: '#9f7aea',
  gold: '#c6a86c', silver: '#b0c4de', brown: '#92400e', cyan: '#38b2ac',
  crimson: '#863841', magenta: '#b84d7a', violet: '#7c3aed', teal: '#14b8a6',
}
function swatchColor(n: string) {
  return COLOR_MAP[n.trim().toLowerCase()] ?? '#555555'
}

/* ── Formatters ────────────────────────────────────────────────────── */
function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100)
}
function paiseFromInput(s: string) {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return NaN
  return Math.round(n * 100)
}

/* ── Image preview card ────────────────────────────────────────────── */
function ImagePreview({ url, onRemove, isPrimary }: { url: string; onRemove: () => void; isPrimary: boolean }) {
  return (
    <div className="relative group aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {isPrimary && (
        <span className="absolute top-1.5 left-1.5 rounded-full bg-mugen-crimson/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Primary
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full
                   bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity
                   hover:bg-red-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ── Color tag ─────────────────────────────────────────────────────── */
function ColorTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm">
      <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: swatchColor(name) }} />
      <span className="text-white/80">{name}</span>
      <button type="button" onClick={onRemove} className="ml-0.5 text-white/30 hover:text-red-400 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

/* ── Section wrapper ───────────────────────────────────────────────── */
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="mb-5 flex items-center gap-2.5 font-cinzel text-base font-bold text-white/80">
        <span className="text-mugen-magenta">{icon}</span>
        {title}
      </h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

/* ── Form field ────────────────────────────────────────────────────── */
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-white/70">
        {label} {required && <span className="text-mugen-crimson">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/30">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-white/10 bg-mugen-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-mugen-magenta/50 focus:ring-1 focus:ring-mugen-magenta/20'

/* ══════════════════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════════════════ */
export default function AdminProductsPage() {
  /* ── Product list ── */
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [globalErr, setGlobalErr] = useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  /* ── Basic info ── */
  const [name,     setName]     = useState('')
  const [category, setCategory] = useState<CategoryValue>('posters')
  const [desc,     setDesc]     = useState('')

  /* ── Pricing ── */
  const [priceInput,    setPriceInput]    = useState('')
  const [originalInput, setOriginalInput] = useState('')

  /* ── Images ── */
  const [imageUrls, setImageUrls] = useState<string[]>([])   // [primary, ...extra]
  const [uploading, setUploading] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

  /* ── STL ── */
  const [stlUrl,     setStlUrl]     = useState('')
  const [stlUploading, setStlUploading] = useState(false)
  const stlFileRef = useRef<HTMLInputElement>(null)

  /* ── Colors ── */
  const [colorInput, setColorInput] = useState('')
  const [colors,     setColors]     = useState<string[]>([])
  const [isMultiColor, setIsMultiColor] = useState(false)

  /* ── Action figure metadata ── */
  const [modelName, setModelName] = useState('')
  const [heightCm,  setHeightCm]  = useState('')
  const [weightG,   setWeightG]   = useState('')

  /* ── Poster sizes ── */
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  /* ── Computed ── */
  const isActionFigure = category === 'action_figures'
  const isPoster = category === 'posters' || category === 'limited_edition' || category === 'personalized_posters'

  const priceVal    = paiseFromInput(priceInput)
  const origVal     = paiseFromInput(originalInput)
  const discountPct = (Number.isFinite(priceVal) && Number.isFinite(origVal) && origVal > priceVal)
    ? Math.round(((origVal - priceVal) / origVal) * 100)
    : 0

  /* ── Load products ── */
  const load = useCallback(async () => {
    const res = await fetch('/api/products')
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { setGlobalErr(j.error || 'Failed to load'); return }
    setProducts(j.products ?? [])
  }, [])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  /* ── Reset ── */
  function reset() {
    setEditingId(null); setName(''); setCategory('posters'); setDesc('')
    setPriceInput(''); setOriginalInput(''); setImageUrls([])
    setStlUrl(''); setColors([]); setIsMultiColor(false)
    setModelName(''); setHeightCm(''); setWeightG('')
    setSelectedSizes([]); setGlobalErr(null); setSavedId(null)
  }

  /* ── Image upload → Supabase Storage ── */
  async function handleImageFiles(files: FileList) {
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const ext  = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false })
      if (error) { setGlobalErr(`Upload failed: ${error.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      newUrls.push(publicUrl)
    }
    setImageUrls(prev => [...prev, ...newUrls])
    setUploading(false)
  }

  /* ── STL upload → Supabase Storage ── */
  async function handleStlFile(files: FileList) {
    const file = files[0]
    if (!file) return
    setStlUploading(true)
    const supabase = createClient()
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('product-stl').upload(path, file, { upsert: false })
    if (error) { setGlobalErr(`STL upload failed: ${error.message}`); setStlUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('product-stl').getPublicUrl(path)
    setStlUrl(publicUrl)
    setStlUploading(false)
  }

  /* ── Add color ── */
  function addColor() {
    const c = colorInput.trim()
    if (!c || colors.includes(c)) return
    setColors(prev => [...prev, c])
    setColorInput('')
  }

  /* ── Toggle size ── */
  function toggleSize(s: string) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  /* ── Load product into edit form ── */
  async function startEdit(p: ProductRow & Record<string, unknown>) {
    setEditingId(p.id)
    setName(p.name)
    setCategory((p.category ?? 'posters') as CategoryValue)
    setDesc((p.description as string) ?? '')
    setPriceInput(String((p.price / 100).toFixed(2)))
    setOriginalInput(p.original_price ? String(((p.original_price as number) / 100).toFixed(2)) : '')
    setModelName((p.model_name as string) ?? '')
    setHeightCm(p.height_cm != null ? String(p.height_cm) : '')
    setWeightG(p.weight_g != null ? String(p.weight_g) : '')
    setIsMultiColor((p.is_multi_color as boolean) ?? false)
    setStlUrl((p.model_url as string) ?? '')

    // Images
    const extras: string[] = (() => {
      try { return JSON.parse((p.extra_images as string) ?? '[]') } catch { return [] }
    })()
    setImageUrls([...(p.image_url ? [p.image_url as string] : []), ...extras])

    // Colors
    const colorStr = (p.color as string) ?? ''
    setColors(colorStr ? colorStr.split(',').map(c => c.trim()).filter(Boolean) : [])

    // Sizes
    const sizesArr: string[] = (() => {
      try { return JSON.parse((p.sizes as string) ?? '[]') } catch { return [] }
    })()
    setSelectedSizes(sizesArr)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Submit ── */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalErr(null)
    const price = paiseFromInput(priceInput)
    if (!name.trim() || !Number.isFinite(price) || price < 0) {
      setGlobalErr('Please enter a valid name and price')
      return
    }
    const original_price = Number.isFinite(origVal) && origVal > 0 ? origVal : null
    const image_url  = imageUrls[0] ?? null
    const extra_imgs = imageUrls.slice(1)
    const payload = {
      name: name.trim(),
      description: desc || null,
      price,
      original_price,
      category,
      image_url,
      model_url: stlUrl || null,
      extra_images: extra_imgs.length ? extra_imgs : null,
      model_name: modelName || null,
      color: colors.length ? colors.join(',') : null,
      is_multi_color: isMultiColor,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_g: weightG ? parseFloat(weightG) : null,
      sizes: selectedSizes.length ? selectedSizes : null,
    }
    setSaving(true)
    try {
      const url    = editingId ? `/api/products/${editingId}` : '/api/products'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setGlobalErr(j.error || 'Save failed'); return }
      setSavedId(j.product?.id ?? 'ok')
      reset()
      await load()
      setTimeout(() => setSavedId(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ── */
  async function remove(id: string) {
    if (!confirm('Delete this product?')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) { const j = await res.json().catch(() => ({})); setGlobalErr(j.error || 'Delete failed'); return }
    if (editingId === id) reset()
    await load()
  }

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-white">Products</h1>
          <p className="mt-1 text-sm text-white/45">Create and manage your product catalog</p>
        </div>
        {savedId && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-900/20 px-4 py-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Product saved!
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">

        {/* ── Global error ── */}
        {globalErr && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{globalErr}</span>
          </div>
        )}

        {/* ═══ SECTION: Basic Info ═══ */}
        <Section icon={<Tag className="h-4 w-4" />} title="Basic Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Product Name" required>
                <input
                  required
                  className={inputCls}
                  placeholder="e.g. Gojo Satoru — Infinity Pose"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Product Type" required>
              <select
                className={inputCls}
                value={category}
                onChange={e => setCategory(e.target.value as CategoryValue)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Describe materials, finish, dimensions, series…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </Field>
        </Section>

        {/* ═══ SECTION: Images ═══ */}
        <Section icon={<ImageIcon className="h-4 w-4" />} title="Product Images">
          {/* Upload zone */}
          <div
            className="relative flex cursor-pointer flex-col items-center justify-center gap-3
                       rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] py-10
                       transition-all hover:border-mugen-magenta/40 hover:bg-mugen-magenta/5"
            onClick={() => imageFileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-white/20" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white/50">Click to upload images</p>
              <p className="text-xs text-white/25 mt-0.5">PNG, JPG, WebP — multiple files allowed</p>
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-mugen-black/60">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-mugen-magenta" />
              </div>
            )}
          </div>
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleImageFiles(e.target.files)}
          />

          {/* URL fallback */}
          <Field label="Or paste an image URL directly" hint="First URL becomes the primary (cover) image">
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="https://…"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) { setImageUrls(p => [...p, val]);(e.target as HTMLInputElement).value = '' }
                  }
                }}
              />
              <button
                type="button"
                className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white/60 hover:bg-white/10"
                onClick={(e) => {
                  const inp = (e.currentTarget.previousElementSibling as HTMLInputElement)
                  const val = inp.value.trim()
                  if (val) { setImageUrls(p => [...p, val]); inp.value = '' }
                }}
              >
                Add
              </button>
            </div>
          </Field>

          {/* Previews */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {imageUrls.map((url, i) => (
                <ImagePreview
                  key={url + i}
                  url={url}
                  isPrimary={i === 0}
                  onRemove={() => setImageUrls(p => p.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ═══ SECTION: Pricing ═══ */}
        <Section icon={<Tag className="h-4 w-4" />} title="Pricing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling Price (₹)" required hint="Enter in rupees, e.g. 1499">
              <input
                required
                className={inputCls}
                placeholder="1499"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
              />
            </Field>
            <Field label="Original MRP (₹)" hint="Leave blank if no discount">
              <input
                className={inputCls}
                placeholder="1999"
                value={originalInput}
                onChange={e => setOriginalInput(e.target.value)}
              />
            </Field>
          </div>
          {discountPct > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-900/10 px-4 py-3">
              <span className="rounded-md bg-mugen-crimson/80 px-2.5 py-0.5 font-sans text-sm font-extrabold text-white">
                -{discountPct}%
              </span>
              <span className="text-sm text-white/60">
                Customer saves {fmt(origVal - priceVal)}
              </span>
            </div>
          )}
        </Section>

        {/* ═══ SECTION: Action Figure Variants ═══ */}
        {isActionFigure && (
          <Section icon={<Palette className="h-4 w-4" />} title="Action Figure Details">
            {/* Color type toggle */}
            <div>
              <p className="mb-3 text-sm font-semibold text-white/70">Colour Type</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMultiColor(false)}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all
                             ${!isMultiColor
                               ? 'border-mugen-magenta bg-mugen-magenta/10 text-white'
                               : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20'}`}
                >
                  Single / Multiple Colour Options
                  <span className="mt-0.5 block text-[11px] font-normal text-inherit/60">User selects a colour</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMultiColor(true)}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all
                             ${isMultiColor
                               ? 'border-mugen-magenta bg-mugen-magenta/10 text-white'
                               : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20'}`}
                >
                  Multi-Colour Model
                  <span className="mt-0.5 block text-[11px] font-normal text-inherit/60">Pre-painted, no selection</span>
                </button>
              </div>
            </div>

            {/* Color inputs */}
            <Field
              label="Colour Options"
              hint="Press Enter or click Add. e.g. Black, White, Crimson"
            >
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder="Black"
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }}
                />
                <button
                  type="button"
                  onClick={addColor}
                  className="flex-shrink-0 flex items-center gap-1 rounded-xl border border-white/10
                             bg-white/5 px-3 text-xs text-white/60 hover:bg-white/10 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {colors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map(c => (
                    <ColorTag key={c} name={c} onRemove={() => setColors(p => p.filter(x => x !== c))} />
                  ))}
                </div>
              )}
            </Field>

            {/* Physical metadata */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Model Name" hint="e.g. Gojo Satoru">
                <input className={inputCls} placeholder="Gojo Satoru" value={modelName} onChange={e => setModelName(e.target.value)} />
              </Field>
              <Field label="Height (cm)">
                <input type="number" min={0} step={0.1} className={inputCls} placeholder="15" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
              </Field>
              <Field label="Weight (g)">
                <input type="number" min={0} step={1} className={inputCls} placeholder="300" value={weightG} onChange={e => setWeightG(e.target.value)} />
              </Field>
            </div>
          </Section>
        )}

        {/* ═══ SECTION: Poster Sizes ═══ */}
        {isPoster && (
          <Section icon={<Ruler className="h-4 w-4" />} title="Available Sizes">
            <p className="text-xs text-white/40">Select which sizes you offer for this poster</p>
            <div className="flex flex-wrap gap-2">
              {POSTER_SIZES.map(s => {
                const active = selectedSizes.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`rounded-xl border-2 px-5 py-2.5 font-cinzel text-sm font-bold transition-all
                               ${active
                                 ? 'border-mugen-magenta bg-mugen-magenta/12 text-white shadow-[0_0_14px_rgba(184,77,122,0.25)]'
                                 : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20 hover:bg-white/5'}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            {selectedSizes.length > 0 && (
              <p className="text-xs text-white/40">Selected: {selectedSizes.join(', ')}</p>
            )}
          </Section>
        )}

        {/* ═══ SECTION: 3D Model / STL ═══ */}
        {isActionFigure && (
          <Section icon={<Box className="h-4 w-4" />} title="3D Model (STL File)">
            <p className="text-xs text-white/40">Upload an STL file for the interactive 3D viewer on the product page</p>

            <div
              className="relative flex cursor-pointer flex-col items-center justify-center gap-3
                         rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] py-8
                         transition-all hover:border-mugen-gold/40 hover:bg-mugen-gold/5"
              onClick={() => stlFileRef.current?.click()}
            >
              <Box className="h-7 w-7 text-white/20" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white/50">Click to upload STL file</p>
                <p className="text-xs text-white/25 mt-0.5">.stl format only</p>
              </div>
              {stlUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-mugen-black/60">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-mugen-gold" />
                </div>
              )}
            </div>
            <input
              ref={stlFileRef}
              type="file"
              accept=".stl"
              className="hidden"
              onChange={e => e.target.files && handleStlFile(e.target.files)}
            />

            {stlUrl && (
              <div className="flex items-center gap-3 rounded-xl border border-mugen-gold/20 bg-mugen-gold/5 px-4 py-3">
                <Box className="h-4 w-4 text-mugen-gold/60" />
                <span className="flex-1 truncate text-xs text-mugen-gold/80">{stlUrl}</span>
                <button type="button" onClick={() => setStlUrl('')} className="text-white/30 hover:text-red-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Field label="Or paste STL file URL" hint="Provide a Supabase Storage / CDN URL">
              <input
                className={inputCls}
                placeholder="https://…/model.stl"
                value={stlUrl}
                onChange={e => setStlUrl(e.target.value)}
              />
            </Field>
          </Section>
        )}

        {/* ═══ SECTION: Physical Attributes (non-action-figure) ═══ */}
        {!isActionFigure && (
          <Section icon={<Package className="h-4 w-4" />} title="Physical Attributes">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Height / Dimensions">
                <input className={inputCls} placeholder="e.g. 21 × 29.7 cm" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
              </Field>
              <Field label="Weight (g)">
                <input type="number" min={0} step={1} className={inputCls} placeholder="120" value={weightG} onChange={e => setWeightG(e.target.value)} />
              </Field>
            </div>
          </Section>
        )}

        {/* ═══ FORM ACTIONS ═══ */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border border-mugen-crimson/60
                       bg-gradient-to-r from-mugen-crimson to-mugen-magenta px-6 py-3
                       font-cinzel text-sm font-bold text-white shadow-[0_4px_24px_rgba(134,56,65,0.4)]
                       transition hover:shadow-[0_6px_32px_rgba(184,77,122,0.5)] hover:scale-[1.01]
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
            ) : editingId ? (
              <><Pencil className="h-4 w-4" /> Update Product</>
            ) : (
              <><Plus className="h-4 w-4" /> Create Product</>
            )}
          </button>
          {editingId && (
            <button
              type="button"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/5"
              onClick={reset}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* ════════════════════════════════════════
          PRODUCT CATALOG TABLE
      ════════════════════════════════════════ */}
      <section className="mt-14">
        <h2 className="mb-4 font-cinzel text-xl font-bold text-white">Catalog</h2>
        {loading ? (
          <div className="flex items-center gap-3 text-white/40 text-sm py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-mugen-magenta" />
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <p className="py-8 text-center text-white/30 text-sm">No products yet. Create your first product above.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/8 bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-white/60">Name</th>
                  <th className="px-4 py-3.5 font-semibold text-white/60">Type</th>
                  <th className="px-4 py-3.5 font-semibold text-white/60">Price</th>
                  <th className="px-4 py-3.5 font-semibold text-white/60">MRP</th>
                  <th className="px-4 py-3.5 font-semibold text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.map(p => {
                  const ext = p as ProductRow & Record<string, unknown>
                  const hasDeal = ext.original_price != null && (ext.original_price as number) > p.price
                  const dpct = hasDeal ? Math.round((((ext.original_price as number) - p.price) / (ext.original_price as number)) * 100) : 0
                  return (
                    <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-white/8" />
                          )}
                          <span className="font-medium text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-white/50 capitalize">{p.category.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3.5 font-cinzel font-bold text-mugen-gold">{fmt(p.price)}</td>
                      <td className="px-4 py-3.5">
                        {hasDeal ? (
                          <span className="flex items-center gap-2">
                            <span className="text-white/35 line-through text-xs">{fmt(ext.original_price as number)}</span>
                            <span className="rounded-md bg-mugen-crimson/80 px-1.5 py-0.5 text-[10px] font-bold text-white">-{dpct}%</span>
                          </span>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(ext)}
                            className="flex items-center gap-1 text-xs font-semibold text-mugen-gold/70 hover:text-mugen-gold transition"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(p.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-400/60 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
