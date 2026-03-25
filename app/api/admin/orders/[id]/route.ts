import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Order from '@/db/models/order'
import Product from '@/db/models/product'
import { findLocalOrderById, updateLocalOrderStatus, updateLocalProductStock } from '@/lib/dev-store'
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

    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    const currentStatus = order.status
    if (currentStatus === nextStatus) {
      return NextResponse.json({ message: 'Order status updated.', order }, { status: 200 })
    }

    if (!isActiveStatus(currentStatus) && isActiveStatus(nextStatus)) {
      const productIds = order.items.map((item) => item.productId)
      const products = await Product.find({ _id: { $in: productIds } }).lean()
      const productMap = new Map(products.map((product) => [product._id.toString(), product]))

      for (const item of order.items) {
        const product = productMap.get(item.productId.toString())

        if (!product) {
          return NextResponse.json({ message: 'A product in this order no longer exists.' }, { status: 400 })
        }

        if (product.stock < item.quantity) {
          return NextResponse.json({ message: `Not enough stock is available for ${item.name}.` }, { status: 400 })
        }
      }

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
      }
    }

    if (isActiveStatus(currentStatus) && !isActiveStatus(nextStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      }
    }

    order.status = nextStatus
    await order.save()

    return NextResponse.json({ message: 'Order status updated.', order }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown admin order update error'

    if (message !== FALLBACK_ORDER_LOOKUP && !isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to update order.', error: message }, { status: 500 })
    }

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
  }
}
