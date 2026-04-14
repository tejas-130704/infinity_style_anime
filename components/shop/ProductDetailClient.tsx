'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  Star, Box, ShoppingCart, Heart, Share2,
  Truck, ShieldCheck, Award, Package, Ruler, Zap
} from 'lucide-react'
import { ImageGallery, type GalleryImage } from '@/components/shop/ImageGallery'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { isCatalogPremiumCategory } from '@/lib/premium-assets-policy'
import { getRetailPricing } from '@/lib/pricing-utils'
import { productDetailPath } from '@/lib/product-path'

/* Lazy-load 3D viewer (avoids SSR issues with three.js) */
const ModelViewer = dynamic(
  () => import('@/components/shop/ModelViewer').then(m => ({ default: m.ModelViewer })),
  { ssr: false, loading: () => <ViewerSkeleton /> }
)

function ViewerSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-mugen-magenta/20 bg-[#1a1816] py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-mugen-crimson/20 border-t-mugen-magenta" />
      <p className="text-xs text-white/40">Loading 3D viewer…</p>
    </div>
  )
}

/* ── Types ─────────────────────────────────────────────────────────────── */
export interface ProductFull {
  id: string
  name: string
  description: string | null
  price: number                     // in paise
  category: string
  image_url: string | null
  model_url: string | null
  slug: string | null
  model_name?: string | null
  color?: string | null             // comma-separated e.g. "Red,Blue" or single "Pink"
  is_multi_color?: boolean
  height_cm?: number | null
  weight_g?: number | null
  original_price?: number | null    // in paise
  extra_images?: string | null      // JSON array of url strings or {url, alt?} objects
  rating?: number | null
  rating_count?: number | null
  sizes?: string | null             // JSON array e.g. '["A4","A3","A2"]'
}

/* ── Helpers ───────────────────────────────────────────────────────────── */
function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(paise / 100)
}


/* ── Star Rating ───────────────────────────────────────────────────────── */
function StarRating({ rating, count }: { rating: number; count?: number | null }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.4
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full ? 1 : i === full && half ? 0.5 : 0
          return (
            <Star
              key={i}
              className={`h-4 w-4 ${
                filled === 1
                  ? 'fill-mugen-gold text-mugen-gold'
                  : filled === 0.5
                    ? 'fill-mugen-gold/50 text-mugen-gold'
                    : 'fill-white/8 text-white/15'
              }`}
            />
          )
        })}
      </div>
      <span className="font-sans text-sm font-bold text-mugen-gold">{rating.toFixed(1)}</span>
      {count != null && (
        <>
          <span className="text-white/20">·</span>
          <span className="font-sans text-xs text-blue-400/80 underline underline-offset-2 cursor-pointer hover:text-blue-300 transition">
            {count.toLocaleString()} ratings
          </span>
        </>
      )}
    </div>
  )
}

/* ── Color Map ─────────────────────────────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  red: '#e53e3e', pink: '#ed64a6', blue: '#4299e1', navy: '#2b4375',
  black: '#1a1a1a', white: '#f5f5f5', grey: '#9ca3af', gray: '#9ca3af',
  green: '#48bb78', yellow: '#ecc94b', orange: '#ed8936', purple: '#9f7aea',
  gold: '#c6a86c', silver: '#b0c4de', brown: '#92400e', cyan: '#38b2ac',
  crimson: '#863841', magenta: '#b84d7a', violet: '#7c3aed', teal: '#14b8a6',
}

function swatch(name: string) {
  return COLOR_MAP[name.trim().toLowerCase()] ?? '#555555'
}

/* ── Divider ───────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <hr className="border-none h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
  )
}

/* ── Poster size definitions ───────────────────────────────────────────── */
const SIZE_META: Record<string, { dims: string; price_offset: number }> = {
  'A4': { dims: '21 × 29.7 cm', price_offset: 0 },
  'A3': { dims: '29.7 × 42 cm', price_offset: 50000 },   // +₹500
  'A2': { dims: '42 × 59.4 cm', price_offset: 120000 },  // +₹1200
  '24×36"': { dims: '60.9 × 91.4 cm', price_offset: 200000 },
  '18×24"': { dims: '45.7 × 61 cm', price_offset: 150000 },
}

/* ── Main component ────────────────────────────────────────────────────── */
export function ProductDetailClient({ product }: { product: ProductFull }) {
  const router = useRouter()
  const [liked, setLiked] = useState(!!(product as any).__liked)
  const [likeCount, setLikeCount] = useState<number>((product as any).__likeCount ?? 0)
  const [likeBusy, setLikeBusy] = useState(false)

  const isActionFigure = product.category === 'action_figures'
  const isPoster = product.category === 'posters' || product.category === 'limited_edition'
  const protectCatalogAssets = isCatalogPremiumCategory(product.category)
  const protectedStlUrl =
    protectCatalogAssets && isActionFigure && product.model_url
      ? `/api/premium/product-stl/${product.id}`
      : product.model_url

  /** Admin must attach a model file (STL/OBJ URL); otherwise hide 3D UI. */
  const has3DModelFile = Boolean(product.model_url && String(product.model_url).trim())

  /* Gallery */
  const extraImages: GalleryImage[] = (() => {
    try {
      if (product.extra_images) {
        const parsed = JSON.parse(product.extra_images)
        if (Array.isArray(parsed)) {
          return parsed.map((item: string | GalleryImage) =>
            typeof item === 'string' ? { url: item } : item
          )
        }
      }
    } catch { /* noop */ }
    return []
  })()

  const allImages: GalleryImage[] = [
    ...(product.image_url ? [{ url: product.image_url, alt: product.name }] : []),
    ...extraImages,
  ]

  /* 3D viewer toggle */
  const [show3D, setShow3D] = useState(false)

  /* Colors */
  const colors = product.color
    ? product.color.split(',').map(c => c.trim()).filter(Boolean)
    : []
  const isMultiColor = product.is_multi_color ?? colors.length > 1
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? '')

  /* Sizes (posters) */
  const availableSizes: string[] = (() => {
    try {
      if (product.sizes) return JSON.parse(product.sizes)
    } catch { /* noop */ }
    return []
  })()
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] ?? '')

  /* Pricing from DB (paise); JSON may stringify numbers as strings */
  const retail = getRetailPricing(product as unknown as Record<string, unknown>)
  const { salePaisa, mrpPaisa, hasDeal, discountPct: pct } = retail

  /* Size-adjusted price for posters */
  const sizeOffset = selectedSize ? (SIZE_META[selectedSize]?.price_offset ?? 0) : 0
  const displayPrice = salePaisa + sizeOffset
  const displayOriginal = mrpPaisa ? mrpPaisa + sizeOffset : null

  /* Variant requirements */
  const hasColorVariants = !isMultiColor && colors.length > 1
  const hasSizeVariants = availableSizes.length > 0
  const requiresVariant = hasColorVariants || hasSizeVariants
  const variantLabel = hasSizeVariants ? 'a size' : 'a colour'

  /* Metadata rows */
  type MetaRow = { label: string; value: string }
  const meta: MetaRow[] = [
    product.model_name ? { label: 'Model Name', value: product.model_name } : null,
    !isMultiColor && selectedColor
      ? { label: 'Colour', value: selectedColor }
      : isMultiColor && colors.length
        ? { label: 'Colour', value: 'Multi-colour' }
        : null,
    product.height_cm != null ? { label: 'Height', value: `${product.height_cm} cm` } : null,
    product.weight_g != null
      ? {
          label: 'Weight',
          value: product.weight_g < 1000
            ? `${product.weight_g} g`
            : `${(product.weight_g / 1000).toFixed(2)} kg`,
        }
      : null,
  ].filter(Boolean) as MetaRow[]

  /* 3D view footer button — only when a 3D asset exists */
  const gallery3DFooter = isActionFigure && has3DModelFile && !show3D ? (
    <button
      id="btn-3d-view"
      onClick={() => setShow3D(true)}
      className="group relative mt-0.5 flex w-full items-center justify-center gap-3
                 overflow-hidden rounded-xl border border-mugen-magenta/25
                 bg-gradient-to-r from-mugen-dark/70 via-mugen-dark/50 to-mugen-dark/70
                 px-6 py-3.5 font-sans text-sm font-semibold text-white/70
                 transition-all duration-300
                 hover:border-mugen-magenta/60 hover:bg-mugen-magenta/10
                 hover:text-white hover:shadow-[0_0_28px_rgba(184,77,122,0.22)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-full
                   bg-gradient-to-r from-transparent via-white/8 to-transparent
                   opacity-0 transition-all duration-700 ease-out
                   group-hover:translate-x-[200%] group-hover:opacity-100"
      />
      <Box className="h-4.5 w-4.5 text-mugen-magenta transition-transform group-hover:scale-110 group-hover:rotate-12" />
      <span>Click to see 3D view</span>
    </button>
  ) : null

  return (
    <>
      {/* Scoped styles */}
      <style>{`
        .pdp-img-enter { animation: pdp-fade 0.35s ease both; }
        @keyframes pdp-fade {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        .color-card-price { font-variant-numeric: tabular-nums; }
        .size-pill-active {
          border-color: rgba(184,77,122,0.9);
          background: rgba(184,77,122,0.12);
          box-shadow: 0 0 18px rgba(184,77,122,0.3);
        }
        /* ── Buy Now: left-to-right fill animation ── */
        .btn-buy-now { position: relative; isolation: isolate; }
        .btn-buy-now::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #FFD34D 0%, #ed8936 100%);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
          border-radius: inherit;
        }
        .btn-buy-now:hover::before,
        .btn-buy-now:focus-visible::before { transform: scaleX(1); }
        .btn-buy-now:hover,
        .btn-buy-now:focus-visible { color: #22201f; border-color: transparent; }
      `}</style>

      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr_1fr] xl:grid-cols-[500px_1fr]">

        {/* ╔════════════════════════════════╗
            ║  LEFT — Gallery + 3D Viewer   ║
            ╚════════════════════════════════╝ */}
        <div className="flex flex-col gap-4">
          <ImageGallery
            images={allImages}
            productName={product.name}
            productId={product.id}
            useProtectedImages={protectCatalogAssets}
            footer={gallery3DFooter}
          />

          {/* 3D Viewer panel */}
          {isActionFigure && has3DModelFile && show3D && (
            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <ModelViewer
                modelUrl={protectedStlUrl}
                onClose={() => setShow3D(false)}
              />
            </div>
          )}
        </div>

        {/* ╔══════════════════════════════════╗
            ║  RIGHT — Product Details         ║
            ╚══════════════════════════════════╝ */}
        <div className="flex flex-col gap-5">

          {/* Category chip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-mugen-magenta/30
                         bg-mugen-magenta/10 px-3 py-1 font-sans text-xs font-bold
                         uppercase tracking-widest text-mugen-magenta"
            >
              {isActionFigure ? (
                <><Award className="h-3 w-3" />Action Figure</>
              ) : isPoster ? (
                <><Package className="h-3 w-3" />Poster</>
              ) : (
                product.category.replace(/_/g, ' ')
              )}
            </span>
            {isActionFigure && has3DModelFile && (
              <span className="inline-flex items-center gap-1 rounded-full border border-mugen-gold/25
                               bg-mugen-gold/8 px-2.5 py-0.5 font-sans text-[10px] font-bold
                               uppercase tracking-widest text-mugen-gold/80">
                <Box className="h-3 w-3" />3D View Available
              </span>
            )}
          </div>

          {/* Product title */}
          <h1 className="font-cinzel text-2xl font-bold leading-snug text-white md:text-[1.75rem]">
            {product.name}
          </h1>

          {/* Star rating */}
          {product.rating != null && product.rating > 0 && (
            <StarRating rating={product.rating} count={product.rating_count} />
          )}

          <Divider />

          {/* ── Pricing (e‑commerce style: strikethrough MRP → sale price → % off) ── */}
          <div className="flex flex-col gap-2">
            {hasDeal ? (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span
                    className="font-sans text-lg sm:text-xl text-white/40 line-through decoration-white/30 tabular-nums"
                    title="Maximum retail price"
                  >
                    {fmt(displayOriginal ?? mrpPaisa!)}
                  </span>
                  <span className="font-cinzel text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                    {fmt(displayPrice)}
                  </span>
                  <span
                    className="inline-flex items-center rounded-md bg-emerald-600/95 px-2.5 py-1
                               font-sans text-xs font-extrabold uppercase tracking-wide text-white shadow-md"
                  >
                    {pct}% off
                  </span>
                </div>
                <p className="font-sans text-sm text-white/50">
                  You save{' '}
                  <span className="font-semibold text-emerald-400/95 tabular-nums">
                    {fmt((displayOriginal ?? mrpPaisa!) - displayPrice)}
                  </span>
                  <span className="text-white/25"> · </span>
                  <span className="text-white/35">vs M.R.P (incl. of all taxes)</span>
                </p>
                <p className="font-sans text-[11px] text-white/28">Inclusive of all taxes</p>
              </>
            ) : (
              <>
                <span className="font-cinzel text-3xl sm:text-4xl font-bold text-mugen-gold tracking-tight tabular-nums">
                  {fmt(displayPrice)}
                </span>
                <p className="font-sans text-[11px] text-white/28">Inclusive of all taxes</p>
              </>
            )}
            {sizeOffset > 0 && (
              <p className="font-sans text-[11px] text-white/35">
                Price adjusted for selected size
              </p>
            )}
          </div>

          <Divider />

          {/* ── Color selector (single-color products with multiple options) ── */}
          {!isMultiColor && colors.length > 0 && (
            <div>
              <p className="mb-3 font-sans text-sm font-semibold text-white/80">
                Colour:{' '}
                <span className="font-bold text-white">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c, i) => {
                  const isActive = selectedColor === c
                  const variantPrice = salePaisa + i * 50000
                  const variantOriginal = mrpPaisa ? mrpPaisa + i * 50000 : null
                  return (
                    <button
                      key={c}
                      id={`color-${c.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setSelectedColor(c)}
                      aria-label={`Select colour ${c}`}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3
                                  transition-all duration-200 min-w-[72px]
                                  ${isActive
                          ? 'border-mugen-magenta bg-mugen-magenta/10 shadow-[0_0_20px_rgba(184,77,122,0.3)]'
                          : 'border-white/10 bg-white/3 hover:border-mugen-magenta/40 hover:bg-white/6'
                        }`}
                    >
                      <span
                        className="h-9 w-9 rounded-full border-2 border-white/15 shadow-md
                                   ring-offset-mugen-dark transition-transform"
                        style={{ backgroundColor: swatch(c) }}
                      />
                      {/* <span className="font-sans text-[11px] font-semibold text-white/70">{c}</span>
                      <span className="color-card-price font-cinzel text-xs font-bold text-white/90">
                        {fmt(variantPrice)}
                      </span>
                      {variantOriginal && (
                        <span className="color-card-price font-sans text-[9px] text-white/30 line-through">
                          {fmt(variantOriginal)}
                        </span>
                      )} */}
                      {isActive && (
                        <span
                          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center
                                     rounded-full bg-mugen-magenta text-white text-[8px] font-bold"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Multicolor badge */}
          {isMultiColor && colors.length > 0 && (
            <div className="flex items-center gap-2.5">
              <p className="font-sans text-sm font-semibold text-white/70">Colours:</p>
              <div className="flex gap-1.5">
                {colors.map(c => (
                  <span
                    key={c}
                    title={c}
                    className="h-5 w-5 rounded-full border border-white/15 shadow-sm"
                    style={{ backgroundColor: swatch(c) }}
                  />
                ))}
              </div>
              <span className="font-sans text-xs text-white/40">Multi-colour model</span>
            </div>
          )}

          {/* ── Poster size selector ── */}
          {isPoster && availableSizes.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold text-white/80">
                <Ruler className="h-3.5 w-3.5 text-mugen-magenta/70" />
                Size:{' '}
                <span className="font-bold text-white">{selectedSize || 'Not selected'}</span>
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSizes.map((s) => {
                  const meta = SIZE_META[s]
                  const isActive = selectedSize === s
                  return (
                    <button
                      key={s}
                      id={`size-${s.replace(/[^a-z0-9]/gi, '').toLowerCase()}`}
                      onClick={() => setSelectedSize(s)}
                      aria-label={`Select size ${s}`}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-3 py-3
                                  transition-all duration-200
                                  ${isActive
                          ? 'border-mugen-magenta bg-mugen-magenta/12 shadow-[0_0_18px_rgba(184,77,122,0.28)]'
                          : 'border-white/10 bg-white/3 hover:border-mugen-magenta/40'
                        }`}
                    >
                      <span className="font-cinzel text-sm font-bold text-white">{s}</span>
                      {meta && (
                        <span className="font-sans text-[10px] text-white/40">{meta.dims}</span>
                      )}
                      {isActive && (
                        <span
                          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center
                                     rounded-full bg-mugen-magenta text-white text-[8px] font-bold"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Product metadata table ── */}
          {meta.length > 0 && (
            <>
              <Divider />
              <div className="overflow-hidden rounded-xl border border-white/8">
                {meta.map(({ label, value }, idx) => (
                  <div
                    key={label}
                    className={`flex items-center gap-4 px-5 py-3
                                ${idx !== meta.length - 1 ? 'border-b border-white/6' : ''}`}
                  >
                    <span className="w-28 flex-shrink-0 font-sans text-sm font-bold text-white/55">
                      {label}
                    </span>
                    <span className="font-sans text-sm text-white/88">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Description ── */}
          {product.description && (
            <>
              <Divider />
              <div>
                <p className="mb-2 font-sans text-xs font-bold uppercase tracking-widest text-white/30">
                  About this item
                </p>
                <p className="font-sans text-sm leading-relaxed text-white/65">
                  {product.description}
                </p>
              </div>
            </>
          )}

          <Divider />

          {/* ── Trust badges ── */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              { Icon: Truck,       text: 'Free shipping ₹999+', sub: 'Pan India delivery' },
              { Icon: ShieldCheck, text: 'Secure payment',       sub: 'SSL encrypted' },
              { Icon: Package,     text: 'Careful packaging',    sub: 'Protected in transit' },
            ].map(({ Icon, text, sub }) => (
              <div
                key={text}
                className="flex flex-col gap-1 rounded-xl border border-white/8 bg-white/3 px-3.5 py-3"
              >
                <Icon className="h-4 w-4 text-mugen-gold/70" />
                <span className="font-sans text-xs font-semibold text-white/65">{text}</span>
                <span className="font-sans text-[10px] text-white/30">{sub}</span>
              </div>
            ))}
          </div>

          {/* ── CTA buttons ── */}
          <div className="flex items-start gap-2.5">
            {/* Primary actions: Add to Cart + Buy Now stacked */}
            <div className="flex flex-1 flex-col gap-3 min-w-0">
              <AddToCartButton
                productId={product.id}
                productSlug={product.slug}
                selectedColor={!isMultiColor && colors.length > 0 ? selectedColor : undefined}
                selectedSize={availableSizes.length > 0 ? selectedSize : undefined}
                requiresVariant={requiresVariant}
                variantLabel={variantLabel}
              />

              {/* Buy Now */}
              <button
                id="btn-buy-now"
                aria-label="Buy now — go directly to checkout"
                className="btn-buy-now flex h-12 w-full items-center justify-center gap-2.5
                           overflow-hidden rounded-xl border border-mugen-gold/60
                           font-cinzel text-sm font-bold uppercase tracking-widest text-mugen-gold
                           transition-colors duration-300 select-none
                           hover:shadow-[0_0_28px_rgba(255,211,77,0.35)]
                           active:scale-[0.99] focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-mugen-gold/60 cursor-pointer"
                onClick={() => {
                  sessionStorage.setItem(
                    'buyNowProduct',
                    JSON.stringify({
                      id: product.id,
                      name: product.name,
                      price: displayPrice,
                      image_url: product.image_url,
                      slug: product.slug,
                    })
                  )
                  router.push('/checkout?buyNow=1')
                }}
              >
                <Zap className="h-4 w-4 cursor-pointer" aria-hidden />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Secondary icon actions */}
            <div className="flex flex-col gap-2">
              <button
                id="btn-wishlist"
                aria-label="Save to wishlist"
                disabled={likeBusy}
                onClick={async () => {
                  setLikeBusy(true)
                  try {
                    const res = await fetch('/api/likes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: product.id }),
                    })
                    const raw = await res.text()
                    let j: { liked?: boolean; likeCount?: number; error?: string } = {}
                    try {
                      j = raw ? JSON.parse(raw) : {}
                    } catch {
                      j = {}
                    }
                    if (!res.ok) {
                      if (res.status === 401) {
                        window.location.href = `/login?next=${encodeURIComponent(productDetailPath(product))}`
                        return
                      }
                      throw new Error(j.error || 'Like failed')
                    }
                    const nextLiked = typeof j.liked === 'boolean' ? j.liked : !liked
                    setLiked(nextLiked)
                    if (typeof j.likeCount === 'number') setLikeCount(j.likeCount)
                  } catch (e) {
                    console.error('[likes]', e)
                  } finally {
                    setLikeBusy(false)
                  }
                }}
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-all
                  ${liked
                    ? 'border-red-500/50 bg-red-500/15 shadow-[0_0_16px_rgba(239,68,68,0.25)]'
                    : 'border-white/10 bg-white/5 hover:border-red-400/40 hover:bg-red-500/10 hover:shadow-[0_0_16px_rgba(239,68,68,0.15)]'}`}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-white/40 hover:text-red-400'}`}
                />
              </button>
              <button
                id="btn-share"
                aria-label="Share product"
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl
                           border border-white/10 bg-white/5 text-white/40 transition-all
                           hover:border-mugen-gold/40 hover:bg-mugen-gold/8 hover:text-mugen-gold
                           hover:shadow-[0_0_16px_rgba(198,168,108,0.2)]"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
