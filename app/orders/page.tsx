'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'

type Order = {
  _id?: string
  id?: string
  totalPrice: number
  status: string
  createdAt: string
  items: Array<{
    name: string
    quantity: number
    price: number
    image: string
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message ?? 'Could not load orders.')
          setOrders([])
          setNeedsLogin(response.status === 401)
          return
        }

        setOrders(data.orders ?? [])
        setNeedsLogin(false)
        setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
      } catch {
        setMessage('Could not load orders.')
      } finally {
        setLoading(false)
      }
    }

    void loadOrders()
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">Orders</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Purchase history</h1>
        </div>

        {!needsLogin && !loading && orders.length > 0 && (
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Orders placed</p>
              <p className="mt-3 text-3xl font-black">{orders.length}</p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Total spent</p>
              <p className="mt-3 text-3xl font-black">
                ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Latest order</p>
              <p className="mt-3 text-3xl font-black">{new Date(orders[0].createdAt).toLocaleDateString()}</p>
            </div>
          </section>
        )}

        {mode === 'local-fallback' && !needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            Orders are currently loading from local fallback storage because MongoDB is unavailable.
          </div>
        )}

        {needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            You need to log in before viewing orders.
            <a href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              Go to login
            </a>
          </div>
        )}

        <section className="space-y-5">
          {loading && <p>Loading orders...</p>}
          {!loading && !message && !needsLogin && orders.length === 0 && (
            <div className="rounded-[28px] bg-white p-6 text-[#5d6a61] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              No orders yet. Place a test payment from the cart to see your first order.
            </div>
          )}
          {message && <p className="text-[#8b2d2d]">{message}</p>}
          {orders.map((order) => {
            const orderId = order._id ?? order.id ?? 'local-order'
            return (
              <article key={orderId} className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                      Order #{orderId.slice(-6)}
                    </p>
                    <p className="mt-1 text-sm text-[#5d6a61]">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#68806f]">Status</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {order.items.map((item, index) => (
                    <div key={`${orderId}-${index}`} className="flex items-center gap-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-[#5d6a61]">Qty {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                  <Link
                    href={`/orders/${orderId}`}
                    className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                  >
                    View details
                  </Link>
                  <div className="text-lg font-bold">Total ${order.totalPrice}</div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
