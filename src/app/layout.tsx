import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'ITOP - تواصل بلا حدود',
  description: 'تطبيق دردشة فوري احترافي يشبه واتساب بتصميم عصري وأنيميشن سلسة',
  keywords: 'ITOP, دردشة, chat, messaging, واتساب',
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
