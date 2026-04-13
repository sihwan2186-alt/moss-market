'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import StoreHeader from '@/components/StoreHeader'
import { dispatchCartUpdated } from '@/lib/cart-events'
import { shouldBypassProductImageOptimization } from '@/lib/product-image-storage'
import { translateProductName } from '@/lib/sample-products'

type CartItem = {
  productId: string
  quantity: number
  name: string
  image: string
  price: number
  stock: number
  subtotal: number
}

export default function CartPage() {
  const { locale, messages: t } = useLanguage()
  const [items, setItems] = useState<CartItem[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentName, setPaymentName] = useState('Test User')
  const [paymentNumber, setPaymentNumber] = useState('4242 4242 4242 4242')
  const [paymentExpiry, setPaymentExpiry] = useState('12/30')
  const [paymentCvc, setPaymentCvc] = useState('123')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [lastOrderId, setLastOrderId] = useState('')

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items])

  const loadCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message ?? t.cart.loadFailed)
        setItems([])
        setNeedsLogin(response.status === 401)
        return
      }

      setItems(data.items ?? [])
      setMessage('')
      setNeedsLogin(false)
      setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
    } catch {
      setMessage(t.cart.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [t.cart.loadFailed])

  const updateQuantity = async (productId: string, nextQuantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity: nextQuantity }),
      })
      const data = await response.json()
      setMessage(data.message ?? (response.ok ? t.cart.updated : t.cart.updateFailed))
      if (response.ok) {
        dispatchCartUpdated()
        await loadCart()
      }
    } catch {
      setMessage(t.cart.updateFailed)
    }
  }

  const removeItem = async (productId: string) => {
    try {
      const response = await fetch(`/api/cart?productId=${productId}`, { method: 'DELETE' })
      const data = await response.json()
      setMessage(data.message ?? (response.ok ? t.cart.removed : t.cart.removeFailed))
      if (response.ok) {
        dispatchCartUpdated()
        await loadCart()
      }
    } catch {
      setMessage(t.cart.removeFailed)
    }
  }

  const checkout = async () => {
    try {
      setOrdering(true)
      const response = await fetch('/api/orders', { method: 'POST' })
      const data = await response.json()
      setMessage(data.message ?? (response.ok ? t.cart.orderPlaced : t.cart.checkoutFailed))

      if (response.ok) {
        setLastOrderId(data.orderId ?? '')
        setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
        setPaymentOpen(false)
        dispatchCartUpdated()
        await loadCart()
      }
    } catch {
      setMessage(t.cart.checkoutFailed)
    } finally {
      setOrdering(false)
    }
  }

  const handleFakePayment = async () => {
    if (!paymentName || !paymentNumber || !paymentExpiry || !paymentCvc) {
      setMessage(t.cart.fillPaymentForm)
      return
    }

    await checkout()
  }

  useEffect(() => {
    void loadCart()
  }, [loadCart])

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.cart.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{t.cart.title}</h1>
          </div>
          <Link href="/" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
            {t.cart.continueShopping}
          </Link>
        </div>

        {mode === 'local-fallback' && !needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.cart.fallbackNotice}
          </div>
        )}

        {needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.cart.needsLogin}
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.login}
            </Link>
          </div>
        )}

        {lastOrderId && (
          <div className="mb-6 rounded-[24px] border border-[#c9dfcb] bg-[#edf8ee] p-5 text-sm text-[#2f5b39]">
            {t.cart.orderCreated}
            <span className="ml-2 font-semibold">
              {t.cart.reference}: {lastOrderId}
            </span>
            <Link href="/orders" className="ml-3 font-semibold underline underline-offset-4">
              {t.cart.viewOrders}
            </Link>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4 rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {loading && <p>{t.cart.loading}</p>}
            {!loading && !needsLogin && items.length === 0 && <p className="text-[#5d6a61]">{t.cart.empty}</p>}
            {items.map((item) => (
              <article key={item.productId} className="flex gap-4 border-b border-black/5 pb-4 last:border-0">
                <Image
                  src={item.image}
                  alt={translateProductName(item.name, locale)}
                  width={96}
                  height={96}
                  unoptimized={shouldBypassProductImageOptimization(item.image)}
                  className="h-24 w-24 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{translateProductName(item.name, locale)}</h2>
                  <p className="mt-3 text-sm text-[#5d6a61]">
                    ${item.price} {t.cart.each}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => item.quantity > 1 && void updateQuantity(item.productId, item.quantity - 1)}
                      className="h-8 w-8 rounded-full border border-black/10 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => void updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="h-8 w-8 rounded-full border border-black/10 text-sm font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => void removeItem(item.productId)}
                      className="ml-3 text-sm font-semibold text-[#8b2d2d] underline underline-offset-4"
                    >
                      {t.cart.remove}
                    </button>
                  </div>
                </div>
                <p className="font-semibold">${item.subtotal}</p>
              </article>
            ))}
          </section>

          <aside className="rounded-[28px] bg-[#203126] p-6 text-[#f5efe3] shadow-[0_18px_60px_rgba(17,24,39,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#b8c9bc]">{t.cart.summary}</p>
            <div className="mt-6 flex items-center justify-between text-lg">
              <span>{t.cart.total}</span>
              <strong>${totalPrice}</strong>
            </div>
            <button
              onClick={() => setPaymentOpen(true)}
              disabled={items.length === 0 || needsLogin}
              className="mt-6 w-full rounded-full bg-[#f0e7d8] px-5 py-3 text-sm font-semibold text-[#18261d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t.cart.openTestPayment}
            </button>
            <Link
              href="/checkout"
              className={`mt-3 block w-full rounded-full border border-[#f0e7d8] px-5 py-3 text-center text-sm font-semibold text-[#f0e7d8] ${
                items.length === 0 || needsLogin ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              {t.cart.purchasePage}
            </Link>
            <p className="mt-3 text-xs text-[#c7d5cb]">{t.cart.demoNote}</p>
            {message && <p className="mt-4 text-sm text-[#d6f4de]">{message}</p>}
          </aside>
        </div>
      </main>

      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.cart.demoCheckout}</p>
                <h2 className="mt-2 text-2xl font-black text-[#18261d]">{t.cart.testPaymentWindow}</h2>
              </div>
              <button onClick={() => setPaymentOpen(false)} className="text-sm font-semibold text-[#68806f]">
                {t.cart.close}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.cart.cardholder}</span>
                <input
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.cart.cardNumber}</span>
                <input
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.cart.expiry}</span>
                  <input
                    value={paymentExpiry}
                    onChange={(e) => setPaymentExpiry(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.cart.cvc}</span>
                  <input
                    value={paymentCvc}
                    onChange={(e) => setPaymentCvc(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#f7f1e8] p-4 text-sm text-[#314338]">
              <div className="flex items-center justify-between">
                <span>{t.cart.demoPaymentTotal}</span>
                <strong>${totalPrice}</strong>
              </div>
              <p className="mt-2 text-xs text-[#68806f]">{t.cart.confirmTip}</p>
            </div>

            <button
              onClick={() => void handleFakePayment()}
              disabled={ordering}
              className="mt-6 w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {ordering ? t.cart.simulatingPayment : t.cart.confirmTestPayment}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
