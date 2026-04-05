import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono, Cinzel_Decorative, Noto_Sans_JP, DM_Sans, Bungee } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AosProvider } from '@/components/AosProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: '--font-dm-sans' });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const cinzel = Cinzel_Decorative({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-cinzel' });
const notoJp = Noto_Sans_JP({ subsets: ["latin"], weight: ['400', '500', '700'], variable: '--font-noto-jp' });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ['400', '500', '700'], variable: '--font-dm-sans' });

/** Bungee (400) — use class `.bungee-regular` when you want this face; not applied globally. */
const bungee = Bungee({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bungee',
})

export const metadata: Metadata = {
  title: 'Infinity Style - Anime Merchandise',
  description: 'Exclusive anime merchandise drops with premium 3D models and custom orders',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
      className={`${cinzel.variable} ${notoJp.variable} ${dmSans.variable} ${bungee.variable}`}
    >
      <body className="font-sans antialiased min-h-screen bg-mugen-atmosphere text-mugen-white">
        <AosProvider>
          <Suspense fallback={<div className="h-16 shrink-0" aria-hidden />}>
            <Navbar />
          </Suspense>
          {children}
          <Footer />
        </AosProvider>
        <Analytics />
      </body>
    </html>
  )
}
