'use client'

import Link from 'next/link'
import { useState } from 'react'
import RestockAlertForm from '@/components/RestockAlertForm'
import { useLanguage } from '@/components/LanguageProvider'
import { dispatchCartUpdated } from '@/lib/cart-events'

type ProductDetailActionsProps = {
  productId: string
  stock: number
}

export default function ProductDetailActions({ productId, stock }: ProductDetailActionsProps) {
  const { messages: t } = useLanguage()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const isOutOfStock = stock <= 0

  const addToCart = async () => {
    if (isOutOfStock) {
      setMessage(t.productDetailActions.outOfStock)
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      const data = await response.json()
      if (response.ok) {
        dispatchCartUpdated()
        setMessage(t.productDetailActions.addedToCart)
        return
      }

      setMessage(data.message ?? t.productDetailActions.addFailed)
    } catch {
      setMessage(t.productDetailActions.requestFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cart"
          className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
        >
          {t.productDetailActions.openCart}
        </Link>
        <button
          onClick={addToCart}
          disabled={loading || isOutOfStock}
          className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {isOutOfStock
            ? t.productDetailActions.soldOut
            : loading
              ? t.productDetailActions.adding
              : t.productDetailActions.addToCart}
        </button>
      </div>
      {isOutOfStock && <RestockAlertForm productId={productId} />}
      {message && <p className={`text-sm ${isOutOfStock ? 'text-[#8b2d2d]' : 'text-[#2f6d43]'}`}>{message}</p>}
    </div>
  )
}
