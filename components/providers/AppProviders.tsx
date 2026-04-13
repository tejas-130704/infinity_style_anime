'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AssetProtectionProvider } from '@/components/security/AssetProtectionProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      <AssetProtectionProvider>
        {children}
      </AssetProtectionProvider>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop theme="dark" />
    </SessionProvider>
  )
}

