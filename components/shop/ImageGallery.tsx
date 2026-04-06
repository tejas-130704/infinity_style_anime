'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown, ZoomIn } from 'lucide-react'

export interface GalleryImage {
  url: string
  alt?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  productName: string
  /** Rendered below main image — pass "Click to see 3D view" button */
  footer?: React.ReactNode
}

const THUMB_VISIBLE = 5   // max thumbnails visible before scroll

export function ImageGallery({ images, productName, footer }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const list = images.length ? images : [{ url: '/placeholder.svg', alt: productName }]
  const total = list.length

  const prev = useCallback(
    () => setActive(i => (i - 1 + total) % total),
    [total],
  )
  const next = useCallback(
    () => setActive(i => (i + 1) % total),
    [total],
  )

  const canScrollUp   = thumbOffset > 0
  const canScrollDown = thumbOffset + THUMB_VISIBLE < total

  const scrollUp   = () => setThumbOffset(o => Math.max(0, o - 1))
  const scrollDown = () => setThumbOffset(o => Math.min(total - THUMB_VISIBLE, o + 1))

  return (
    <div className="flex gap-3 w-full select-none">

      {/* ── Vertical thumbnail strip ── */}
      {total > 1 && (
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[70px]">

          {/* Scroll up */}
          <button
            onClick={scrollUp}
            disabled={!canScrollUp}
            aria-label="Scroll thumbnails up"
            className="flex h-6 w-full items-center justify-center rounded-lg transition
                       disabled:opacity-0 disabled:pointer-events-none
                       text-white/30 hover:text-white/70 hover:bg-white/5"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          {/* Thumbnails */}
          <div className="flex flex-col gap-2 w-full overflow-hidden">
            {list.slice(thumbOffset, thumbOffset + THUMB_VISIBLE).map((img, relIdx) => {
              const idx = thumbOffset + relIdx
              const isActive = active === idx
              return (
                <button
                  key={idx}
                  id={`thumb-${idx}`}
                  onClick={() => setActive(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={`relative h-[68px] w-full flex-shrink-0 overflow-hidden rounded-lg border-2
                              transition-all duration-200
                              ${isActive
                    ? 'border-mugen-magenta shadow-[0_0_14px_rgba(184,77,122,0.5)] scale-[1.03]'
                    : 'border-white/10 hover:border-mugen-magenta/50 hover:scale-[1.02]'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? `${productName} view ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="70px"
                    unoptimized={img.url.startsWith('http')}
                  />
                  {/* Active overlay shimmer */}
                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 bg-mugen-magenta/8 rounded-md" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Scroll down */}
          <button
            onClick={scrollDown}
            disabled={!canScrollDown}
            aria-label="Scroll thumbnails down"
            className="flex h-6 w-full items-center justify-center rounded-lg transition
                       disabled:opacity-0 disabled:pointer-events-none
                       text-white/30 hover:text-white/70 hover:bg-white/5"
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Image counter below strip */}
          <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-white/25">
            {active + 1}/{total}
          </span>
        </div>
      )}

      {/* ── Main preview ── */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">

        {/* Main image frame */}
        <div
          className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/8
                     bg-gradient-to-b from-mugen-dark/80 to-mugen-black group cursor-zoom-in"
          onClick={() => setZoomed(v => !v)}
        >
          <Image
            src={list[active].url}
            alt={list[active].alt ?? productName}
            fill
            className={`object-contain p-5 transition-all duration-500 ease-out
                        ${zoomed ? 'scale-125' : 'scale-100 group-hover:scale-105'}`}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={list[active].url.startsWith('http')}
          />

          {/* Zoom hint */}
          <span
            aria-hidden
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full
                       border border-white/10 bg-mugen-black/70 px-2.5 py-1 text-[10px]
                       text-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="h-3 w-3" />
            {zoomed ? 'Click to reset' : 'Click to zoom'}
          </span>

          {/* Prev / Next arrows */}
          {total > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                id="gallery-prev"
                aria-label="Previous image"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9
                           items-center justify-center rounded-full border border-white/10
                           bg-mugen-black/70 text-white/50 backdrop-blur-sm
                           opacity-0 group-hover:opacity-100 transition-all
                           hover:border-mugen-magenta/50 hover:text-white hover:scale-110"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                id="gallery-next"
                aria-label="Next image"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9
                           items-center justify-center rounded-full border border-white/10
                           bg-mugen-black/70 text-white/50 backdrop-blur-sm
                           opacity-0 group-hover:opacity-100 transition-all
                           hover:border-mugen-magenta/50 hover:text-white hover:scale-110"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}

          {/* Dot indicators (bottom strip) */}
          {total > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4">
              {list.map((_, idx) => (
                <button
                  key={idx}
                  onClick={e => { e.stopPropagation(); setActive(idx) }}
                  aria-label={`Go to image ${idx + 1}`}
                  className={`rounded-full transition-all duration-300
                              ${active === idx
                    ? 'w-6 h-1.5 bg-mugen-magenta'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer slot (e.g. "Click to see 3D view" button) */}
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
