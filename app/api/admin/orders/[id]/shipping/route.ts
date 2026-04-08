import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Order from '@/db/models/order'
import { findLocalOrderById, saveLocalOrder } from '@/lib/dev-store'
import { parseOptionalJsonBody } from '@/lib/json-body'
import { withLocalStoreLock } from '@/lib/local-store-lock'
import {
  canEditShippingAddress,
  isShippingStatus,
  normalizeShippingAddressInput,
  type ShippingAddressFields,
  type ShippingStatus,
} from '@/lib/order-utils'
import { getErrorMessage, logServerError } from '@/lib/server-error'
import { getAuthUser } from '@/lib/session'

type UpdateShippingBody = {
  shippingStatus?: ShippingStatus
  shippingAddress?: ShippingAddressFields
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

function getSuccessMessage(hasShippingStatus: boolean, hasShippingAddress: boolean) {
  if (hasShippingStatus && hasShippingAddress) {
    return 'Shipping details updated.'
  }

  if (hasShippingStatus) {
    return 'Shipping status updated.'
  }

  return 'Shipping address updated.'
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  const body = await parseOptionalJsonBody<UpdateShippingBody>(request)
  const hasShippingStatus = typeof body?.shippingStatus !== 'undefined'
  const hasShippingAddress = Boolean(body && 'shippingAddress' in body)

  if (!hasShippingStatus && !hasShippingAddress) {
    return NextResponse.json({ message: 'Shipping status or shipping address is required.' }, { status: 400 })
  }

  if (hasShippingStatus && !isShippingStatus(body?.shippingStatus)) {
    return NextResponse.json({ message: 'A valid shipping status is required.' }, { status: 400 })
  }

  const normalizedShippingAddress = hasShippingAddress ? normalizeShippingAddressInput(body?.shippingAddress) : null

  if (normalizedShippingAddress?.message) {
    return NextResponse.json({ message: normalizedShippingAddress.message }, { status: 400 })
  }

  if (hasShippingAddress && body?.shippingAddress && !normalizedShippingAddress?.data) {
    return NextResponse.json({ message: 'Shipping address cannot be empty.' }, { status: 400 })
  }

  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(FALLBACK_ORDER_LOOKUP)
    }

    await dbConnect()

    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    if (hasShippingAddress && !canEditShippingAddress(order.toObject())) {
      return NextResponse.json({ message: 'Shipping address can only be edited before departure.' }, { status: 400 })
    }

    if (hasShippingStatus && body?.shippingStatus) {
      order.shippingStatus = body.shippingStatus
    }

    if (hasShippingAddress) {
      order.shippingAddress = normalizedShippingAddress?.data ?? null
    }

    await order.save()

    return NextResponse.json(
      { message: getSuccessMessage(hasShippingStatus, hasShippingAddress), order: order.toObject() },
      { status: 200 }
    )
  } catch (error) {
    const message = getErrorMessage(error)

    if (message === 'Order not found.') {
      return NextResponse.json({ message }, { status: 404 })
    }

    if (message !== FALLBACK_ORDER_LOOKUP && !isConnectionError(message)) {
      logServerError('admin-orders:updateShipping', error)
      return NextResponse.json({ message: 'Failed to update shipping details.' }, { status: 500 })
    }

    return withLocalStoreLock(async () => {
      const order = await findLocalOrderById(id)

      if (!order) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
      }

      if (hasShippingAddress && !canEditShippingAddress(order)) {
        return NextResponse.json({ message: 'Shipping address can only be edited before departure.' }, { status: 400 })
      }

      if (hasShippingStatus && body?.shippingStatus) {
        order.shippingStatus = body.shippingStatus
      }

      if (hasShippingAddress) {
        order.shippingAddress = normalizedShippingAddress?.data ?? null
      }

      const updatedOrder = await saveLocalOrder(order)

      if (!updatedOrder) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
      }

      return NextResponse.json(
        {
          message: getSuccessMessage(hasShippingStatus, hasShippingAddress),
          order: updatedOrder,
          mode: 'local-fallback',
        },
        { status: 200 }
      )
    })
  }
}
