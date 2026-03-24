import { NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Order from '@/db/models/order'
import { getAllLocalOrders } from '@/lib/dev-store'
import { findLocalUserById } from '@/lib/dev-user-store'
import { getAuthUser } from '@/lib/session'

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

export async function GET() {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  try {
    await dbConnect()
    const orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'email name role').lean()

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown admin orders error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to load admin orders.', error: message }, { status: 500 })
    }

    const orders = await getAllLocalOrders()
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await findLocalUserById(order.userId)

        return {
          ...order,
          user: user
            ? {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              }
            : null,
        }
      })
    )

    return NextResponse.json({ orders: ordersWithUsers, mode: 'local-fallback' }, { status: 200 })
  }
}
