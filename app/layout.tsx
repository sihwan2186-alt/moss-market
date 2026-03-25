import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import localFont from 'next/font/local'
import { CartProvider } from '@/components/CartProvider'
import { LanguageProvider } from '@/components/LanguageProvider'
import { detectLocale } from '@/lib/i18n'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Moss Market',
  description: 'MongoDB-powered storefront starter built with Next.js and TypeScript.',
  keywords: ['Next.js', 'MongoDB', 'TypeScript', 'storefront', 'ecommerce', 'Vercel'],
  openGraph: {
    title: 'Moss Market',
    description: 'MongoDB-powered storefront starter built with Next.js and TypeScript.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = detectLocale(cookies().get('locale')?.value, headers().get('accept-language'))

  return (
    <html lang={locale} translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className={`notranslate ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider initialLocale={locale}>
          <CartProvider>{children}</CartProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
