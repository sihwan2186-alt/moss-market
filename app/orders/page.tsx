'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import RefundStatusBadge from '@/components/RefundStatusBadge'
import ShippingStatusBadge from '@/components/ShippingStatusBadge'
import { useLanguage } from '@/components/LanguageProvider'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'
import { formatDate, formatDateTime } from '@/lib/i18n'
import {
  getOrderEffectiveTotal,
  getOrderRefundStatus,
  getOrderRefundedAmount,
  getRefundableOrderItems,
  type RefundRecord,
  type ShippingAddressFields,
} from '@/lib/order-utils'
import { translateProductName } from '@/lib/sample-products'

type Order = {
  _id?: string
  id?: string
  totalPrice: number
  status: string
  createdAt: string
  customerName?: string
  contactEmail?: string
  shippingAddress?: ShippingAddressFields
  shippingStatus?: string
  note?: string
  paymentLast4?: string
  refunds?: RefundRecord[]
  items: Array<{
    productId?: string
    name: string
    quantity: number
    price: number
    image: string
  }>
}

function formatAddress(shippingAddress?: ShippingAddressFields) {
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

export default function OrdersPage() {
  const { locale, messages: t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            contact: '연락처',
            shipping: '배송지',
            payment: '결제',
            note: '주문 메모',
            noShipping: '배송지 정보 없음',
            noPayment: '테스트 결제 정보 없음',
            noNote: '메모 없음',
            netTotal: '실결제',
            refunded: '환불 금액',
            refundable: '환불 완료',
          }
        : {
            contact: 'Contact',
            shipping: 'Shipping',
            payment: 'Payment',
            note: 'Order note',
            noShipping: 'No shipping address provided.',
            noPayment: 'No test card captured.',
            noNote: 'No note provided.',
            netTotal: 'Net total',
            refunded: 'Refunded',
            refundable: 'Refunded quantity',
          },
    [locale]
  )

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          setMessage(data.message ?? t.orders.loadFailed)
          setOrders([])
          setNeedsLogin(response.status === 401)
          return
        }

        setOrders(data.orders ?? [])
        setNeedsLogin(false)
        setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
        setMessage('')
      } catch {
        setMessage(t.orders.loadFailed)
      } finally {
        setLoading(false)
      }
    }

    void loadOrders()
  }, [t.orders.loadFailed])

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.orders.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{t.orders.title}</h1>
        </div>

        {!needsLogin && !loading && orders.length > 0 && (
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                {t.orders.ordersPlaced}
              </p>
              <p className="mt-3 text-3xl font-black">{orders.length}</p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.orders.totalSpent}</p>
              <p className="mt-3 text-3xl font-black">
                ${orders.reduce((sum, order) => sum + getOrderEffectiveTotal(order), 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{t.orders.latestOrder}</p>
              <p className="mt-3 text-3xl font-black">{formatDate(locale, orders[0].createdAt)}</p>
            </div>
          </section>
        )}

        {mode === 'local-fallback' && !needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.orders.fallbackNotice}
          </div>
        )}

        {needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.orders.needsLogin}
            <a href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.login}
            </a>
          </div>
        )}

        <section className="space-y-5">
          {loading && <p>{t.orders.loading}</p>}
          {!loading && !message && !needsLogin && orders.length === 0 && (
            <div className="rounded-[28px] bg-white p-6 text-[#5d6a61] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              {t.orders.empty}
            </div>
          )}
          {message && <p className="text-[#8b2d2d]">{message}</p>}
          {orders.map((order) => {
            const orderId = order._id ?? order.id ?? 'local-order'
            const shippingLabel = formatAddress(order.shippingAddress)
            const refundedAmount = getOrderRefundedAmount(order)
            const effectiveTotal = getOrderEffectiveTotal(order)
            const refundStatus = getOrderRefundStatus(order)
            const itemsWithRefunds = getRefundableOrderItems(order)

            return (
              <article key={orderId} className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                      {t.orders.orderPrefix} #{orderId.slice(-6)}
                    </p>
                    <p className="mt-1 text-sm text-[#5d6a61]">{formatDateTime(locale, order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#68806f]">{t.orders.status}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <OrderStatusBadge status={order.status} />
                      <ShippingStatusBadge status={order.shippingStatus} />
                      <RefundStatusBadge status={refundStatus} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] bg-[#faf7f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.contact}</p>
                    <p className="mt-3 text-sm font-semibold text-[#18261d]">{order.customerName || '-'}</p>
                    <p className="mt-2 text-sm text-[#5d6a61]">{order.contactEmail || '-'}</p>
                  </div>
                  <div className="rounded-[24px] bg-[#faf7f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.shipping}</p>
                    <p className="mt-3 text-sm leading-6 text-[#425247]">{shippingLabel || copy.noShipping}</p>
                  </div>
                  <div className="rounded-[24px] bg-[#faf7f1] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.payment}</p>
                    <p className="mt-3 text-sm font-semibold text-[#18261d]">
                      {order.paymentLast4 ? `•••• ${order.paymentLast4}` : copy.noPayment}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {itemsWithRefunds.map(({ item, itemIndex, refundedQuantity }) => (
                    <div key={`${orderId}-${itemIndex}`} className="flex items-center gap-4">
                      <Image
                        src={item.image}
                        alt={translateProductName(item.name, locale)}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{translateProductName(item.name, locale)}</p>
                        <p className="text-sm text-[#5d6a61]">
                          {t.orders.quantity} {item.quantity}
                        </p>
                        {refundedQuantity > 0 && (
                          <p className="text-sm text-[#8a5a14]">
                            {copy.refundable} {refundedQuantity}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-4 border-t border-black/5 pt-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.note}</p>
                    <p className="mt-2 text-sm leading-6 text-[#425247]">{order.note || copy.noNote}</p>
                    {refundedAmount > 0 && (
                      <p className="mt-3 text-sm font-semibold text-[#8a5a14]">
                        {copy.refunded} -${refundedAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Link
                      href={`/orders/${orderId}`}
                      className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                    >
                      {t.orders.viewDetails}
                    </Link>
                    <div className="mt-3 text-lg font-bold">
                      {copy.netTotal} ${effectiveTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
