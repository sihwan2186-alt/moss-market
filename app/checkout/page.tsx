'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import StoreHeader from '@/components/StoreHeader'
import { dispatchCartUpdated } from '@/lib/cart-events'
import { translateProductName } from '@/lib/sample-products'

type CartItem = {
  productId: string
  quantity: number
  name: string
  image: string
  price: number
  subtotal: number
}

type SessionResponse = {
  user?: {
    name?: string
    email?: string
  } | null
}

type Feedback = {
  tone: 'error' | 'success'
  text: string
}

export default function CheckoutPage() {
  const { locale, messages: t } = useLanguage()
  const [items, setItems] = useState<CartItem[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [mode, setMode] = useState<'database' | 'local-fallback'>('database')
  const [lastOrderId, setLastOrderId] = useState('')
  const [paymentName, setPaymentName] = useState('Test User')
  const [paymentNumber, setPaymentNumber] = useState('4242 4242 4242 4242')
  const [paymentExpiry, setPaymentExpiry] = useState('12/30')
  const [paymentCvc, setPaymentCvc] = useState('123')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [shippingRecipient, setShippingRecipient] = useState('')
  const [shippingLine1, setShippingLine1] = useState('')
  const [shippingLine2, setShippingLine2] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingPostalCode, setShippingPostalCode] = useState('')
  const [shippingCountry, setShippingCountry] = useState('')
  const [orderNote, setOrderNote] = useState('')

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            contactTitle: '연락처',
            contactName: '주문자 이름',
            contactEmail: '연락 이메일',
            shippingTitle: '배송지',
            recipient: '수령인 이름',
            line1: '주소 1',
            line2: '주소 2',
            city: '도시',
            postalCode: '우편번호',
            country: '국가',
            noteTitle: '주문 메모',
            notePlaceholder: '배송 요청사항이나 주문 메모를 남겨보세요.',
            fillOrderDetails: '연락처와 배송지 정보를 먼저 입력해 주세요.',
          }
        : {
            contactTitle: 'Contact',
            contactName: 'Contact name',
            contactEmail: 'Contact email',
            shippingTitle: 'Shipping address',
            recipient: 'Recipient',
            line1: 'Address line 1',
            line2: 'Address line 2',
            city: 'City',
            postalCode: 'Postal code',
            country: 'Country',
            noteTitle: 'Order note',
            notePlaceholder: 'Add delivery instructions or a short order note.',
            fillOrderDetails: 'Please complete the contact and shipping details first.',
          },
    [locale]
  )

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items])

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true)

        const [cartResponse, sessionResponse] = await Promise.all([
          fetch('/api/cart', { cache: 'no-store' }),
          fetch('/api/session', { cache: 'no-store' }),
        ])

        const cartData = await cartResponse.json()
        const sessionData = sessionResponse.ok ? ((await sessionResponse.json()) as SessionResponse) : {}
        const sessionUser = sessionData.user ?? null

        if (!cartResponse.ok) {
          setFeedback({
            tone: 'error',
            text: cartData.message ?? t.checkout.loadFailed,
          })
          setItems([])
          setNeedsLogin(cartResponse.status === 401)
          return
        }

        setItems(cartData.items ?? [])
        setNeedsLogin(false)
        setMode(cartData.mode === 'local-fallback' ? 'local-fallback' : 'database')
        setContactName((currentValue) => currentValue || sessionUser?.name || '')
        setContactEmail((currentValue) => currentValue || sessionUser?.email || '')
        setShippingRecipient((currentValue) => currentValue || sessionUser?.name || '')
        setFeedback(null)
      } catch {
        setFeedback({
          tone: 'error',
          text: t.checkout.loadFailed,
        })
      } finally {
        setLoading(false)
      }
    }

    void loadPage()
  }, [t.checkout.loadFailed])

  const handleCheckout = async () => {
    if (!paymentName || !paymentNumber || !paymentExpiry || !paymentCvc) {
      setFeedback({
        tone: 'error',
        text: t.checkout.fillPaymentForm,
      })
      return
    }

    if (
      !contactName ||
      !contactEmail ||
      !shippingRecipient ||
      !shippingLine1 ||
      !shippingCity ||
      !shippingPostalCode ||
      !shippingCountry
    ) {
      setFeedback({
        tone: 'error',
        text: copy.fillOrderDetails,
      })
      return
    }

    try {
      setOrdering(true)
      setFeedback(null)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: contactName,
          contactEmail,
          shippingAddress: {
            recipient: shippingRecipient,
            line1: shippingLine1,
            line2: shippingLine2,
            city: shippingCity,
            postalCode: shippingPostalCode,
            country: shippingCountry,
          },
          note: orderNote,
          paymentCardNumber: paymentNumber,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          tone: 'error',
          text: data.message ?? t.checkout.checkoutFailed,
        })
        return
      }

      setLastOrderId(data.orderId ?? '')
      setMode(data.mode === 'local-fallback' ? 'local-fallback' : 'database')
      setItems([])
      setFeedback(null)
      dispatchCartUpdated()
    } catch {
      setFeedback({
        tone: 'error',
        text: t.checkout.checkoutFailed,
      })
    } finally {
      setOrdering(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.checkout.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{t.checkout.title}</h1>
          </div>
          <Link href="/cart" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
            {t.checkout.backToCart}
          </Link>
        </div>

        {mode === 'local-fallback' && !needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.checkout.fallbackNotice}
          </div>
        )}

        {needsLogin && (
          <div className="mb-6 rounded-[24px] border border-[#d6c5ae] bg-[#fff5e7] p-5 text-sm text-[#6d5641]">
            {t.checkout.needsLogin}
            <Link href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.login}
            </Link>
          </div>
        )}

        {lastOrderId && (
          <div className="mb-6 rounded-[24px] border border-[#c9dfcb] bg-[#edf8ee] p-5 text-sm text-[#2f5b39]">
            {t.checkout.success}
            <span className="ml-2 font-semibold">
              {t.checkout.reference}: {lastOrderId}
            </span>
            <Link href="/orders" className="ml-3 font-semibold underline underline-offset-4">
              {t.checkout.viewHistory}
            </Link>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-8 rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <div>
              <h2 className="text-2xl font-bold">{t.checkout.orderItems}</h2>
              <div className="mt-5 space-y-4">
                {loading && <p>{t.checkout.loading}</p>}
                {!loading && !needsLogin && items.length === 0 && <p className="text-[#5d6a61]">{t.checkout.empty}</p>}
                {items.map((item) => (
                  <article key={item.productId} className="flex gap-4 rounded-[24px] bg-[#faf7f1] p-4">
                    <Image
                      src={item.image}
                      alt={translateProductName(item.name, locale)}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold">{translateProductName(item.name, locale)}</h3>
                      <p className="mt-2 text-sm text-[#5d6a61]">
                        {t.checkout.quantity} {item.quantity}
                      </p>
                      <p className="mt-2 text-sm text-[#5d6a61]">
                        ${item.price} {t.checkout.each}
                      </p>
                    </div>
                    <p className="self-center font-semibold">${item.subtotal.toFixed(2)}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] bg-[#faf7f1] p-5">
                <h2 className="text-lg font-bold">{copy.contactTitle}</h2>
                <div className="mt-4 space-y-3">
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder={copy.contactName}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                  <input
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder={copy.contactEmail}
                    type="email"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div className="rounded-[24px] bg-[#faf7f1] p-5">
                <h2 className="text-lg font-bold">{copy.shippingTitle}</h2>
                <div className="mt-4 grid gap-3">
                  <input
                    value={shippingRecipient}
                    onChange={(event) => setShippingRecipient(event.target.value)}
                    placeholder={copy.recipient}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                  <input
                    value={shippingLine1}
                    onChange={(event) => setShippingLine1(event.target.value)}
                    placeholder={copy.line1}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                  <input
                    value={shippingLine2}
                    onChange={(event) => setShippingLine2(event.target.value)}
                    placeholder={copy.line2}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={shippingCity}
                      onChange={(event) => setShippingCity(event.target.value)}
                      placeholder={copy.city}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                    />
                    <input
                      value={shippingPostalCode}
                      onChange={(event) => setShippingPostalCode(event.target.value)}
                      placeholder={copy.postalCode}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                    />
                  </div>
                  <input
                    value={shippingCountry}
                    onChange={(event) => setShippingCountry(event.target.value)}
                    placeholder={copy.country}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] bg-[#faf7f1] p-5">
              <h2 className="text-lg font-bold">{copy.noteTitle}</h2>
              <textarea
                value={orderNote}
                onChange={(event) => setOrderNote(event.target.value)}
                placeholder={copy.notePlaceholder}
                className="mt-4 min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
              />
            </div>
          </section>

          <aside className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h2 className="text-2xl font-bold">{t.checkout.payment}</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.checkout.cardholder}</span>
                <input
                  value={paymentName}
                  onChange={(event) => setPaymentName(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.checkout.cardNumber}</span>
                <input
                  value={paymentNumber}
                  onChange={(event) => setPaymentNumber(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.checkout.expiry}</span>
                  <input
                    value={paymentExpiry}
                    onChange={(event) => setPaymentExpiry(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#314338]">{t.checkout.cvc}</span>
                  <input
                    value={paymentCvc}
                    onChange={(event) => setPaymentCvc(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f9f7f2] px-4 py-3 outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#203126] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-[#b8c9bc]">{t.checkout.total}</p>
              <p className="mt-3 text-3xl font-black">${totalPrice.toFixed(2)}</p>
              <p className="mt-3 text-sm text-[#d9e5dc]">{t.checkout.demoNote}</p>
            </div>

            <button
              onClick={() => void handleCheckout()}
              disabled={ordering || items.length === 0 || needsLogin}
              className="mt-6 w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ordering ? t.checkout.processingPurchase : t.checkout.completePurchase}
            </button>

            {feedback && (
              <p className={`mt-4 text-sm ${feedback.tone === 'error' ? 'text-[#8b2d2d]' : 'text-[#2f6d43]'}`}>
                {feedback.text}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
