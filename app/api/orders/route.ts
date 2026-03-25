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
import { parseOptionalJsonBody } from '@/lib/json-body'
import { getAuthUser } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

type CheckoutBody = {
  customerName?: string
  contactEmail?: string
  shippingAddress?: {
    recipient?: string
    line1?: string
    line2?: string
    city?: string
    postalCode?: string
    country?: string
  }
  note?: string
  paymentCardNumber?: string
}

type NormalizedCheckoutDetails = {
  customerName: string
  contactEmail: string
  shippingAddress: {
    recipient: string
    line1: string
    line2: string
    city: string
    postalCode: string
    country: string
  } | null
  note: string
  paymentLast4: string
}

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isKnownCheckoutError(message: string) {
  return message === 'A cart item no longer exists.' || message.startsWith('Not enough stock is available for ')
}

function normalizeCheckoutDetails(body: CheckoutBody | null, fallbackEmail: string, fallbackName: string) {
  const customerName = body?.customerName?.trim() || fallbackName
  const contactEmail = (body?.contactEmail?.trim().toLowerCase() || fallbackEmail).trim()
  const note = body?.note?.trim() ?? ''
  const paymentLast4 = (body?.paymentCardNumber ?? '').replace(/\D/g, '').slice(-4)
  const shippingAddressInput = body?.shippingAddress
  const hasShippingInput = Boolean(
    shippingAddressInput && Object.values(shippingAddressInput).some((value) => (value?.trim() ?? '').length > 0)
  )

  if (!contactEmail || !isValidEmail(contactEmail)) {
    return {
      message: 'A valid contact email is required.',
    }
  }

  if (!hasShippingInput) {
    return {
      data: {
        customerName,
        contactEmail,
        shippingAddress: null,
        note,
        paymentLast4,
      } satisfies NormalizedCheckoutDetails,
    }
  }

  const shippingAddress = {
    recipient: shippingAddressInput?.recipient?.trim() ?? '',
    line1: shippingAddressInput?.line1?.trim() ?? '',
    line2: shippingAddressInput?.line2?.trim() ?? '',
    city: shippingAddressInput?.city?.trim() ?? '',
    postalCode: shippingAddressInput?.postalCode?.trim() ?? '',
    country: shippingAddressInput?.country?.trim() ?? '',
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
    }
  }

  return {
    data: {
      customerName,
      contactEmail,
      shippingAddress,
      note,
      paymentLast4,
    } satisfies NormalizedCheckoutDetails,
  }
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

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in before checkout.' }, { status: 401 })
  }

  const body = await parseOptionalJsonBody<CheckoutBody>(request)
  const normalizedCheckout = normalizeCheckoutDetails(body, authUser.email, authUser.name)

  if (!normalizedCheckout.data) {
    return NextResponse.json({ message: normalizedCheckout.message }, { status: 400 })
  }

  try {
    await dbConnect()

    const cart = await Cart.findOne({ userId: authUser.userId })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 })
    }

    const productIds = cart.items.map((item) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } })
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const items = []

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString())

      if (!product) {
        return NextResponse.json({ message: 'A cart item no longer exists.' }, { status: 400 })
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ message: `Not enough stock is available for ${product.name}.` }, { status: 400 })
      }

      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] ?? '',
      })
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
    }

    let order

    try {
      order = await Order.create({
        userId: authUser.userId,
        items,
        totalPrice,
        status: 'paid',
        ...normalizedCheckout.data,
      })
    } catch (error) {
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      }

      throw error
    }

    cart.items = []
    await cart.save()

    return NextResponse.json({ message: 'Order created successfully.', orderId: order._id.toString() }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error'

    if (isKnownCheckoutError(message)) {
      return NextResponse.json({ message }, { status: 400 })
    }

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to create order.', error: message }, { status: 500 })
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

    const items = []

    for (const item of cart.items) {
      const product = productMap.get(item.productId)

      if (!product) {
        return NextResponse.json({ message: 'A cart item no longer exists.' }, { status: 400 })
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ message: `Not enough stock is available for ${product.name}.` }, { status: 400 })
      }

      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] ?? '',
      })
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    for (const item of cart.items) {
      await updateLocalProductStock(item.productId, -item.quantity)
    }

    let order

    try {
      order = await createLocalOrder({
        userId: authUser.userId,
        items,
        totalPrice,
        status: 'paid',
        ...normalizedCheckout.data,
      })
    } catch (error) {
      for (const item of cart.items) {
        await updateLocalProductStock(item.productId, item.quantity)
      }

      throw error
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
