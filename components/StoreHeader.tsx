'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'

type StoreHeaderProps = {
  cartCount?: number
}

type SessionUser = {
  email: string
  role: string
}

export default function StoreHeader({ cartCount = 0 }: StoreHeaderProps) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f1e8]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-[#1d3124]">
          Moss Market
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-[#314338]">
          <Link href="/">Shop</Link>
          <Link href="/cart">Cart ({cartCount})</Link>
          <Link href="/orders">Orders</Link>
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/products">Products</Link>
                  <Link href="/admin/orders">Admin Orders</Link>
                </>
              )}
              <span className="max-w-44 truncate text-[#5b6d60]">{user.email}</span>
              <span className="rounded-full bg-[#e8eee8] px-2 py-1 text-xs uppercase tracking-[0.18em] text-[#4a5d50]">
                {user.role}
              </span>
              <button onClick={handleLogout} className="font-semibold text-[#1d3124]">
                Logout
              </button>
            </>
          ) : (
            <Link href="/auth?type=login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
