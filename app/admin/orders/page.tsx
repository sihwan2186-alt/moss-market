'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { formatDateTime } from '@/lib/i18n'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'
import { translateProductName } from '@/lib/sample-products'

type ShippingAddress = {
  recipient?: string
  line1?: string
  line2?: string
  city?: string
  postalCode?: string
  country?: string
} | null

type AdminOrder = {
  _id?: string
  id?: string
  totalPrice: number
  status: 'pending' | 'paid' | 'cancelled' | string
  createdAt: string
  customerName?: string
  contactEmail?: string
  shippingAddress?: ShippingAddress
  note?: string
  paymentLast4?: string
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

type Feedback = {
  tone: 'error' | 'success'
  text: string
}

const statusOptions = ['pending', 'paid', 'cancelled'] as const

function formatAddress(shippingAddress?: ShippingAddress) {
  if (!shippingAddress) {
    return ''
  }

  return [
    shippingAddress.recipient,
    shippingAddress.line1,
    shippingAddress.line2,
    shippingAddress.city,
    shippingAddress.postalCode,
    shippingAddress.country,
  ]
    .filter((value) => value && value.trim().length > 0)
    .join(', ')
}

export default function AdminOrdersPage() {
  const { locale, messages: t } = useLanguage()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [statusUpdatingId, setStatusUpdatingId] = useState('')

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            refresh: '새로고침',
            contact: '연락처',
            shipping: '배송지',
            payment: '결제',
            note: '주문 메모',
            noShipping: '배송지 정보 없음',
            noNote: '메모 없음',
            noPayment: '테스트 결제 정보 없음',
            statusActions: '상태 변경',
            pending: '보류',
            paid: '결제 완료',
            cancelled: '취소',
            updating: '상태 저장 중...',
            totalLabel: '총액',
            shippingRecipient: '수령인',
          }
        : {
            refresh: 'Refresh',
            contact: 'Contact',
            shipping: 'Shipping',
            payment: 'Payment',
            note: 'Order note',
            noShipping: 'No shipping address provided.',
            noNote: 'No note provided.',
            noPayment: 'No test card captured.',
            statusActions: 'Status actions',
            pending: 'Pending',
            paid: 'Paid',
            cancelled: 'Cancelled',
            updating: 'Saving status...',
            totalLabel: 'Total',
            shippingRecipient: 'Recipient',
          },
    [locale]
  )

  const loadOrders = useCallback(async () => {
    const ordersResponse = await fetch('/api/admin/orders', { cache: 'no-store' })
    const ordersData = await ordersResponse.json()

    if (!ordersResponse.ok) {
      throw new Error(ordersData.message ?? t.adminOrders.loadFailed)
    }

    setOrders(ordersData.orders ?? [])
    setMode(ordersData.mode === 'local-fallback' ? 'local-fallback' : 'database')
  }, [t.adminOrders.loadFailed])

  useEffect(() => {
    const loadPage = async () => {
      try {
        const sessionResponse = await fetch('/api/session', { cache: 'no-store' })
        const sessionData = await sessionResponse.json()
        setUser(sessionData.user ?? null)

        if (sessionData.user?.role !== 'admin') {
          return
        }

        await loadOrders()
        setFeedback(null)
      } catch (error) {
        setFeedback({
          tone: 'error',
          text: error instanceof Error ? error.message : t.adminOrders.loadFailed,
        })
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    void loadPage()
  }, [loadOrders, t.adminOrders.loadFailed])

  const handleStatusChange = async (orderId: string, nextStatus: (typeof statusOptions)[number]) => {
    try {
      setStatusUpdatingId(orderId)
      setFeedback(null)

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          text: data.message ?? t.adminOrders.loadFailed,
        })
        return
      }

      await loadOrders()
      setFeedback({
        tone: 'success',
        text: data.message ?? 'Order status updated.',
      })
    } catch {
      setFeedback({
        tone: 'error',
        text: t.adminOrders.loadFailed,
      })
    } finally {
      setStatusUpdatingId('')
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.adminOrders.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{t.adminOrders.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => void loadOrders()}
              disabled={!isAdmin || loading}
              className="text-sm font-semibold text-[#1d3124] underline underline-offset-4 disabled:opacity-40"
              type="button"
            >
              {copy.refresh}
            </button>
            <Link href="/admin/products" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
              {t.adminOrders.manageProducts}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {t.adminOrders.loading}
          </div>
        ) : !user ? (
          <div className="rounded-[28px] border border-[#d6c5ae] bg-[#fff5e7] p-6 text-[#6d5641] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {t.adminOrders.needsLogin}
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.login}
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-[28px] border border-[#e1c9c9] bg-[#fff1f1] p-6 text-[#7a3d3d] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {t.adminOrders.noAccess}
          </div>
        ) : (
          <>
            {mode === 'local-fallback' && (
              <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
                {t.adminOrders.fallbackNotice}
              </div>
            )}

            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                  {t.adminOrders.totalOrders}
                </p>
                <p className="mt-3 text-3xl font-black">{orders.length}</p>
              </div>
              <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                  {t.adminOrders.revenue}
                </p>
                <p className="mt-3 text-3xl font-black">
                  ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                  {t.adminOrders.paidOrders}
                </p>
                <p className="mt-3 text-3xl font-black">
                  {orders.filter((order) => order.status.toLowerCase() === 'paid').length}
                </p>
              </div>
            </section>

            {feedback && (
              <p className={`mb-6 text-sm ${feedback.tone === 'error' ? 'text-[#8b2d2d]' : 'text-[#2f6d43]'}`}>
                {feedback.text}
              </p>
            )}

            <section className="space-y-5">
              {orders.length === 0 ? (
                <div className="rounded-[28px] bg-white p-6 text-[#5d6a61] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                  {t.adminOrders.noOrders}
                </div>
              ) : (
                orders.map((order) => {
                  const orderId = order._id ?? order.id ?? 'local-order'
                  const orderUser =
                    typeof order.userId === 'object' && order.userId !== null ? order.userId : (order.user ?? null)
                  const shippingLabel = formatAddress(order.shippingAddress)
                  const customerLabel = order.customerName || orderUser?.name || t.adminOrders.unknown
                  const contactEmail = order.contactEmail || orderUser?.email || t.adminOrders.unknown

                  return (
                    <article
                      key={orderId}
                      className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {t.orders.orderPrefix} #{orderId.slice(-6)}
                          </p>
                          <p className="mt-2 text-sm text-[#5d6a61]">{formatDateTime(locale, order.createdAt)}</p>
                          <p className="mt-2 text-sm text-[#425247]">
                            {t.adminOrders.customer}: {customerLabel} ({contactEmail})
                          </p>
                        </div>
                        <div className="text-right">
                          <OrderStatusBadge status={order.status} />
                          <p className="mt-3 text-lg font-bold">
                            {copy.totalLabel} ${order.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div className="rounded-[24px] bg-[#faf7f1] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.contact}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-[#18261d]">{customerLabel}</p>
                          <p className="mt-2 text-sm text-[#5d6a61]">{contactEmail}</p>
                        </div>
                        <div className="rounded-[24px] bg-[#faf7f1] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.shipping}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[#425247]">{shippingLabel || copy.noShipping}</p>
                        </div>
                        <div className="rounded-[24px] bg-[#faf7f1] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.payment}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-[#18261d]">
                            {order.paymentLast4 ? `•••• ${order.paymentLast4}` : copy.noPayment}
                          </p>
                          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.note}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#425247]">{order.note || copy.noNote}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {order.items.map((item, index) => (
                          <div key={`${orderId}-${index}`} className="flex items-center gap-4">
                            <Image
                              src={item.image}
                              alt={translateProductName(item.name, locale)}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{translateProductName(item.name, locale)}</p>
                              <p className="text-sm text-[#5d6a61]">
                                {t.orders.quantity} {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 border-t border-black/5 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                          {copy.statusActions}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {statusOptions.map((status) => (
                            <button
                              key={status}
                              onClick={() => void handleStatusChange(orderId, status)}
                              disabled={statusUpdatingId === orderId || order.status === status}
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                order.status === status
                                  ? 'bg-[#1d3124] text-white'
                                  : 'border border-black/10 bg-white text-[#314338]'
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                              type="button"
                            >
                              {statusUpdatingId === orderId && order.status !== status
                                ? copy.updating
                                : copy[status as keyof typeof copy]}
                            </button>
                          ))}
                        </div>
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
