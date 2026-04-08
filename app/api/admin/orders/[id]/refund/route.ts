import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Order from '@/db/models/order'
import Product from '@/db/models/product'
import { findLocalOrderById, saveLocalOrder, updateLocalProductStock } from '@/lib/dev-store'
import { parseOptionalJsonBody } from '@/lib/json-body'
import { withLocalStoreLock } from '@/lib/local-store-lock'
import { buildRefundRecord, getNormalizedShippingStatus, type OrderRefundSelection } from '@/lib/order-utils'
import { getErrorMessage, logServerError } from '@/lib/server-error'
import { getAuthUser } from '@/lib/session'

type RefundOrderBody = {
  items?: OrderRefundSelection[]
  reason?: string
}

const FALLBACK_ORDER_LOOKUP = 'FALLBACK_ORDER_LOOKUP'

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

function shouldRestock(shippingStatus?: string) {
  return getNormalizedShippingStatus(shippingStatus) !== 'shipped'
}

function isKnownRefundError(message: string) {
  return (
    message === 'Order not found.' ||
    message === 'Cancelled orders cannot be refunded from this screen.' ||
    message === 'Select at least one item quantity to refund.' ||
    message === 'A selected item could not be found in this order.' ||
    message.startsWith('You can only refund up to ')
  )
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  const body = await parseOptionalJsonBody<RefundOrderBody>(request)
  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(FALLBACK_ORDER_LOOKUP)
    }

    await dbConnect()
    const session = await mongoose.startSession()
    let updatedOrder: unknown = null

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session)

        if (!order) {
          throw new Error('Order not found.')
        }

        if (order.status === 'cancelled') {
          throw new Error('Cancelled orders cannot be refunded from this screen.')
        }

        const nextRefund = buildRefundRecord(order.toObject(), body?.items ?? [], body?.reason)

        if (!nextRefund.refund) {
          throw new Error(nextRefund.message)
        }

        const persistedRefund = {
          ...nextRefund.refund,
          createdAt: new Date(nextRefund.refund.createdAt),
        }

        if (shouldRestock(order.shippingStatus)) {
          for (const item of persistedRefund.items) {
            const orderItem = order.items[item.itemIndex]

            if (!orderItem) {
              throw new Error('A selected item could not be found in this order.')
            }

            await Product.updateOne({ _id: orderItem.productId }, { $inc: { stock: item.quantity } }, { session })
          }
        }

        order.refunds = [...(order.refunds ?? []), persistedRefund]
        await order.save({ session })
        updatedOrder = order.toObject()
      })
    } finally {
      await session.endSession()
    }

    if (!updatedOrder) {
      throw new Error('Order not found.')
    }

    return NextResponse.json({ message: 'Refund saved.', order: updatedOrder }, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (isKnownRefundError(message)) {
      const status = message === 'Order not found.' ? 404 : 400
      return NextResponse.json({ message }, { status })
    }

    if (message !== FALLBACK_ORDER_LOOKUP && !isConnectionError(message)) {
      logServerError('admin-orders:refund', error)
      return NextResponse.json({ message: 'Failed to save refund.' }, { status: 500 })
    }

    return withLocalStoreLock(async () => {
      const order = await findLocalOrderById(id)

      if (!order) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
      }

      if (order.status === 'cancelled') {
        return NextResponse.json({ message: 'Cancelled orders cannot be refunded from this screen.' }, { status: 400 })
      }

      const nextRefund = buildRefundRecord(order, body?.items ?? [], body?.reason)

      if (!nextRefund.refund) {
        return NextResponse.json({ message: nextRefund.message }, { status: 400 })
      }

      if (shouldRestock(order.shippingStatus)) {
        for (const item of nextRefund.refund.items) {
          const orderItem = order.items[item.itemIndex]

          if (!orderItem) {
            return NextResponse.json({ message: 'A selected item could not be found in this order.' }, { status: 400 })
          }

          await updateLocalProductStock(orderItem.productId, item.quantity)
        }
      }

      order.refunds = [...(order.refunds ?? []), nextRefund.refund]
      const updatedOrder = await saveLocalOrder(order)

      if (!updatedOrder) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
      }

      return NextResponse.json(
        { message: 'Refund saved.', order: updatedOrder, mode: 'local-fallback' },
        { status: 200 }
      )
    })
  }
}
