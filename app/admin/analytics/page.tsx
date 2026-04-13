'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Analytics page uses dynamic import with ssr:false so the heavy Recharts
 * bundle is code-split into a separate chunk and never server-rendered.
 * The Suspense skeleton keeps the layout shift minimal.
 */
const AnalyticsClient = dynamic(() => import('./AnalyticsClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-mugen-crimson" />
        <p className="mt-3 text-sm text-white/60">Loading analytics…</p>
      </div>
    </div>
  ),
})

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-mugen-crimson" />
        </div>
      }
    >
      <AnalyticsClient />
    </Suspense>
  )
}
