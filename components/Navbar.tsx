'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Menu, X, Search, ShoppingCart, Infinity as InfinityMark, User } from 'lucide-react'
import { GlowButton } from './GlowButton'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
] as const

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  /** `undefined` until synced — matches SSR first paint; then `''` or category id (avoids useSearchParams hydration mismatch). */
  const [categoryParam, setCategoryParam] = useState<string | undefined>(undefined)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart')
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
  }, [])

  const refreshSession = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSessionEmail(null)
      setIsAdmin(false)
      setCartCount(0)
      return
    }
    setSessionEmail(user.email ?? null)
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    setIsAdmin(!!profile?.is_admin)
    await refreshCart()
  }, [refreshCart])

  useLayoutEffect(() => {
    setCategoryParam(searchParams.get('category') ?? '')
  }, [searchParams])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    void refreshSession()
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession()
    })
    const onCart = () => void refreshCart()
    window.addEventListener('cart:updated', onCart)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('cart:updated', onCart)
    }
  }, [refreshSession, refreshCart])

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-3 sm:px-4 pt-4 pointer-events-none">
      <div className="pointer-events-auto w-[80%] max-w-[1600px] relative">
        <nav
          className={`
            flex h-14 sm:h-16 items-center justify-between gap-2 rounded-full px-3 sm:px-5 md:px-8
            glass border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.45)]
            text-mugen-white transition-all duration-300
            ${isScrolled ? 'bg-black/35 backdrop-blur-xl' : 'bg-black/25 backdrop-blur-md'}
          `}
        >
          <Link href="/" className="flex min-w-0 shrink items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-mugen-crimson via-mugen-magenta/80 to-mugen-gold shadow-md ring-1 ring-white/15"
              aria-hidden
            >
              <InfinityMark className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <span className="font-cinzel text-lg font-bold tracking-tight text-white sm:text-xl hidden min-[400px]:inline truncate">
              Infinity Style
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:gap-5 xl:gap-6 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = navLinkActive(pathname, categoryParam, link.href)
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                    active ? 'text-mugen-gold' : 'text-white/95 hover:text-mugen-gold'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href="/shop"
              className="rounded-lg p-2 text-white transition-all duration-200 hover:scale-110 hover:bg-white/10 hover:text-mugen-gold active:scale-95"
              aria-label="Search shop"
            >
              <Search size={20} />
            </Link>

            <Link
              href="/cart"
              className="relative rounded-lg p-2 text-white transition-all duration-200 hover:scale-110 hover:bg-white/10 hover:text-mugen-gold active:scale-95"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-mugen-crimson px-1 text-xs text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {sessionEmail ? (
              <Link
                href="/account"
                className="hidden rounded-lg p-2 text-white transition-all duration-200 hover:bg-white/10 hover:text-mugen-gold sm:flex"
                aria-label="Account"
              >
                <User size={20} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-white/90 hover:text-mugen-gold sm:inline"
              >
                Sign in
              </Link>
            )}



            <div className="hidden sm:block">
              <Link href="/shop">
                <GlowButton size="sm">Shop now</GlowButton>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-white transition-all duration-200 hover:scale-110 hover:bg-white/10 hover:text-mugen-gold active:scale-95 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-white/15 bg-mugen-black/90 p-4 shadow-2xl backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`font-sans text-sm font-semibold py-2 transition-colors duration-200 ${
                    navLinkActive(pathname, categoryParam, link.href)
                      ? 'text-mugen-gold'
                      : 'text-mugen-white hover:text-mugen-gold'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {sessionEmail ? (
                <Link
                  href="/account"
                  className="border-t border-mugen-gray/60 pt-3 font-semibold text-mugen-gold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="border-t border-mugen-gray/60 pt-3 font-semibold text-mugen-gold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}

              <div className="border-t border-mugen-gray/60 pt-3">
                <Link href="/shop" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                  <GlowButton className="w-full">Shop now</GlowButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
