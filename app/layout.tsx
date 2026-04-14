import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Cinzel_Decorative, Noto_Sans_JP, DM_Sans, Bungee } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AosProvider } from '@/components/AosProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { LoaderProvider } from '@/context/LoaderContext'
import { GlobalLoader } from '@/components/GlobalLoader'
import { AppProviders } from '@/components/providers/AppProviders'
import { MobileOptimizer } from '@/components/MobileOptimizer'
import './globals.css'

const cinzel = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cinzel',
})
const notoJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-jp',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
})

/** Bungee (400) — use class `.bungee-regular` when you want this face; not applied globally. */
const bungee = Bungee({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bungee',
})

export const metadata: Metadata = {
  title: 'Infinity Style - Anime Merchandise',
  description: 'Exclusive anime merchandise drops with premium 3D models and custom orders',
  manifest: '/manifest.json',
  generator: 'v0.app',
  icons: {
    icon: [
      // Primary favicon — multi-resolution ICO (16, 32, 48 px)
      { url: '/favicon.ico?v=3', sizes: 'any' },
      // Explicit PNG sizes for modern browsers
      { url: '/favicon-16x16.png?v=3', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png?v=3', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-192x192.png?v=3', sizes: '192x192', type: 'image/png' },
      // SVG fallback — scales perfectly at any resolution
      { url: '/favicon.svg?v=3', type: 'image/svg+xml' },
    ],
    // iOS home-screen icon (180×180)
    apple: [{ url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' }],
    // Android / PWA
    other: [
      { rel: 'manifest-icon', url: '/favicon-512x512.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22201f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cinzel.variable} ${notoJp.variable} ${dmSans.variable} ${bungee.variable}`}
    >
      <body
        className="font-sans antialiased min-h-screen bg-mugen-atmosphere text-mugen-white"
        suppressHydrationWarning
      >
        <AppProviders>
          <MobileOptimizer />
          <LoaderProvider>
            <GlobalLoader>
              <AosProvider>
                <Suspense fallback={<div className="min-h-[4.5rem] shrink-0 sm:min-h-20" aria-hidden />}>
                  <Navbar />
                </Suspense>
                {children}
                <Footer />
              </AosProvider>
            </GlobalLoader>
          </LoaderProvider>
        </AppProviders>
        <Analytics />
      </body>
    </html>
  )
}
