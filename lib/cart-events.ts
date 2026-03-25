export const CART_UPDATED_EVENT = 'moss-market:cart-updated'

export function dispatchCartUpdated() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}
