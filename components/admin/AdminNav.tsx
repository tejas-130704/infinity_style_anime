'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
] as const

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-4 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-6">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              active
                ? 'bg-mugen-crimson/30 text-mugen-gold ring-1 ring-mugen-glow/40'
                : 'text-white/80 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
