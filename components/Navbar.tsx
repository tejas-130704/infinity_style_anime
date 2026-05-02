'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useSession } from 'next-auth/react'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Custom AF', href: '/shop?category=custom_action_figure' },
  { label: 'About', href: '/about' },
] as const

/** Only rendered when NEXT_PUBLIC_SHOW_INVOICE_PREVIEW=true (dev builds). */
const SHOW_INVOICE_PREVIEW = process.env.NEXT_PUBLIC_SHOW_INVOICE_PREVIEW === 'true'

function navLinkActive(pathname: string, categoryFromUrl: string | undefined, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/shop') {
    if (categoryFromUrl === undefined) return false
    return pathname === '/shop' && categoryFromUrl === ''
  }
  const cat = new URL(href, 'https://example.com').searchParams.get('category')
  if (cat) {
    if (categoryFromUrl === undefined) return false
    return pathname === '/shop' && categoryFromUrl === cat
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  /** `undefined` until synced — matches SSR first paint; then `''` or category id (avoids useSearchParams hydration mismatch). */
  const [categoryParam, setCategoryParam] = useState<string | undefined>(undefined)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  /** NextAuth (e.g. Google) or legacy Supabase session — both count as signed in. */
  const authReady = nextAuthStatus !== 'loading' || !!sessionEmail
  const loggedIn =
    (nextAuthStatus === 'authenticated' && !!nextAuthSession?.user) ||
    (!!sessionEmail && nextAuthStatus !== 'authenticated')
  const showSignIn = authReady && !loggedIn

  /** Only call /api/cart when we already know a session exists — avoids 401 + wasted work for guests. */
  const loadCartCount = useCallback(async () => {
    const hasSession =
      (nextAuthStatus === 'authenticated' && !!nextAuthSession?.user) || !!sessionEmail
    if (!hasSession) {
      setCartCount(0)
      return
    }
    try {
      const res = await fetch('/api/cart', { signal: AbortSignal.timeout(12_000) })
      if (!res.ok) {
        setCartCount(0)
        return
      }
      const data = await res.json()
      const items = (data.items ?? []) as Array<{ quantity: number }>
      setCartCount(items.reduce((acc, i) => acc + i.quantity, 0))
    } catch {
      setCartCount(0)
    }
  }, [nextAuthStatus, nextAuthSession?.user, sessionEmail])

  const nextAuthEmailFallback = nextAuthSession?.user?.email ?? null

  /**
   * Use session from storage / auth events — avoid `getUser()` here (network + storage lock
   * contention when many callers run together, e.g. Strict Mode + onAuthStateChange).
   */
  const applySupabaseSession = useCallback(
    async (session: Session | null) => {
      const supabase = createClient()
      try {
        if (session?.user) {
          setSessionEmail(session.user.email ?? null)
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
          setIsAdmin(!!profile?.is_admin)
        } else {
          setSessionEmail(nextAuthEmailFallback)
          setIsAdmin(false)
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        console.debug('[Navbar] applySupabaseSession', e)
      }
    },
    [nextAuthEmailFallback]
  )

  /** Serialize session updates so profile fetches never stack (reduces lock warnings). */
  const sessionApplyChain = useRef(Promise.resolve())

  const queueApplySession = useCallback(
    (session: Session | null) => {
      sessionApplyChain.current = sessionApplyChain.current
        .then(() => applySupabaseSession(session))
        .catch(() => {})
    },
    [applySupabaseSession]
  )

  useLayoutEffect(() => {
    setCategoryParam(searchParams.get('category') ?? '')
  }, [searchParams])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    /** `INITIAL_SESSION` fires with the current session — avoids a separate `getSession()` + duplicate work. */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) queueApplySession(session)
    })

    const onCart = () => void loadCartCount()
    window.addEventListener('cart:updated', onCart)
    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener('cart:updated', onCart)
    }
  }, [queueApplySession, loadCartCount])

  /** After NextAuth + Supabase-derived email settle, load cart only for signed-in users. */
  useEffect(() => {
    if (nextAuthStatus === 'loading' && !sessionEmail) return
    void loadCartCount()
  }, [nextAuthStatus, sessionEmail, loadCartCount])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-4 pointer-events-none">
      <div className="pointer-events-auto relative w-full max-w-6xl">
        <nav
          className={`
            relative z-[100] flex min-h-14 sm:min-h-16 items-center justify-between gap-2 rounded-full px-3 sm:px-5 md:px-8
            glass border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.45)]
            text-mugen-white transition-all duration-300
            ${isScrolled ? 'bg-black/35 backdrop-blur-xl' : 'bg-black/25 backdrop-blur-md'}
          `}
        >
          <Link
            href="/"
            className="flex min-h-12 min-w-0 shrink items-center gap-2.5 rounded-full py-1 pl-1 pr-2 sm:gap-3"
          >
            <Image
              src="/assests/logo/logo.png"
              alt="Infinity Style Logo"
              width={44}
              height={44}
              className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-lg object-contain"
              priority
            />
            <div className="flex flex-col leading-[1.1] truncate">
              <span className="font-cinzel text-[15px] sm:text-lg font-bold tracking-tight text-white">
                Infinity Style
              </span>
              <span className="font-sans text-[9px] sm:text-xs font-medium text-white/60 tracking-wide mt-[2px]">
                by 3DKalakaar
              </span>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:gap-5 xl:gap-6 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = navLinkActive(pathname, categoryParam, link.href)
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`link-underline-anim font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                    active
                      ? 'link-underline-active text-mugen-gold'
                      : 'text-white/95 hover:text-mugen-gold'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            {SHOW_INVOICE_PREVIEW && (
              <Link
                href="/invoice/preview"
                className={`link-underline-anim font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                  pathname.startsWith('/invoice')
                    ? 'link-underline-active text-mugen-gold'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                🧾 Invoice
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <Link
              href="/cart"
              className="tap-target hidden lg:flex relative rounded-xl text-white transition-all duration-200 hover:bg-white/10 hover:text-mugen-gold active:scale-95 sm:hover:scale-105"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-mugen-crimson px-1 text-xs text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {loggedIn ? (
              <Link
                href="/account"
                className="tap-target hidden rounded-xl text-white transition-all duration-200 hover:bg-white/10 hover:text-mugen-gold lg:flex"
                aria-label="Account"
              >
                <User className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden />
              </Link>
            ) : (
              showSignIn && (
                <Link
                  href="/login"
                  className={`link-underline-anim hidden min-h-12 items-center px-2 text-sm font-semibold text-white/90 hover:text-mugen-gold lg:inline-flex ${
                    pathname.startsWith('/login') ? 'link-underline-active text-mugen-gold' : ''
                  }`}
                >
                  Sign in
                </Link>
              )
            )}

            {/* Mobile / tablet only — desktop uses inline nav links (lg+). */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200 hover:bg-white/10 hover:text-mugen-gold active:scale-95 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              id="mobile-menu-button"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              className="pointer-events-auto fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              id="mobile-nav-menu"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-button"
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[95] max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-white/15 bg-mugen-black/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              <div className="flex flex-col gap-0.5 p-2">
                {NAV_LINKS.map((link) => {
                  const mActive = navLinkActive(pathname, categoryParam, link.href)
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`link-underline-anim mx-auto text-center rounded-xl px-4 py-3.5 font-sans text-base font-semibold transition-colors duration-200 active:bg-white/5 ${
                        mActive
                          ? 'link-underline-active text-mugen-gold'
                          : 'text-mugen-white hover:text-mugen-gold'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                })}
                {SHOW_INVOICE_PREVIEW && (
                  <Link
                    href="/invoice/preview"
                    className={`link-underline-anim mx-auto text-center rounded-xl px-4 py-3.5 font-sans text-base font-semibold transition-colors duration-200 active:bg-white/5 ${
                      pathname.startsWith('/invoice')
                        ? 'link-underline-active text-mugen-gold'
                        : 'text-amber-400/80 hover:text-amber-300'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🧾 Invoice
                  </Link>
                )}

                {/* Actions Section */}
                <div className="mt-2 border-t border-white/15 pt-2">
                  <Link
                    href="/cart"
                    className={`flex items-center justify-center gap-3 rounded-xl px-4 py-3.5 font-sans text-base font-semibold transition-colors duration-200 hover:text-mugen-gold active:bg-white/5 ${
                      pathname === '/cart' ? 'text-mugen-gold' : 'text-mugen-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      <ShoppingCart className="h-[22px] w-[22px]" aria-hidden />
                      {cartCount > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-mugen-crimson px-1 text-[10px] text-white">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </div>
                    <span>Cart</span>
                  </Link>

                  {loggedIn ? (
                    <Link
                      href="/account"
                      className={`flex items-center justify-center gap-3 rounded-xl px-4 py-3.5 font-sans text-base font-semibold transition-colors duration-200 hover:text-mugen-gold active:bg-white/5 ${
                        pathname.startsWith('/account') ? 'text-mugen-gold' : 'text-mugen-white'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-[22px] w-[22px]" aria-hidden />
                      <span>Account</span>
                    </Link>
                  ) : (
                    showSignIn && (
                      <Link
                        href="/login"
                        className={`flex items-center justify-center gap-3 rounded-xl px-4 py-3.5 font-sans text-base font-semibold transition-colors duration-200 hover:text-mugen-gold active:bg-white/5 ${
                          pathname.startsWith('/login') ? 'text-mugen-gold' : 'text-mugen-white'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-[22px] w-[22px]" aria-hidden />
                        <span>Sign in</span>
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
