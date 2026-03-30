'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useCart } from '@/components/CartProvider'
import { useLanguage } from '@/components/LanguageProvider'
import { Locale, translateRole } from '@/lib/i18n'

type StoreHeaderProps = {
  cartCount?: number
}

type SessionUser = {
  email: string
  role: string
}

export default function StoreHeader({ cartCount }: StoreHeaderProps) {
  const { locale, messages: t, setLocale } = useLanguage()
  const { cartCount: syncedCartCount } = useCart()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedCartCount = cartCount ?? syncedCartCount

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' })
        const data = await response.json()
        setUser(data.user ?? null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    void loadSession()
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleLocaleChange = (nextLocale: Locale) => {
    setLocale(nextLocale)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f1e8]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-[#1d3124]">
          Moss Market
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-[#314338]">
          <Link href="/">{t.header.shop}</Link>
          <Link href="/cart">
            {t.header.cart} ({resolvedCartCount})
          </Link>
          <Link href="/orders">{t.header.orders}</Link>
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 p-1 text-xs font-bold uppercase">
            {(['en', 'ko'] as Locale[]).map((option) => (
              <button
                key={option}
                onClick={() => handleLocaleChange(option)}
                className={`rounded-full px-3 py-1 transition ${
                  locale === option ? 'bg-[#1d3124] text-white' : 'text-[#506255]'
                }`}
                type="button"
                aria-label={`${t.header.language}: ${option.toUpperCase()}`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          {loading ? (
            <span>{t.header.loading}</span>
          ) : user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/products">{t.header.products}</Link>
                  <Link href="/admin/orders">{t.header.adminOrders}</Link>
                </>
              )}
              <span className="max-w-44 truncate text-[#5b6d60]">{user.email}</span>
              <span className="rounded-full bg-[#e8eee8] px-2 py-1 text-xs uppercase tracking-[0.18em] text-[#4a5d50]">
                {translateRole(user.role, locale)}
              </span>
              <button onClick={handleLogout} className="font-semibold text-[#1d3124]">
                {t.header.logout}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth?type=login">{t.header.login}</Link>
              <Link href="/auth?type=admin-login" className="font-semibold text-[#1d3124]">
                {t.header.adminLogin}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
