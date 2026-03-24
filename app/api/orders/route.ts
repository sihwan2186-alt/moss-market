import Cart from '@/db/models/cart'
import Order from '@/db/models/order'
import Product from '@/db/models/product'
import dbConnect from '@/db/dbConnect'
import {
  createEmptyLocalCart,
  createLocalOrder,
  getLocalCart,
  getLocalOrders,
  getLocalProducts,
  saveLocalCart,
  updateLocalProductStock,
} from '@/lib/dev-store'
import { getAuthUser } from '@/lib/session'
import { NextResponse } from 'next/server'

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

  try {
    await dbConnect()

    const orders = await Order.find({ userId: authUser.userId }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown orders error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to load orders.', error: message }, { status: 500 })
    }

    const orders = await getLocalOrders(authUser.userId)
    return NextResponse.json({ orders, mode: 'local-fallback' }, { status: 200 })
  }
}

export async function POST() {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json({ message: 'Please log in before checkout.' }, { status: 401 })
    }

    await dbConnect()

    const cart = await Cart.findOne({ userId: authUser.userId })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 })
    }

    const productIds = cart.items.map((item) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } })
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const items = cart.items.map((item) => {
      const product = productMap.get(item.productId.toString())

      if (!product) {
        throw new Error('A cart item no longer exists.')
      }

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] ?? '',
      }
    })

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const order = await Order.create({
      userId: authUser.userId,
      items,
      totalPrice,
      status: 'paid',
    })

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
    }

    cart.items = []
    await cart.save()

    return NextResponse.json({ message: 'Order created successfully.', orderId: order._id.toString() }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to create order.', error: message }, { status: 500 })
    }

    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json({ message: 'Please log in before checkout.' }, { status: 401 })
    }

    let cart = await getLocalCart(authUser.userId)

    if (!cart) {
      cart = await createEmptyLocalCart(authUser.userId)
    }

    if (cart.items.length === 0) {
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 })
    }

    const products = await getLocalProducts()
    const productMap = new Map(products.map((product) => [product._id, product]))

    const items = cart.items.map((item) => {
      const product = productMap.get(item.productId)

      if (!product) {
        throw new Error('A cart item no longer exists.')
      }

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] ?? '',
      }
    })

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const order = await createLocalOrder({
      userId: authUser.userId,
      items,
      totalPrice,
      status: 'paid',
    })

    for (const item of cart.items) {
      await updateLocalProductStock(item.productId, -item.quantity)
    }

    cart.items = []
    cart.updatedAt = new Date().toISOString()
    await saveLocalCart(cart)

    return NextResponse.json(
      { message: 'Order created successfully.', orderId: order.id, mode: 'local-fallback' },
      { status: 201 }
    )
  }
}
