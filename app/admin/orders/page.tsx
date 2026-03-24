'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'

type AdminOrder = {
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
  user?: {
    email?: string
    name?: string
    role?: string
  } | null
  userId?:
    | {
        email?: string
        name?: string
        role?: string
      }
    | string
}

type SessionUser = {
  email: string
  role: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')

  useEffect(() => {
    const loadPage = async () => {
      try {
        const sessionResponse = await fetch('/api/session', { cache: 'no-store' })
        const sessionData = await sessionResponse.json()
        setUser(sessionData.user ?? null)

        if (sessionData.user?.role !== 'admin') {
          setLoading(false)
          return
        }

        const ordersResponse = await fetch('/api/admin/orders', { cache: 'no-store' })
        const ordersData = await ordersResponse.json()

        if (!ordersResponse.ok) {
          setMessage(ordersData.message ?? 'Could not load admin orders.')
          setOrders([])
          return
        }

        setOrders(ordersData.orders ?? [])
        setMode(ordersData.mode === 'local-fallback' ? 'local-fallback' : 'database')
      } catch {
        setMessage('Could not load admin orders.')
      } finally {
        setLoading(false)
      }
    }

    void loadPage()
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">Admin</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Order management</h1>
          </div>
          <Link href="/admin/products" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
            Manage products
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            Loading admin orders...
          </div>
        ) : !user ? (
          <div className="rounded-[28px] border border-[#d6c5ae] bg-[#fff5e7] p-6 text-[#6d5641] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            You need to log in before opening the admin order page.
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              Go to login
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-[28px] border border-[#e1c9c9] bg-[#fff1f1] p-6 text-[#7a3d3d] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            Your current account does not have admin access.
          </div>
        ) : (
          <>
            {mode === 'local-fallback' && (
              <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
                Admin orders are loading from local fallback storage because MongoDB is unavailable.
              </div>
            )}

            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Total orders</p>
                <p className="mt-3 text-3xl font-black">{orders.length}</p>
              </div>
              <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Revenue</p>
                <p className="mt-3 text-3xl font-black">
                  ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Paid orders</p>
                <p className="mt-3 text-3xl font-black">
                  {orders.filter((order) => order.status.toLowerCase() === 'paid').length}
                </p>
              </div>
            </section>

            {message && <p className="mb-6 text-[#8b2d2d]">{message}</p>}

            <section className="space-y-5">
              {orders.length === 0 ? (
                <div className="rounded-[28px] bg-white p-6 text-[#5d6a61] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                  No orders yet.
                </div>
              ) : (
                orders.map((order) => {
                  const orderId = order._id ?? order.id ?? 'local-order'
                  const orderUser =
                    typeof order.userId === 'object' && order.userId !== null ? order.userId : (order.user ?? null)

                  return (
                    <article
                      key={orderId}
                      className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            Order #{orderId.slice(-6)}
                          </p>
                          <p className="mt-2 text-sm text-[#5d6a61]">{new Date(order.createdAt).toLocaleString()}</p>
                          <p className="mt-2 text-sm text-[#425247]">
                            Customer: {orderUser?.name ?? 'Unknown'} {orderUser?.email ? `(${orderUser.email})` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <OrderStatusBadge status={order.status} />
                          <p className="mt-3 text-lg font-bold">Total ${order.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {order.items.map((item, index) => (
                          <div key={`${orderId}-${index}`} className="flex items-center gap-4">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-sm text-[#5d6a61]">Qty {item.quantity}</p>
                            </div>
                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
