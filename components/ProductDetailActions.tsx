'use client'

import Link from 'next/link'
import { useState } from 'react'

type ProductDetailActionsProps = {
  productId: string
  stock: number
}

export default function ProductDetailActions({ productId, stock }: ProductDetailActionsProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const isOutOfStock = stock <= 0

  const addToCart = async () => {
    if (isOutOfStock) {
      setMessage('This item is currently out of stock.')
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
      setMessage(data.message ?? (response.ok ? 'Added to cart.' : 'Could not add to cart.'))
    } catch {
      setMessage('Request failed.')
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
          Open cart
        </Link>
        <button
          onClick={addToCart}
          disabled={loading || isOutOfStock}
          className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {isOutOfStock ? 'Sold out' : loading ? 'Adding...' : 'Add to cart'}
        </button>
      </div>
      {message && <p className={`text-sm ${isOutOfStock ? 'text-[#8b2d2d]' : 'text-[#2f6d43]'}`}>{message}</p>}
    </div>
  )
}
