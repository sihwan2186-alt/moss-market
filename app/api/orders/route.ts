import mongoose from 'mongoose'
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
import { withLocalStoreLock } from '@/lib/local-store-lock'
import { getErrorMessage, logServerError } from '@/lib/server-error'
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
  return (
    message === 'Your cart is empty.' ||
    message === 'A cart item no longer exists.' ||
    message.startsWith('Not enough stock is available for ')
  )
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
    const message = getErrorMessage(error)

    if (!isConnectionError(message)) {
      logServerError('orders:get', error)
      return NextResponse.json({ message: 'Failed to load orders.' }, { status: 500 })
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
    const session = await mongoose.startSession()
    let orderId = ''

    try {
      await session.withTransaction(async () => {
        const cart = await Cart.findOne({ userId: authUser.userId }).session(session)

        if (!cart || cart.items.length === 0) {
          throw new Error('Your cart is empty.')
        }

        const productIds = cart.items.map((item) => item.productId)
        const products = await Product.find({ _id: { $in: productIds } }).session(session)
        const productMap = new Map(products.map((product) => [product._id.toString(), product]))
        const items: Array<{
          productId: mongoose.Types.ObjectId
          name: string
          price: number
          quantity: number
          image: string
        }> = []

        for (const item of cart.items) {
          const product = productMap.get(item.productId.toString())

          if (!product) {
            throw new Error('A cart item no longer exists.')
          }

          if (product.stock < item.quantity) {
            throw new Error(`Not enough stock is available for ${product.name}.`)
          }

          items.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.images[0] ?? '',
          })
        }

        for (const item of items) {
          const result = await Product.updateOne(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session }
          )

          if (result.modifiedCount !== 1) {
            throw new Error(`Not enough stock is available for ${item.name}.`)
          }
        }

        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const [order] = await Order.create(
          [
            {
              userId: authUser.userId,
              items,
              totalPrice,
              status: 'paid',
              shippingStatus: 'preparing',
              refunds: [],
              ...normalizedCheckout.data,
            },
          ],
          { session }
        )

        cart.items = []
        await cart.save({ session })
        orderId = order._id.toString()
      })
    } finally {
      await session.endSession()
    }

    return NextResponse.json({ message: 'Order created successfully.', orderId }, { status: 201 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (isKnownCheckoutError(message)) {
      return NextResponse.json({ message }, { status: 400 })
    }

    if (!isConnectionError(message)) {
      logServerError('orders:create', error)
      return NextResponse.json({ message: 'Failed to create order.' }, { status: 500 })
    }

    return withLocalStoreLock(async () => {
      let cart = await getLocalCart(authUser.userId)

      if (!cart) {
        cart = await createEmptyLocalCart(authUser.userId)
      }

      if (cart.items.length === 0) {
        return NextResponse.json({ message: 'Your cart is empty.' }, { status: 400 })
      }

      const products = await getLocalProducts()
      const productMap = new Map(products.map((product) => [product._id, product]))
      const items: Array<{
        productId: string
        name: string
        price: number
        quantity: number
        image: string
      }> = []

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
          shippingStatus: 'preparing',
          refunds: [],
          ...normalizedCheckout.data,
        })

        cart.items = []
        cart.updatedAt = new Date().toISOString()
        await saveLocalCart(cart)
      } catch (error) {
        for (const item of cart.items) {
          await updateLocalProductStock(item.productId, item.quantity)
        }

        throw error
      }

      return NextResponse.json(
        { message: 'Order created successfully.', orderId: order.id, mode: 'local-fallback' },
        { status: 201 }
      )
    })
  }
}
