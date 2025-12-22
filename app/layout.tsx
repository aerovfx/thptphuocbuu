import type { Metadata } from 'next'
import { 
  Poppins, 
  Inter,
} from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Providers } from './providers'

// Optimized: Only load essential fonts to reduce bundle size
const poppins = Poppins({
  subsets: ['latin', 'latin-ext'], // Poppins doesn't support 'vietnamese' subset
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
})

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'THPT Phước Bửu - Hệ thống LMS',
  description: 'Nền tảng học tập và mạng xã hội cho trường học THPT Phước Bửu',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'THPT Phước Bửu',
  },
  robots: {
    index: true,
    follow: true,
  },
  // Performance hints
  other: {
    'x-dns-prefetch-control': 'on',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vercel Analytics/Speed Insights rely on Vercel-provided /_vercel/* routes.
  // On non-Vercel platforms (e.g. Cloud Run) they 404 and spam console errors.
  const isVercel = !!process.env.VERCEL

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && isVercel && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}

