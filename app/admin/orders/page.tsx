'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import RefundStatusBadge from '@/components/RefundStatusBadge'
import ShippingStatusBadge from '@/components/ShippingStatusBadge'
import { useLanguage } from '@/components/LanguageProvider'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import StoreHeader from '@/components/StoreHeader'
import { formatDateTime } from '@/lib/i18n'
import {
  canEditShippingAddress,
  getOrderEffectiveTotal,
  getOrderRefundStatus,
  getOrderRefundedAmount,
  getRefundableOrderItems,
  type OrderRefundSelection,
  type RefundRecord,
  type ShippingAddressFields,
} from '@/lib/order-utils'
import { translateProductName } from '@/lib/sample-products'

type AdminOrderItem = {
  productId?: string
  name: string
  quantity: number
  price: number
  image: string
}

type AdminOrder = {
  _id?: string
  id?: string
  totalPrice: number
  status: 'pending' | 'paid' | 'cancelled' | string
  createdAt: string
  customerName?: string
  contactEmail?: string
  shippingAddress?: ShippingAddressFields
  shippingStatus?: string
  note?: string
  paymentLast4?: string
  refunds?: RefundRecord[]
  items: AdminOrderItem[]
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

type ShippingForm = {
  recipient: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
}

const statusOptions = ['pending', 'paid', 'cancelled'] as const
const shippingStatusOptions = ['preparing', 'shipped'] as const

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

function createShippingForm(shippingAddress?: ShippingAddressFields): ShippingForm {
  return {
    recipient: shippingAddress?.recipient ?? '',
    line1: shippingAddress?.line1 ?? '',
    line2: shippingAddress?.line2 ?? '',
    city: shippingAddress?.city ?? '',
    postalCode: shippingAddress?.postalCode ?? '',
    country: shippingAddress?.country ?? '',
  }
}

export default function AdminOrdersPage() {
  const { locale, messages: t } = useLanguage()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [statusUpdatingId, setStatusUpdatingId] = useState('')
  const [shippingUpdatingId, setShippingUpdatingId] = useState('')
  const [editingShippingOrderId, setEditingShippingOrderId] = useState('')
  const [shippingForms, setShippingForms] = useState<Record<string, ShippingForm>>({})
  const [refundSubmittingId, setRefundSubmittingId] = useState('')
  const [refundSelections, setRefundSelections] = useState<Record<string, Record<number, string>>>({})
  const [refundReasons, setRefundReasons] = useState<Record<string, string>>({})

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
            totalLabel: '실결제',
            originalTotal: '원주문 금액',
            refundedTotal: '누적 환불',
            refundSection: '환불 처리',
            refundReason: '환불 사유',
            refundReasonPlaceholder: '선택 사항입니다. 환불 메모를 남길 수 있습니다.',
            refundQuantity: '환불 수량',
            refundable: '환불 가능',
            refundedQuantity: '환불 완료',
            refundAction: '선택 품목 환불',
            refunding: '환불 처리 중...',
            noRefundableItems: '더 이상 환불 가능한 수량이 없습니다.',
            refundHistory: '환불 이력',
            noRefundHistory: '환불 이력이 없습니다.',
            refundLocked: '전액 환불된 주문은 상태 변경을 잠시 막아두었습니다.',
            customerLabel: '고객',
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
            totalLabel: 'Net total',
            originalTotal: 'Original total',
            refundedTotal: 'Refunded',
            refundSection: 'Refund items',
            refundReason: 'Refund note',
            refundReasonPlaceholder: 'Optional. Add a short note for this refund.',
            refundQuantity: 'Refund quantity',
            refundable: 'Refundable',
            refundedQuantity: 'Refunded',
            refundAction: 'Refund selected items',
            refunding: 'Saving refund...',
            noRefundableItems: 'There are no refundable quantities left in this order.',
            refundHistory: 'Refund history',
            noRefundHistory: 'No refunds yet.',
            refundLocked: 'Fully refunded orders keep status changes disabled here.',
            customerLabel: 'Customer',
          },
    [locale]
  )

  const shippingCopy = useMemo(
    () =>
      locale === 'ko'
        ? {
            shippingActions: '배송 관리',
            shippingAddressEditor: '배송지 수정',
            shippingAddressHint: '배송 전 상태일 때만 배송지를 수정할 수 있습니다.',
            addressLocked: '이미 출발 처리된 주문은 배송지 수정이 잠깁니다.',
            preparing: '배송 전',
            shipped: '출발 완료',
            shippingUpdating: '배송 정보 저장 중...',
            editAddress: '배송지 수정',
            addAddress: '배송지 입력',
            saveAddress: '배송지 저장',
            cancelEdit: '닫기',
            recipient: '수령인',
            line1: '기본 주소',
            line2: '상세 주소',
            city: '도시',
            postalCode: '우편번호',
            country: '국가',
            selectRefundFirst: '환불할 품목 수량을 먼저 선택해 주세요.',
            refundSaveFailed: '환불 처리에 실패했습니다.',
            refundSaved: '환불이 저장되었습니다.',
          }
        : {
            shippingActions: 'Shipping controls',
            shippingAddressEditor: 'Shipping address',
            shippingAddressHint: 'You can edit the shipping address only before the parcel leaves.',
            addressLocked: 'Shipping address edits are locked after departure.',
            preparing: 'Preparing shipment',
            shipped: 'Shipped',
            shippingUpdating: 'Saving shipping details...',
            editAddress: 'Edit address',
            addAddress: 'Add address',
            saveAddress: 'Save address',
            cancelEdit: 'Close',
            recipient: 'Recipient',
            line1: 'Address line 1',
            line2: 'Address line 2',
            city: 'City',
            postalCode: 'Postal code',
            country: 'Country',
            selectRefundFirst: 'Select at least one item quantity to refund.',
            refundSaveFailed: 'Failed to save refund.',
            refundSaved: 'Refund saved.',
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

  const openShippingEditor = (orderId: string, shippingAddress?: ShippingAddressFields) => {
    setEditingShippingOrderId(orderId)
    setShippingForms((current) => ({
      ...current,
      [orderId]: createShippingForm(shippingAddress),
    }))
  }

  const handleShippingFormChange = (orderId: string, field: keyof ShippingForm, value: string) => {
    setShippingForms((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] ?? createShippingForm()),
        [field]: value,
      },
    }))
  }

  const handleShippingStatusChange = async (orderId: string, nextStatus: (typeof shippingStatusOptions)[number]) => {
    try {
      setShippingUpdatingId(orderId)
      setFeedback(null)

      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shippingStatus: nextStatus }),
      })
      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          text: data.message ?? t.adminOrders.loadFailed,
        })
        return
      }

      if (nextStatus === 'shipped') {
        setEditingShippingOrderId('')
      }

      await loadOrders()
      setFeedback({
        tone: 'success',
        text: data.message ?? 'Shipping status updated.',
      })
    } catch {
      setFeedback({
        tone: 'error',
        text: t.adminOrders.loadFailed,
      })
    } finally {
      setShippingUpdatingId('')
    }
  }

  const handleShippingAddressSave = async (orderId: string) => {
    const shippingAddress = shippingForms[orderId] ?? createShippingForm()

    try {
      setShippingUpdatingId(orderId)
      setFeedback(null)

      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shippingAddress }),
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
      setEditingShippingOrderId('')
      setFeedback({
        tone: 'success',
        text: data.message ?? 'Shipping address updated.',
      })
    } catch {
      setFeedback({
        tone: 'error',
        text: t.adminOrders.loadFailed,
      })
    } finally {
      setShippingUpdatingId('')
    }
  }

  const handleRefundQuantityChange = (orderId: string, itemIndex: number, value: string) => {
    if (!/^\d*$/.test(value)) {
      return
    }

    setRefundSelections((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] ?? {}),
        [itemIndex]: value,
      },
    }))
  }

  const handleRefund = async (order: AdminOrder) => {
    const orderId = order._id ?? order.id ?? ''

    if (!orderId) {
      return
    }

    const items: OrderRefundSelection[] = Object.entries(refundSelections[orderId] ?? {}).reduce<
      OrderRefundSelection[]
    >((result, [itemIndex, quantityValue]) => {
      const quantity = Number.parseInt(quantityValue, 10)

      if (quantity > 0) {
        result.push({
          itemIndex: Number(itemIndex),
          quantity,
        })
      }

      return result
    }, [])

    if (items.length === 0) {
      setFeedback({
        tone: 'error',
        text: shippingCopy.selectRefundFirst,
      })
      return
    }

    try {
      setRefundSubmittingId(orderId)
      setFeedback(null)

      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          reason: refundReasons[orderId] ?? '',
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          text: data.message ?? shippingCopy.refundSaveFailed,
        })
        return
      }

      await loadOrders()
      setRefundSelections((current) => ({
        ...current,
        [orderId]: {},
      }))
      setRefundReasons((current) => ({
        ...current,
        [orderId]: '',
      }))
      setFeedback({
        tone: 'success',
        text: data.message ?? shippingCopy.refundSaved,
      })
    } catch {
      setFeedback({
        tone: 'error',
        text: shippingCopy.refundSaveFailed,
      })
    } finally {
      setRefundSubmittingId('')
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
            <Link href="/auth?type=admin-login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.adminLogin}
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
                  ${orders.reduce((sum, order) => sum + getOrderEffectiveTotal(order), 0).toFixed(2)}
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
                  const refundStatus = getOrderRefundStatus(order)
                  const refundedAmount = getOrderRefundedAmount(order)
                  const effectiveTotal = getOrderEffectiveTotal(order)
                  const refundableItems = getRefundableOrderItems(order)
                  const hasRefundableItems = refundableItems.some((item) => item.remainingQuantity > 0)
                  const refundHistory = order.refunds ?? []
                  const shippingEditable = canEditShippingAddress(order)
                  const isEditingShipping = editingShippingOrderId === orderId
                  const shippingForm = shippingForms[orderId] ?? createShippingForm(order.shippingAddress)

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
                            {copy.customerLabel}: {customerLabel} ({contactEmail})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <OrderStatusBadge status={order.status} />
                            <ShippingStatusBadge status={order.shippingStatus} />
                            <RefundStatusBadge status={refundStatus} />
                          </div>
                          <p className="mt-3 text-lg font-bold">
                            {copy.totalLabel} ${effectiveTotal.toFixed(2)}
                          </p>
                          {refundedAmount > 0 && (
                            <p className="mt-1 text-sm font-semibold text-[#8a5a14]">
                              {copy.refundedTotal} -${refundedAmount.toFixed(2)}
                            </p>
                          )}
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
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                              {copy.shipping}
                            </p>
                            {shippingEditable ? (
                              <button
                                type="button"
                                onClick={() => openShippingEditor(orderId, order.shippingAddress)}
                                disabled={shippingUpdatingId === orderId}
                                className="text-sm font-semibold text-[#1d3124] underline underline-offset-4 disabled:opacity-40"
                              >
                                {shippingLabel ? shippingCopy.editAddress : shippingCopy.addAddress}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-[#8a5a14]">{shippingCopy.addressLocked}</span>
                            )}
                          </div>
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

                      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <div className="rounded-[24px] border border-black/5 bg-[#faf7f1] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                              {shippingCopy.shippingActions}
                            </p>
                            {shippingUpdatingId === orderId && (
                              <p className="text-sm font-semibold text-[#8a5a14]">{shippingCopy.shippingUpdating}</p>
                            )}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {shippingStatusOptions.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => void handleShippingStatusChange(orderId, status)}
                                disabled={shippingUpdatingId === orderId || order.shippingStatus === status}
                                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                  order.shippingStatus === status
                                    ? 'bg-[#1d3124] text-white'
                                    : 'border border-black/10 bg-white text-[#314338]'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {shippingCopy[status]}
                              </button>
                            ))}
                          </div>
                          {!shippingEditable && (
                            <p className="mt-3 text-sm text-[#8a5a14]">{shippingCopy.addressLocked}</p>
                          )}
                        </div>

                        <div className="rounded-[24px] border border-black/5 bg-[#faf7f1] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                                {shippingCopy.shippingAddressEditor}
                              </p>
                              <p className="mt-2 text-sm text-[#5d6a61]">{shippingCopy.shippingAddressHint}</p>
                            </div>
                            {isEditingShipping && (
                              <button
                                type="button"
                                onClick={() => setEditingShippingOrderId('')}
                                className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                              >
                                {shippingCopy.cancelEdit}
                              </button>
                            )}
                          </div>

                          {shippingEditable ? (
                            isEditingShipping ? (
                              <>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  <input
                                    value={shippingForm.recipient}
                                    onChange={(event) =>
                                      handleShippingFormChange(orderId, 'recipient', event.target.value)
                                    }
                                    placeholder={shippingCopy.recipient}
                                    disabled={shippingUpdatingId === orderId}
                                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50"
                                  />
                                  <input
                                    value={shippingForm.city}
                                    onChange={(event) => handleShippingFormChange(orderId, 'city', event.target.value)}
                                    placeholder={shippingCopy.city}
                                    disabled={shippingUpdatingId === orderId}
                                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50"
                                  />
                                  <input
                                    value={shippingForm.line1}
                                    onChange={(event) => handleShippingFormChange(orderId, 'line1', event.target.value)}
                                    placeholder={shippingCopy.line1}
                                    disabled={shippingUpdatingId === orderId}
                                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50 md:col-span-2"
                                  />
                                  <input
                                    value={shippingForm.line2}
                                    onChange={(event) => handleShippingFormChange(orderId, 'line2', event.target.value)}
                                    placeholder={shippingCopy.line2}
                                    disabled={shippingUpdatingId === orderId}
                                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50 md:col-span-2"
                                  />
                                  <input
                                    value={shippingForm.postalCode}
                                    onChange={(event) =>
                                      handleShippingFormChange(orderId, 'postalCode', event.target.value)
                                    }
                                    placeholder={shippingCopy.postalCode}
                                    disabled={shippingUpdatingId === orderId}
                                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50"
                                  />
                                  <input
                                    value={shippingForm.country}
                                    onChange={(event) =>
                                      handleShippingFormChange(orderId, 'country', event.target.value)
                                    }
                                    placeholder={shippingCopy.country}
                                    disabled={shippingUpdatingId === orderId}
                                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void handleShippingAddressSave(orderId)}
                                  disabled={shippingUpdatingId === orderId}
                                  className="mt-4 rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {shippingUpdatingId === orderId
                                    ? shippingCopy.shippingUpdating
                                    : shippingCopy.saveAddress}
                                </button>
                              </>
                            ) : (
                              <div className="mt-4 rounded-[20px] border border-black/5 bg-white p-4 text-sm text-[#5d6a61]">
                                {shippingCopy.shippingAddressHint}
                              </div>
                            )
                          ) : (
                            <p className="mt-4 text-sm text-[#8a5a14]">{shippingCopy.addressLocked}</p>
                          )}
                        </div>
                      </div>

                      {refundedAmount > 0 && (
                        <div className="mt-5 grid gap-4 rounded-[24px] border border-[#f0d9ba] bg-[#fff8ef] p-4 md:grid-cols-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a14]">
                              {copy.originalTotal}
                            </p>
                            <p className="mt-2 text-lg font-bold">${order.totalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a14]">
                              {copy.refundedTotal}
                            </p>
                            <p className="mt-2 text-lg font-bold text-[#8a5a14]">-${refundedAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a5a14]">
                              {copy.totalLabel}
                            </p>
                            <p className="mt-2 text-lg font-bold">${effectiveTotal.toFixed(2)}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 space-y-3">
                        {refundableItems.map(({ item, itemIndex, refundedQuantity, remainingQuantity }) => (
                          <div key={`${orderId}-${itemIndex}`} className="flex items-center gap-4">
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
                              <p className="text-sm text-[#8a5a14]">
                                {copy.refundable} {remainingQuantity}
                                {refundedQuantity > 0 ? ` · ${copy.refundedQuantity} ${refundedQuantity}` : ''}
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
                              disabled={
                                statusUpdatingId === orderId || order.status === status || refundStatus === 'full'
                              }
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
                        {refundStatus === 'full' && <p className="mt-3 text-sm text-[#8a5a14]">{copy.refundLocked}</p>}
                      </div>

                      <div className="mt-6 rounded-[24px] border border-black/5 bg-[#faf7f1] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.refundSection}
                          </p>
                          {refundSubmittingId === orderId && (
                            <p className="text-sm font-semibold text-[#8a5a14]">{copy.refunding}</p>
                          )}
                        </div>

                        {hasRefundableItems ? (
                          <>
                            <div className="mt-4 space-y-3">
                              {refundableItems.map(({ item, itemIndex, remainingQuantity }) => (
                                <label
                                  key={`${orderId}-refund-${itemIndex}`}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white px-4 py-3"
                                >
                                  <div>
                                    <p className="font-semibold">{translateProductName(item.name, locale)}</p>
                                    <p className="text-sm text-[#5d6a61]">
                                      {copy.refundable} {remainingQuantity}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-[#5d6a61]">{copy.refundQuantity}</span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={remainingQuantity}
                                      value={refundSelections[orderId]?.[itemIndex] ?? ''}
                                      onChange={(event) =>
                                        handleRefundQuantityChange(orderId, itemIndex, event.target.value)
                                      }
                                      disabled={refundSubmittingId === orderId || remainingQuantity === 0}
                                      className="w-24 rounded-2xl border border-black/10 bg-white px-4 py-2 outline-none disabled:opacity-50"
                                    />
                                  </div>
                                </label>
                              ))}
                            </div>
                            <label className="mt-4 block">
                              <span className="text-sm font-semibold text-[#314338]">{copy.refundReason}</span>
                              <textarea
                                value={refundReasons[orderId] ?? ''}
                                onChange={(event) =>
                                  setRefundReasons((current) => ({
                                    ...current,
                                    [orderId]: event.target.value,
                                  }))
                                }
                                rows={3}
                                disabled={refundSubmittingId === orderId}
                                placeholder={copy.refundReasonPlaceholder}
                                className="mt-2 w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 outline-none disabled:opacity-50"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => void handleRefund(order)}
                              disabled={refundSubmittingId === orderId}
                              className="mt-4 rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {refundSubmittingId === orderId ? copy.refunding : copy.refundAction}
                            </button>
                          </>
                        ) : (
                          <p className="mt-4 text-sm text-[#5d6a61]">{copy.noRefundableItems}</p>
                        )}

                        <div className="mt-6 border-t border-black/5 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.refundHistory}
                          </p>
                          {refundHistory.length === 0 ? (
                            <p className="mt-3 text-sm text-[#5d6a61]">{copy.noRefundHistory}</p>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {refundHistory.map((refund) => (
                                <div key={refund.id} className="rounded-[20px] border border-black/5 bg-white p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="font-semibold text-[#18261d]">-${refund.amount.toFixed(2)}</p>
                                    <p className="text-sm text-[#5d6a61]">
                                      {formatDateTime(
                                        locale,
                                        typeof refund.createdAt === 'string'
                                          ? refund.createdAt
                                          : refund.createdAt.toISOString()
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
