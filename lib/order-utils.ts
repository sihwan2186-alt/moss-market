export type ShippingAddressFields = {
  recipient?: string
  line1?: string
  line2?: string
  city?: string
  postalCode?: string
  country?: string
} | null

export type RefundRecordItem = {
  itemIndex: number
  productId?: string
  name: string
  quantity: number
  amount: number
}

export type RefundRecord = {
  id: string
  amount: number
  reason: string
  createdAt: string | Date
  items: RefundRecordItem[]
}

export type OrderRefundSelection = {
  itemIndex: number
  quantity: number
}

export type ShippingStatus = 'preparing' | 'shipped'
export type RefundStatus = 'none' | 'partial' | 'full'

type BaseOrderItem<ItemProductId = unknown> = {
  productId?: ItemProductId
  name: string
  price: number
  quantity: number
}

type OrderLike<TItem extends BaseOrderItem = BaseOrderItem> = {
  totalPrice: number
  shippingStatus?: string
  shippingAddress?: ShippingAddressFields
  items: TItem[]
  refunds?: RefundRecord[]
}

const SHIPPING_STATUS_VALUES: ShippingStatus[] = ['preparing', 'shipped']

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function getRecordProductId(productId: unknown) {
  if (typeof productId === 'string' && productId.trim().length > 0) {
    return productId
  }

  if (
    productId &&
    typeof productId === 'object' &&
    'toString' in productId &&
    typeof productId.toString === 'function'
  ) {
    const value = productId.toString()

    if (value && value !== '[object Object]') {
      return value
    }
  }

  return undefined
}

export function isShippingStatus(value?: string): value is ShippingStatus {
  return SHIPPING_STATUS_VALUES.includes(value as ShippingStatus)
}

export function getNormalizedShippingStatus(status?: string): ShippingStatus {
  return isShippingStatus(status) ? status : 'preparing'
}

export function canEditShippingAddress(order: Pick<OrderLike, 'shippingStatus'>) {
  return getNormalizedShippingStatus(order.shippingStatus) !== 'shipped'
}

export function normalizeShippingAddressInput(input?: ShippingAddressFields) {
  if (!input) {
    return {
      data: null,
    } as const
  }

  const shippingAddress = {
    recipient: input.recipient?.trim() ?? '',
    line1: input.line1?.trim() ?? '',
    line2: input.line2?.trim() ?? '',
    city: input.city?.trim() ?? '',
    postalCode: input.postalCode?.trim() ?? '',
    country: input.country?.trim() ?? '',
  }

  const hasAnyValue = Object.values(shippingAddress).some((value) => value.length > 0)

  if (!hasAnyValue) {
    return {
      data: null,
    } as const
  }

  if (
    !shippingAddress.recipient ||
    !shippingAddress.line1 ||
    !shippingAddress.city ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    return {
      message: 'Recipient, address, city, postal code, and country are required.',
    } as const
  }

  return {
    data: shippingAddress,
  } as const
}

export function getOrderRefundedQuantities(order: Pick<OrderLike, 'items' | 'refunds'>) {
  const refundedQuantities = order.items.map(() => 0)

  for (const refund of order.refunds ?? []) {
    for (const refundItem of refund.items ?? []) {
      const itemIndex = Math.trunc(refundItem.itemIndex)
      const orderItem = order.items[itemIndex]

      if (!orderItem) {
        continue
      }

      const quantity = Math.max(0, Math.trunc(refundItem.quantity))
      refundedQuantities[itemIndex] = Math.min(orderItem.quantity, refundedQuantities[itemIndex] + quantity)
    }
  }

  return refundedQuantities
}

export function getOrderRemainingQuantities(order: Pick<OrderLike, 'items' | 'refunds'>) {
  const refundedQuantities = getOrderRefundedQuantities(order)

  return order.items.map((item, index) => Math.max(0, item.quantity - refundedQuantities[index]))
}

export function getOrderOutstandingStockItems<TItem extends BaseOrderItem>(
  order: Pick<OrderLike<TItem>, 'items' | 'refunds'>
) {
  const remainingQuantities = getOrderRemainingQuantities(order)

  return order.items
    .map((item, index) => ({
      itemIndex: index,
      productId: item.productId,
      name: item.name,
      quantity: remainingQuantities[index],
    }))
    .filter((item) => item.quantity > 0)
}

export function getOrderRefundedAmount(order: Pick<OrderLike, 'refunds'>) {
  return roundCurrency((order.refunds ?? []).reduce((sum, refund) => sum + Math.max(0, Number(refund.amount) || 0), 0))
}

export function getOrderEffectiveTotal(order: Pick<OrderLike, 'totalPrice' | 'refunds'>) {
  return roundCurrency(Math.max(0, order.totalPrice - getOrderRefundedAmount(order)))
}

export function getOrderRefundStatus(order: Pick<OrderLike, 'items' | 'refunds'>): RefundStatus {
  const refundedAmount = getOrderRefundedAmount(order)

  if (refundedAmount <= 0) {
    return 'none'
  }

  return getOrderRemainingQuantities(order).every((quantity) => quantity === 0) ? 'full' : 'partial'
}

export function getRefundableOrderItems<TItem extends BaseOrderItem>(
  order: Pick<OrderLike<TItem>, 'items' | 'refunds'>
) {
  const refundedQuantities = getOrderRefundedQuantities(order)
  const remainingQuantities = getOrderRemainingQuantities(order)

  return order.items.map((item, index) => ({
    itemIndex: index,
    item,
    refundedQuantity: refundedQuantities[index],
    remainingQuantity: remainingQuantities[index],
    lineTotal: roundCurrency(item.price * item.quantity),
  }))
}

export function buildRefundRecord<TItem extends BaseOrderItem>(
  order: Pick<OrderLike<TItem>, 'items' | 'refunds'>,
  selections: OrderRefundSelection[],
  reason?: string
) {
  const refundableItems = getRefundableOrderItems(order)
  const normalizedSelections = new Map<number, number>()

  for (const selection of selections) {
    const itemIndex = Math.trunc(selection.itemIndex)
    const quantity = Math.trunc(selection.quantity)

    if (!Number.isInteger(itemIndex) || !Number.isInteger(quantity) || quantity <= 0) {
      continue
    }

    normalizedSelections.set(itemIndex, (normalizedSelections.get(itemIndex) ?? 0) + quantity)
  }

  if (normalizedSelections.size === 0) {
    return {
      message: 'Select at least one item quantity to refund.',
    } as const
  }

  const refundItems: RefundRecordItem[] = []
  let amount = 0

  for (const [itemIndex, quantity] of normalizedSelections) {
    const refundableItem = refundableItems.find((item) => item.itemIndex === itemIndex)

    if (!refundableItem) {
      return {
        message: 'A selected item could not be found in this order.',
      } as const
    }

    if (quantity > refundableItem.remainingQuantity) {
      return {
        message: `You can only refund up to ${refundableItem.remainingQuantity} unit(s) for ${refundableItem.item.name}.`,
      } as const
    }

    const lineAmount = roundCurrency(refundableItem.item.price * quantity)
    amount += lineAmount
    refundItems.push({
      itemIndex,
      productId: getRecordProductId(refundableItem.item.productId),
      name: refundableItem.item.name,
      quantity,
      amount: lineAmount,
    })
  }

  return {
    refund: {
      id: globalThis.crypto.randomUUID(),
      amount: roundCurrency(amount),
      reason: reason?.trim() ?? '',
      createdAt: new Date().toISOString(),
      items: refundItems,
    } satisfies RefundRecord,
  } as const
}
