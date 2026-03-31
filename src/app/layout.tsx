import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'ITOP - تواصل بلا حدود',
  description: 'تطبيق دردشة فوري احترافي يشبه تطبيق الآيفون',
  keywords: 'ITOP, دردشة, chat, messaging',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'ITOP',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased`}
        style={{ fontFamily: 'var(--font-cairo), Cairo, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
