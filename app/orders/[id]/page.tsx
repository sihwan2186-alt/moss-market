'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import RefundStatusBadge from '@/components/RefundStatusBadge'
import ShippingStatusBadge from '@/components/ShippingStatusBadge'
import { useLanguage } from '@/components/LanguageProvider'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'
import { formatDateTime } from '@/lib/i18n'
import {
  getOrderEffectiveTotal,
  getOrderRefundStatus,
  getOrderRefundedAmount,
  getRefundableOrderItems,
  type RefundRecord,
  type ShippingAddressFields,
} from '@/lib/order-utils'
import { shouldBypassProductImageOptimization } from '@/lib/product-image-utils'
import { translateProductName } from '@/lib/sample-products'

type OrderItem = {
  productId?: string
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
  customerName?: string
  contactEmail?: string
  shippingAddress?: ShippingAddressFields
  shippingStatus?: string
  note?: string
  paymentLast4?: string
  refunds?: RefundRecord[]
  items: OrderItem[]
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const { locale, messages: t } = useLanguage()
  const orderId = params?.id ?? ''
  const [order, setOrder] = useState<Order | null>(null)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [message, setMessage] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [loading, setLoading] = useState(true)

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
            originalTotal: '원주문 금액',
            refundedTotal: '누적 환불',
            netTotal: '실결제 금액',
            refundHistory: '환불 이력',
            noRefundHistory: '환불 이력이 없습니다.',
            refundedQuantity: '환불 수량',
          }
        : {
            contact: 'Contact',
            shipping: 'Shipping',
            payment: 'Payment',
            note: 'Order note',
            noShipping: 'No shipping address provided.',
            noPayment: 'No test card captured.',
            noNote: 'No note provided.',
            originalTotal: 'Original total',
            refundedTotal: 'Refunded',
            netTotal: 'Net charged',
            refundHistory: 'Refund history',
            noRefundHistory: 'No refunds yet.',
            refundedQuantity: 'Refunded quantity',
          },
    [locale]
  )

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: 'no-store',
        })
        const data = await response.json()

        if (!response.ok) {
          setOrder(null)
          setNeedsLogin(response.status === 401)
          setMessage(data.message ?? t.orderDetail.loadFailed)
          return
        }

        setOrder(data.order ?? null)
        setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
        setNeedsLogin(false)
        setMessage('')
      } catch {
        setOrder(null)
        setMessage(t.orderDetail.loadFailed)
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [orderId, t.orderDetail.loadFailed])

  const displayOrderId = order?._id ?? order?.id ?? orderId
  const shippingLabel = formatAddress(order?.shippingAddress)
  const refundedAmount = order ? getOrderRefundedAmount(order) : 0
  const effectiveTotal = order ? getOrderEffectiveTotal(order) : 0
  const refundStatus = order ? getOrderRefundStatus(order) : 'none'
  const itemsWithRefunds = order ? getRefundableOrderItems(order) : []

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/orders" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          {t.orderDetail.backToOrders}
        </Link>

        {loading && <p className="mt-8 text-[#5d6a61]">{t.orderDetail.loading}</p>}

        {!loading && needsLogin && (
          <div className="mt-8 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.orderDetail.needsLogin}
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.login}
            </Link>
          </div>
        )}

        {!loading && !needsLogin && !order && (
          <div className="mt-8 rounded-[28px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h1 className="text-3xl font-black">{t.orderDetail.notFoundTitle}</h1>
            <p className="mt-4 text-[#5d6a61]">{message || t.orderDetail.notFoundDescription}</p>
          </div>
        )}

        {!loading && order && (
          <>
            {mode === 'local-fallback' && (
              <div className="mt-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
                {t.orderDetail.fallbackNotice}
              </div>
            )}

            <section className="mt-8 rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/5 pb-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                    {t.orderDetail.orderReference}
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight">#{displayOrderId.slice(-8)}</h1>
                  <p className="mt-3 text-sm text-[#5d6a61]">{formatDateTime(locale, order.createdAt)}</p>
                </div>
                <div className="rounded-[24px] bg-[#f7f1e8] px-5 py-4 text-right">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#68806f]">{t.orderDetail.status}</p>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <OrderStatusBadge status={order.status} />
                    <ShippingStatusBadge status={order.shippingStatus} />
                    <RefundStatusBadge status={refundStatus} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                    {t.orderDetail.items}
                  </p>
                  <p className="mt-3 text-3xl font-black">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.payment}</p>
                  <p className="mt-3 text-3xl font-black">{order.paymentLast4 ? `**** ${order.paymentLast4}` : '-'}</p>
                </div>
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.netTotal}</p>
                  <p className="mt-3 text-3xl font-black">${effectiveTotal.toFixed(2)}</p>
                </div>
              </div>

              {refundedAmount > 0 && (
                <div className="mt-6 grid gap-4 rounded-[24px] border border-[#f0d9ba] bg-[#fff8ef] p-5 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a14]">
                      {copy.originalTotal}
                    </p>
                    <p className="mt-2 text-2xl font-black">${order.totalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a14]">
                      {copy.refundedTotal}
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#8a5a14]">-${refundedAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a14]">{copy.netTotal}</p>
                    <p className="mt-2 text-2xl font-black">${effectiveTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.contact}</p>
                  <p className="mt-3 text-sm font-semibold text-[#18261d]">{order.customerName || '-'}</p>
                  <p className="mt-2 text-sm text-[#5d6a61]">{order.contactEmail || '-'}</p>
                </div>
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.shipping}</p>
                  <p className="mt-3 text-sm leading-6 text-[#425247]">{shippingLabel || copy.noShipping}</p>
                </div>
                <div className="rounded-[24px] bg-[#faf7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.note}</p>
                  <p className="mt-3 text-sm leading-6 text-[#425247]">{order.note || copy.noNote}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {itemsWithRefunds.map(({ item, itemIndex, refundedQuantity }) => (
                  <article
                    key={`${displayOrderId}-${itemIndex}`}
                    className="flex gap-4 rounded-[24px] bg-[#faf7f1] p-4"
                  >
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
                      <p className="mt-2 text-sm text-[#5d6a61]">
                        {t.orderDetail.quantity} {item.quantity}
                      </p>
                      <p className="mt-2 text-sm text-[#5d6a61]">
                        ${item.price} {t.orderDetail.each}
                      </p>
                      {refundedQuantity > 0 && (
                        <p className="mt-2 text-sm font-semibold text-[#8a5a14]">
                          {copy.refundedQuantity} {refundedQuantity}
                        </p>
                      )}
                    </div>
                    <p className="self-center text-lg font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-black/5 bg-[#faf7f1] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">{copy.refundHistory}</p>
                {(order.refunds ?? []).length === 0 ? (
                  <p className="mt-3 text-sm text-[#5d6a61]">{copy.noRefundHistory}</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {(order.refunds ?? []).map((refund) => (
                      <div key={refund.id} className="rounded-[20px] border border-black/5 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-[#18261d]">-${refund.amount.toFixed(2)}</p>
                          <p className="text-sm text-[#5d6a61]">
                            {formatDateTime(
                              locale,
                              typeof refund.createdAt === 'string' ? refund.createdAt : refund.createdAt.toISOString()
                            )}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-[#425247]">
                          {refund.items
                            .map((item) => `${translateProductName(item.name, locale)} x${item.quantity}`)
                            .join(', ')}
                        </p>
                        {refund.reason && <p className="mt-2 text-sm text-[#5d6a61]">{refund.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end border-t border-black/5 pt-6">
                <div className="rounded-[24px] bg-[#203126] px-6 py-4 text-right text-white">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#b8c9bc]">{copy.netTotal}</p>
                  <p className="mt-2 text-2xl font-black">${effectiveTotal.toFixed(2)}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
