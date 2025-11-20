import type { Metadata } from 'next'
import { Montserrat, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Providers } from './providers'

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-montserrat',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
})

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: 'THPT Phước Bửu - Hệ thống LMS',
  description: 'Nền tảng học tập và mạng xã hội cho trường học THPT Phước Bửu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${poppins.variable} font-sans`}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

