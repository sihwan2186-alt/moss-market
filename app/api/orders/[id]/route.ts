import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import Order from '@/db/models/order'
import dbConnect from '@/db/dbConnect'
import { isDatabaseUnavailableError } from '@/lib/database-error'
import { getLocalOrderById } from '@/lib/dev-store'
import { getErrorMessage, logServerError } from '@/lib/server-error'
import { getAuthUser } from '@/lib/session'

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
    const message = getErrorMessage(error)

    if (message !== 'FALLBACK_ORDER_LOOKUP' && !isDatabaseUnavailableError(error)) {
      logServerError('orders:getById', error)
      return NextResponse.json({ message: 'Failed to load order.' }, { status: 500 })
    }

    const order = await getLocalOrderById(authUser.userId, id)

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    return NextResponse.json({ order, mode: 'local-fallback' }, { status: 200 })
  }
}
