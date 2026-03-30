import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Order from '@/db/models/order'
import Product from '@/db/models/product'
import { findLocalOrderById, updateLocalOrderStatus, updateLocalProductStock } from '@/lib/dev-store'
import { withLocalStoreLock } from '@/lib/local-store-lock'
import { getErrorMessage, logServerError } from '@/lib/server-error'
import { getAuthUser } from '@/lib/session'

type UpdateOrderBody = {
  status?: 'pending' | 'paid' | 'cancelled'
}

const FALLBACK_ORDER_LOOKUP = 'FALLBACK_ORDER_LOOKUP'
const ACTIVE_ORDER_STATUSES = new Set(['pending', 'paid'])

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

function isValidStatus(status?: string): status is NonNullable<UpdateOrderBody['status']> {
  return status === 'pending' || status === 'paid' || status === 'cancelled'
}

function isActiveStatus(status: string) {
  return ACTIVE_ORDER_STATUSES.has(status)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json()) as UpdateOrderBody

  if (!isValidStatus(body.status)) {
    return NextResponse.json({ message: 'A valid order status is required.' }, { status: 400 })
  }

  const nextStatus: NonNullable<UpdateOrderBody['status']> = body.status

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

        const currentStatus = order.status
        if (currentStatus === nextStatus) {
          updatedOrder = order.toObject()
          return
        }

        if (!isActiveStatus(currentStatus) && isActiveStatus(nextStatus)) {
          const productIds = order.items.map((item) => item.productId)
          const products = await Product.find({ _id: { $in: productIds } })
            .session(session)
            .lean()
          const productMap = new Map(products.map((product) => [product._id.toString(), product]))

          for (const item of order.items) {
            const product = productMap.get(item.productId.toString())

            if (!product) {
              throw new Error('A product in this order no longer exists.')
            }

            if (product.stock < item.quantity) {
              throw new Error(`Not enough stock is available for ${item.name}.`)
            }
          }

          for (const item of order.items) {
            const result = await Product.updateOne(
              { _id: item.productId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { session }
            )

            if (result.modifiedCount !== 1) {
              throw new Error(`Not enough stock is available for ${item.name}.`)
            }
          }
        }

        if (isActiveStatus(currentStatus) && !isActiveStatus(nextStatus)) {
          for (const item of order.items) {
            await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session })
          }
        }

        order.status = nextStatus
        await order.save({ session })
        updatedOrder = order.toObject()
      })
    } finally {
      await session.endSession()
    }

    if (!updatedOrder) {
      throw new Error('Order not found.')
    }

    return NextResponse.json({ message: 'Order status updated.', order: updatedOrder }, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (message === 'Order not found.') {
      return NextResponse.json({ message }, { status: 404 })
    }

    if (
      message === 'A product in this order no longer exists.' ||
      message.startsWith('Not enough stock is available for ')
    ) {
      return NextResponse.json({ message }, { status: 400 })
    }

    if (message !== FALLBACK_ORDER_LOOKUP && !isConnectionError(message)) {
      logServerError('admin-orders:updateStatus', error)
      return NextResponse.json({ message: 'Failed to update order.' }, { status: 500 })
    }

    return withLocalStoreLock(async () => {
      const order = await findLocalOrderById(id)

      if (!order) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
      }

      const currentStatus = order.status
      if (!isActiveStatus(currentStatus) && isActiveStatus(nextStatus)) {
        for (const item of order.items) {
          const updatedProduct = await updateLocalProductStock(item.productId, 0)

          if (!updatedProduct) {
            return NextResponse.json({ message: 'A product in this order no longer exists.' }, { status: 400 })
          }

          if (updatedProduct.stock < item.quantity) {
            return NextResponse.json({ message: `Not enough stock is available for ${item.name}.` }, { status: 400 })
          }
        }

        for (const item of order.items) {
          await updateLocalProductStock(item.productId, -item.quantity)
        }
      }

      if (isActiveStatus(currentStatus) && !isActiveStatus(nextStatus)) {
        for (const item of order.items) {
          await updateLocalProductStock(item.productId, item.quantity)
        }
      }

      const updatedOrder = await updateLocalOrderStatus(id, nextStatus)

      if (!updatedOrder) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
      }

      return NextResponse.json(
        { message: 'Order status updated.', order: updatedOrder, mode: 'local-fallback' },
        { status: 200 }
      )
    })
  }
}
