'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import StoreHeader from '@/components/StoreHeader'

type CartItem = {
  productId: string
  quantity: number
  name: string
  image: string
  price: number
  subtotal: number
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [lastOrderId, setLastOrderId] = useState('')
  const [paymentName, setPaymentName] = useState('Test User')
  const [paymentNumber, setPaymentNumber] = useState('4242 4242 4242 4242')
  const [paymentExpiry, setPaymentExpiry] = useState('12/30')
  const [paymentCvc, setPaymentCvc] = useState('123')

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items])

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/cart', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message ?? 'Could not load checkout items.')
          setItems([])
          setNeedsLogin(response.status === 401)
          return
        }

        setItems(data.items ?? [])
        setNeedsLogin(false)
        setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
      } catch {
        setMessage('Could not load checkout items.')
      } finally {
        setLoading(false)
      }
    }

    void loadCart()
  }, [])

  const handleCheckout = async () => {
    if (!paymentName || !paymentNumber || !paymentExpiry || !paymentCvc) {
      setMessage('Fill out the test payment form first.')
      return
    }

    try {
      setOrdering(true)
      const response = await fetch('/api/orders', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message ?? 'Checkout failed.')
        return
      }

      setLastOrderId(data.orderId ?? '')
      setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
      setItems([])
      setMessage(data.message ?? 'Order created successfully.')
    } catch {
      setMessage('Checkout failed.')
    } finally {
      setOrdering(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader cartCount={items.length} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">Checkout</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Purchase page</h1>
          </div>
          <Link href="/cart" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
            Back to cart
          </Link>
        </div>

        {mode === 'local-fallback' && !needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            MongoDB is currently unavailable, so this checkout is using local fallback storage.
          </div>
        )}

        {needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            You need to log in before opening the purchase page.
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              Go to login
            </Link>
          </div>
        )}

        {lastOrderId && (
          <div className="mb-6 rounded-[24px] border border-[#c9dfcb] bg-[#edf8ee] p-5 text-sm text-[#2f5b39]">
            Purchase completed successfully.
            <span className="ml-2 font-semibold">Reference: {lastOrderId}</span>
            <Link href="/orders" className="ml-3 font-semibold underline underline-offset-4">
              View purchase history
            </Link>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h2 className="text-2xl font-bold">Order items</h2>
            <div className="mt-5 space-y-4">
              {loading && <p>Loading checkout items...</p>}
              {!loading && !needsLogin && items.length === 0 && (
                <p className="text-[#5d6a61]">There are no items ready for checkout yet.</p>
              )}
              {items.map((item) => (
                <article key={item.productId} className="flex gap-4 rounded-[24px] bg-[#faf7f1] p-4">
                  <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-2 text-sm text-[#5d6a61]">Quantity {item.quantity}</p>
                    <p className="mt-2 text-sm text-[#5d6a61]">${item.price} each</p>
                  </div>
                  <p className="self-center font-semibold">${item.subtotal}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h2 className="text-2xl font-bold">Payment</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#314338]">Cardholder</span>
                <input
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#314338]">Card number</span>
                <input
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#314338]">Expiry</span>
                  <input
                    value={paymentExpiry}
                    onChange={(e) => setPaymentExpiry(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#314338]">CVC</span>
                  <input
                    value={paymentCvc}
                    onChange={(e) => setPaymentCvc(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#203126] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8c9bc]">Total</p>
              <p className="mt-3 text-3xl font-black">${totalPrice}</p>
              <p className="mt-3 text-sm text-[#d9e5dc]">This is a demo payment flow. No real payment is processed.</p>
            </div>

            <button
              onClick={() => void handleCheckout()}
              disabled={ordering || items.length === 0 || needsLogin}
              className="mt-6 w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ordering ? 'Processing purchase...' : 'Complete purchase'}
            </button>

            {message && <p className="mt-4 text-sm text-[#2f6d43]">{message}</p>}
          </aside>
        </div>
      </main>
    </div>
  )
}
