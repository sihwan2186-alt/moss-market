'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CART_UPDATED_EVENT } from '@/lib/cart-events'

type CartContextValue = {
  cartCount: number
  refreshCartCount: () => Promise<void>
}

type CartResponseItem = {
  quantity?: number
}

const CartContext = createContext<CartContextValue | null>(null)

type CartProviderProps = {
  children: React.ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartCount, setCartCount] = useState(0)

  const refreshCartCount = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', { cache: 'no-store' })

      if (!response.ok) {
        setCartCount(0)
        return
      }

      const data = await response.json()
      const items: CartResponseItem[] = Array.isArray(data.items) ? data.items : []
      const nextCount = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
      setCartCount(nextCount)
    } catch {
      setCartCount(0)
    }
  }, [])

  useEffect(() => {
    void refreshCartCount()

    const handleCartUpdated = () => {
      void refreshCartCount()
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    }
  }, [refreshCartCount])

  return <CartContext.Provider value={{ cartCount, refreshCartCount }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider.')
  }

  return context
}
