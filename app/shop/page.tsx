import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/ProductCard'

const CustomActionFigure = dynamic(() => import('@/components/shop/CustomActionFigure'), {
  loading: () => (
    <div className="min-h-[320px] rounded-2xl border border-white/5 bg-black/20 animate-pulse" aria-hidden />
  ),
})

const PersonalizedPosterUpload = dynamic(
  () => import('@/components/shop/PersonalizedPosterUpload').then((m) => ({ default: m.PersonalizedPosterUpload })),
  {
    loading: () => (
      <div className="min-h-[320px] rounded-2xl border border-white/5 bg-black/20 animate-pulse" aria-hidden />
    ),
  },
)

/** Cache shop catalog HTML; products refresh periodically (category via searchParams still resolves). */
export const revalidate = 60

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
    let q = supabase
      .from('products')
      .select('*')
      .eq('is_public', true)   // defense-in-depth: RLS also enforces this
      .order('created_at', { ascending: false })
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

      <main className="min-h-screen bg-mugen-black pb-16 pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="mb-8 sm:mb-10">
            <h1 className="font-cinzel text-2xl font-bold text-white sm:text-3xl md:text-4xl">Shop</h1>
            <p className="mt-2 max-w-2xl font-sans text-sm text-white/70 sm:text-base">
              Premium anime posters, action figures, limited edition collectibles, and custom creations — Infinity Castle inspired curation.
            </p>
          </div>

          {/* ── Filter tabs — horizontal scroll on narrow viewports, no page overflow ── */}
          <div className="relative -mx-4 mb-8 sm:mx-0">
            <div className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0">
              {CATEGORIES.map((c) => {
                const href = c.id ? `/shop?category=${c.id}` : '/shop'
                const active = activeCategory === c.id
                return (
                  <Link
                    key={c.id || 'all'}
                    href={href}
                    scroll={false}
                    className={`snap-start whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold transition-colors touch-manipulation active:scale-[0.98] sm:min-h-0 sm:py-2 ${active
                      ? 'bg-mugen-crimson/80 text-white ring-1 ring-mugen-glow/40'
                      : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                  >
                    {c.label}
                  </Link>
                )
              })}
            </div>
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
                if (secProducts.length === 0) return null
                
                const visibleCount = sec.id === 'action_figures' ? 8 : 4;

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

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                      {secProducts.slice(0, visibleCount).map((p: any) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>

                    {sec.id === 'action_figures' && (
                      <div className="mt-8 flex justify-center">
                        <Link
                          href={`/shop?category=${sec.id}`}
                          className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-mugen-crimson/60 hover:bg-mugen-crimson/10 hover:text-white hover:shadow-[0_0_20px_rgba(184,77,122,0.2)]"
                        >
                          <span className="relative">
                            Show more
                            <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-mugen-crimson transition-all duration-300 group-hover:w-full" />
                          </span>
                          <span className="transition-transform duration-300 group-hover:translate-x-0.5">↓</span>
                        </Link>
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
              <PersonalizedPosterUpload />
            </section>
          )}

        </div>
      </main>
    </>
  )
}
