'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type ProductCardProps = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
}

export default function ProductCard({ id, name, description, price, image, category, stock }: ProductCardProps) {
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
        body: JSON.stringify({ productId: id, quantity: 1 }),
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
    <article className="group overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
      <Link href={`/products/${id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-[#e8dfd2]">
          <Image
            src={image}
            alt={name}
            width={900}
            height={675}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68736a]">{category}</p>
            <Link href={`/products/${id}`} className="mt-2 block text-xl font-bold text-[#18261d]">
              {name}
            </Link>
          </div>
          <p className="text-lg font-bold text-[#18261d]">${price}</p>
        </div>
        <p className="text-sm leading-6 text-[#4e5c52]">{description}</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isOutOfStock ? 'font-semibold text-[#8b2d2d]' : 'text-[#68736a]'}`}>
            {isOutOfStock ? 'Out of stock' : `${stock} in stock`}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/products/${id}`}
              className="rounded-full border border-[#1d3124] px-4 py-2 text-sm font-semibold text-[#1d3124]"
            >
              Details
            </Link>
            <button
              onClick={addToCart}
              disabled={loading || isOutOfStock}
              className="rounded-full bg-[#1d3124] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#294532] disabled:cursor-wait disabled:opacity-60"
            >
              {isOutOfStock ? 'Sold out' : loading ? 'Adding...' : 'Add to cart'}
            </button>
          </div>
        </div>
        {message && <p className={`text-sm ${isOutOfStock ? 'text-[#8b2d2d]' : 'text-[#2f6d43]'}`}>{message}</p>}
      </div>
    </article>
  )
}
