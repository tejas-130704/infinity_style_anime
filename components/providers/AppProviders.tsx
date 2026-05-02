'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { AssetProtectionProvider } from '@/components/security/AssetProtectionProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      <AssetProtectionProvider>
        {children}
      </AssetProtectionProvider>
      <Toaster position="top-right" richColors theme="dark" closeButton />
    </SessionProvider>
  )
}

