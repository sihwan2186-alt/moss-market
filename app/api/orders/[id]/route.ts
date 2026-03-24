import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import Order from '@/db/models/order'
import dbConnect from '@/db/dbConnect'
import { getLocalOrderById } from '@/lib/dev-store'
import { getAuthUser } from '@/lib/session'

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('FALLBACK_ORDER_LOOKUP')
    }

    await dbConnect()
    const order = await Order.findOne({ _id: id, userId: authUser.userId }).lean()

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown order detail error'

    if (message !== 'FALLBACK_ORDER_LOOKUP' && !isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to load order.', error: message }, { status: 500 })
    }

    const order = await getLocalOrderById(authUser.userId, id)

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    return NextResponse.json({ order, mode: 'local-fallback' }, { status: 200 })
  }
}
