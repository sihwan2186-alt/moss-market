'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'

type OrderItem = {
  image: string
  name: string
  quantity: number
  price: number
}

type Order = {
  _id?: string
  id?: string
  totalPrice: number
  status: string
  createdAt: string
  items: OrderItem[]
}

type OrderDetailPageProps = {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [orderId] = useState(params.id)
  const [order, setOrder] = useState<Order | null>(null)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [message, setMessage] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`, {
          cache: 'no-store',
        })
        const data = await response.json()

        if (!response.ok) {
          setOrder(null)
          setNeedsLogin(response.status === 401)
          setMessage(data.message ?? 'Could not load this order.')
          return
        }

        setOrder(data.order ?? null)
        setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
        setNeedsLogin(false)
        setMessage('')
      } catch {
        setOrder(null)
        setMessage('Could not load this order.')
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [params.id])

  const displayOrderId = order?._id ?? order?.id ?? orderId

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/orders" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          Back to orders
        </Link>

        {loading && <p className="mt-8 text-[#5d6a61]">Loading order...</p>}

        {!loading && needsLogin && (
          <div className="mt-8 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            You need to log in before viewing this order.
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              Go to login
            </Link>
          </div>
        )}

        {!loading && !needsLogin && !order && (
          <div className="mt-8 rounded-[28px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h1 className="text-3xl font-black">Order not found</h1>
            <p className="mt-4 text-[#5d6a61]">{message || 'The requested order does not exist.'}</p>
          </div>
        )}

        {!loading && order && (
          <>
            {mode === 'local-fallback' && (
              <div className="mt-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
                This order is being shown from local fallback storage because MongoDB is unavailable.
              </div>
            )}

            <section className="mt-8 rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">Order reference</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight">#{displayOrderId.slice(-8)}</h1>
                  <p className="mt-3 text-sm text-[#5d6a61]">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-[24px] bg-[#f7f1e8] px-5 py-4 text-right">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#68806f]">Status</p>
                  <div className="mt-3">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Items</p>
                  <p className="mt-3 text-3xl font-black">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Payment</p>
                  <p className="mt-3 text-3xl font-black">Test card</p>
                </div>
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Order total</p>
                  <p className="mt-3 text-3xl font-black">${order.totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {order.items.map((item, index) => (
                  <article key={`${displayOrderId}-${index}`} className="flex gap-4 rounded-[24px] bg-[#faf7f1] p-4">
                    <img src={item.image} alt={item.name} className="h-24 w-24 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h2 className="text-lg font-bold">{item.name}</h2>
                      <p className="mt-2 text-sm text-[#5d6a61]">Quantity {item.quantity}</p>
                      <p className="mt-2 text-sm text-[#5d6a61]">${item.price} each</p>
                    </div>
                    <p className="self-center text-lg font-bold">${item.price * item.quantity}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex justify-end border-t border-black/5 pt-6">
                <div className="rounded-[24px] bg-[#203126] px-6 py-4 text-right text-white">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#b8c9bc]">Final total</p>
                  <p className="mt-2 text-2xl font-black">${order.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
