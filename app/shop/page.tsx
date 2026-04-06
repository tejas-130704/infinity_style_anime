import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'
import CustomActionFigure from '@/components/shop/CustomActionFigure'

/* ─── Filter tabs ─── */
const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'posters', label: 'Posters' },
  { id: 'action_figures', label: 'Action Figures' },
  { id: 'limited_edition', label: 'Limited Edition' },
  { id: 'custom_action_figure', label: 'Custom Action Figure' },
  { id: 'personalized_posters', label: 'Personalized Posters' },
] as const

/* DB-backed categories */
const DB_CATS = ['posters', 'action_figures', 'limited_edition'] as const

/* Section meta for "All" view */
const ALL_SECTIONS = [
  {
    id: 'posters',
    label: 'Posters',
    desc: 'Standard anime posters — iconic scenes, fan-favourite characters.',
    icon: '',
  },
  {
    id: 'action_figures',
    label: 'Action Figures',
    desc: 'Physical anime action figures — collectible-grade quality.',
    icon: '',
  },
  {
    id: 'limited_edition',
    label: 'Limited Edition',
    desc: 'Premium posters with unique concepts — scenes that never happened but fans wish did.',
    icon: '',
  },
] as const

const POSTER_SIZES = [
  { id: 'a4', label: 'A4', sub: '21 × 29.7 cm' },
  { id: 'a3', label: 'A3', sub: '29.7 × 42 cm' },
  { id: 'a2', label: 'A2', sub: '42 × 59.4 cm' },
  { id: '2436', label: '24 × 36″', sub: '60.9 × 91.4 cm' },
  { id: '1824', label: '18 × 24″', sub: '45.7 × 61 cm' },
]

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = category ?? ''

  const isCustomSection =
    activeCategory === 'custom_action_figure' || activeCategory === 'personalized_posters'
  const isAllView = activeCategory === ''

  /* Fetch DB products */
  const supabase = await createClient()
  let products: Record<string, unknown>[] | null = null
  let error: unknown = null

  if (!isCustomSection) {
    let q = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (activeCategory && (DB_CATS as readonly string[]).includes(activeCategory)) {
      q = q.eq('category', activeCategory)
    }
    const res = await q
    products = res.data
    error = res.error
  }

  /* For "All" view, group products by category */
  const grouped = isAllView
    ? ALL_SECTIONS.reduce(
      (acc, s) => {
        acc[s.id] = products?.filter((p: any) => p.category === s.id) ?? []
        return acc
      },
      {} as Record<string, Record<string, unknown>[]>,
    )
    : {}

  return (
    <>
      {/* Scoped section-divider style only (scrollbar is global) */}
      <style>{`
        .section-divider {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(184,77,122,0.35), transparent);
          margin: 3rem 0;
        }
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .badge-new { animation: pulse-badge 2.6s ease-in-out infinite; }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.24s ease; }

        .size-pill {
          cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.08);
          transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .size-pill:hover {
          border-color: rgba(184,77,122,0.55);
          background: rgba(184,77,122,0.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(134,56,65,0.18);
        }
        .upload-zone {
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .upload-zone:hover {
          border-color: rgba(184,77,122,0.65);
          background: rgba(184,77,122,0.06);
        }
        .cat-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .cat-see-all {
          margin-left: auto;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.2s;
        }
        .cat-see-all:hover { color: rgba(184,77,122,0.9); }
      `}</style>

      <main className="min-h-screen bg-mugen-black pt-28 pb-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-8">

          {/* ── Header ── */}
          <div className="mb-10">
            <h1 className="font-cinzel text-3xl font-bold text-white md:text-4xl">Shop</h1>
            <p className="mt-2 max-w-2xl font-sans text-white/70">
              Premium anime posters, action figures, limited edition collectibles, and custom creations — Infinity Castle inspired curation.
            </p>
          </div>

          {/* ── Filter tabs ── */}
          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const href = c.id ? `/shop?category=${c.id}` : '/shop'
              const active = activeCategory === c.id
              return (
                <Link
                  key={c.id || 'all'}
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active
                    ? 'bg-mugen-crimson/80 text-white ring-1 ring-mugen-glow/40'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                >
                  {c.label}
                </Link>
              )
            })}
          </div>

          {/* ── DB error ── */}
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
              Could not load products. Configure Supabase in{' '}
              <code className="text-white">.env</code> and run{' '}
              <code className="text-white">supabase/schema.sql</code>.
            </p>
          )}

          {/* ════════════════════════════════════
              "ALL" VIEW — section-wise distribution
          ════════════════════════════════════ */}
          {isAllView && (
            <div className="flex flex-col gap-12">
              {ALL_SECTIONS.map((sec) => {
                const secProducts = grouped[sec.id] ?? []
                return (
                  <div key={sec.id}>
                    {/* Section header */}
                    <div className="cat-section-header">
                      <span className="text-2xl" aria-hidden>{sec.icon}</span>
                      <div>
                        <h2 className="font-cinzel text-xl font-bold text-white">{sec.label}</h2>
                        <p className="text-xs text-white/45 mt-0.5 max-w-lg">{sec.desc}</p>
                      </div>
                      <Link
                        href={`/shop?category=${sec.id}`}
                        className="cat-see-all"
                        aria-label={`See all ${sec.label}`}
                      >
                        See all →
                      </Link>
                    </div>

                    {secProducts.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                        {secProducts.slice(0, 4).map((p: any) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/2 py-10">
                        <p className="text-sm text-white/30">No {sec.label.toLowerCase()} yet</p>
                      </div>
                    )}

                    {/* Glow divider between sections */}
                    <hr className="section-divider" style={{ marginTop: '2.5rem', marginBottom: 0 }} />
                  </div>
                )
              })}

              {/* Custom sections summary cards in "All" view */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Custom Action Figure card */}
                <Link
                  href="/shop?category=custom_action_figure"
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition-all hover:border-mugen-crimson/40 hover:bg-mugen-crimson/6 hover:shadow-[0_0_30px_rgba(134,56,65,0.18)]"
                >
                  <div className="mb-3 text-3xl"></div>
                  <h3 className="font-cinzel text-lg font-bold text-white mb-1">Custom Action Figure</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Upload your <span className="text-white/80">.stl</span> file, choose materials and finish. We print, paint, and deliver your custom figure.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-mugen-crimson/70 group-hover:text-mugen-crimson transition-colors">
                    Get started →
                  </span>
                  <span className="badge-new absolute top-4 right-4 rounded-full bg-mugen-crimson/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    New
                  </span>
                </Link>

                {/* Personalized Posters card */}
                <Link
                  href="/shop?category=personalized_posters"
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition-all hover:border-mugen-crimson/40 hover:bg-mugen-crimson/6 hover:shadow-[0_0_30px_rgba(134,56,65,0.18)]"
                >
                  <div className="mb-3 text-3xl"></div>
                  <h3 className="font-cinzel text-lg font-bold text-white mb-1">Personalized Posters</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Select your preferred size. We print premium archival-quality posters built to last and look stunning on any wall.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-mugen-crimson/70 group-hover:text-mugen-crimson transition-colors">
                    Choose size →
                  </span>
                  <span className="badge-new absolute top-4 right-4 rounded-full bg-mugen-crimson/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    New
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              SINGLE CATEGORY VIEW (Posters / Action Figures / Limited Edition)
          ════════════════════════════════════ */}
          {!isAllView && !isCustomSection && (
            <>
              {!error && (!products || products.length === 0) && (
                <p className="text-white/60">No products yet. Add items in Admin or run the seed SQL.</p>
              )}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                {products?.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}

          {/* ════════════════════════════════════
              CUSTOM ACTION FIGURE section
          ════════════════════════════════════ */}
          {activeCategory === 'custom_action_figure' && (
            <section
              id="custom-action-figure"
              aria-labelledby="caf-heading"
              className="animate-slide-down"
            >
              <CustomActionFigure />
            </section>
          )}

          {/* ════════════════════════════════════
              PERSONALIZED POSTERS section
          ════════════════════════════════════ */}
          {activeCategory === 'personalized_posters' && (
            <section
              id="personalized-posters"
              aria-labelledby="pp-heading"
              className="animate-slide-down"
            >
              {/* Header */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h2 id="pp-heading" className="font-cinzel text-2xl font-bold text-white md:text-3xl">
                  Personalized Posters
                </h2>
                <span className="badge-new rounded-full bg-mugen-crimson/70 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-white ring-1 ring-mugen-crimson/40">
                  New
                </span>
              </div>
              <p className="mb-10 max-w-2xl text-sm text-white/60 font-sans leading-relaxed">
                Get a poster printed exactly to your preferred size — sharp, gallery-quality output on premium archival paper. Pick your size below and place your order.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Left: size options */}
                <div className="glass rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                      Choose a Size
                    </h3>
                    <div className="flex flex-col gap-3">
                      {POSTER_SIZES.map((s) => (
                        <button
                          key={s.id}
                          id={`psize-${s.id}`}
                          type="button"
                          className="size-pill flex items-center justify-between rounded-xl bg-white/3 px-5 py-3.5"
                          aria-label={`Select poster size ${s.label}`}
                        >
                          <span className="font-semibold text-sm text-white/85">{s.label}</span>
                          <span className="text-xs text-white/40">{s.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-2">Print Specs</p>
                    <ul className="flex flex-col gap-1.5 text-xs text-white/55">
                      {[
                        '200 gsm archival matte paper',
                        'Fade-resistant pigment inks',
                        'Satin or glossy finish (on request)',
                        'Colour-calibrated print process',
                      ].map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-mugen-crimson/60" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: price + CTA */}
                <div className="flex flex-col gap-4">
                  <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Estimated Price</span>
                    <span className="font-cinzel text-4xl font-bold text-white/20 tracking-wide">— —</span>
                    <p className="text-xs text-white/35">Select a size above to see pricing.</p>
                  </div>

                  <div className="glass rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/40">What's Included</span>
                    <ul className="flex flex-col gap-2 text-sm text-white/70">
                      {[
                        'Premium archival print',
                        'Rigid protective tube packaging',
                        'Ready-to-frame mounting edges',
                        'Tracked shipping',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mugen-crimson/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass rounded-2xl p-5 flex flex-col gap-3">
                    <label htmlFor="pp-instructions" className="text-xs font-semibold uppercase tracking-widest text-white/40">
                      Special Instructions <span className="normal-case font-normal text-white/25">(optional)</span>
                    </label>
                    <textarea
                      id="pp-instructions"
                      rows={3}
                      placeholder="e.g. glossy finish, rolled or flat, preferred colours…"
                      className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-mugen-crimson/50 focus:ring-1 focus:ring-mugen-crimson/30"
                    />
                  </div>

                  <button
                    id="pp-order-btn"
                    type="button"
                    disabled
                    className="mt-auto w-full rounded-xl bg-mugen-crimson/30 px-8 py-3.5 font-cinzel text-sm font-bold uppercase tracking-widest text-white opacity-50 cursor-not-allowed transition"
                    aria-label="Add personalized poster to cart"
                  >
                    Add to Cart
                  </button>
                  <p className="text-center text-xs text-white/30">Select a size to enable checkout</p>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  )
}
