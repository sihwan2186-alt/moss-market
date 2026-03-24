import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Cart from '@/db/models/cart'
import Product from '@/db/models/product'
import {
  createEmptyLocalCart,
  findLocalProductById,
  getLocalCart,
  getLocalProducts,
  saveLocalCart,
} from '@/lib/dev-store'
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

  try {
    await dbConnect()

    const cart = await Cart.findOne({ userId: authUser.userId }).lean()

    if (!cart) {
      return NextResponse.json({ items: [], totalPrice: 0 }, { status: 200 })
    }

    const productIds = cart.items.map((item) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } }).lean()
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const items = cart.items.map((item) => {
      const product = productMap.get(item.productId.toString())
      const price = product?.price ?? 0
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product?.name ?? 'Unknown product',
        image: product?.images?.[0] ?? '',
        price,
        subtotal: price * item.quantity,
      }
    })

    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

    return NextResponse.json({ items, totalPrice }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown cart error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to load cart.', error: message }, { status: 500 })
    }

    const cart = await getLocalCart(authUser.userId)
    const products = await getLocalProducts()
    const productMap = new Map(products.map((product) => [product._id, product]))
    const items =
      cart?.items.map((item) => {
        const product = productMap.get(item.productId)
        const price = product?.price ?? 0

        return {
          productId: item.productId,
          quantity: item.quantity,
          name: product?.name ?? 'Unknown product',
          image: product?.images?.[0] ?? '',
          price,
          subtotal: price * item.quantity,
        }
      }) ?? []
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

    return NextResponse.json({ items, totalPrice, mode: 'local-fallback' }, { status: 200 })
  }
}

type AddToCartBody = {
  productId?: string
  quantity?: number
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in before adding items to cart.' }, { status: 401 })
  }

  const body = (await request.json()) as AddToCartBody

  if (!body.productId) {
    return NextResponse.json({ message: 'A valid productId is required.' }, { status: 400 })
  }

  const quantity = body.quantity && body.quantity > 0 ? body.quantity : 1

  try {
    if (!body.productId || !mongoose.Types.ObjectId.isValid(body.productId)) {
      return NextResponse.json({ message: 'A valid productId is required.' }, { status: 400 })
    }

    await dbConnect()

    const product = await Product.findById(body.productId)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    let cart = await Cart.findOne({ userId: authUser.userId })

    if (!cart) {
      cart = await Cart.create({
        userId: authUser.userId,
        items: [{ productId: product._id, quantity }],
      })
    } else {
      const existingItem = cart.items.find((item) => item.productId.toString() === body.productId)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        cart.items.push({ productId: product._id, quantity })
      }

      await cart.save()
    }

    return NextResponse.json({ message: 'Product added to cart.', cartId: cart._id.toString() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown add to cart error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to update cart.', error: message }, { status: 500 })
    }

    const product = await findLocalProductById(body.productId)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    let cart = await getLocalCart(authUser.userId)

    if (!cart) {
      cart = await createEmptyLocalCart(authUser.userId)
    }

    const existingItem = cart.items.find((item) => item.productId === body.productId)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.items.push({ productId: body.productId, quantity })
    }

    cart.updatedAt = new Date().toISOString()
    await saveLocalCart(cart)

    return NextResponse.json(
      { message: 'Product added to cart.', cartId: cart.id, mode: 'local-fallback' },
      { status: 200 }
    )
  }
}

type UpdateCartBody = {
  productId?: string
  quantity?: number
}

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  const body = (await request.json()) as UpdateCartBody

  if (!body.productId) {
    return NextResponse.json({ message: 'A valid productId is required.' }, { status: 400 })
  }

  if (!body.quantity || body.quantity < 1) {
    return NextResponse.json({ message: 'Quantity must be at least 1.' }, { status: 400 })
  }

  try {
    if (!body.productId || !mongoose.Types.ObjectId.isValid(body.productId)) {
      return NextResponse.json({ message: 'A valid productId is required.' }, { status: 400 })
    }

    await dbConnect()

    const cart = await Cart.findOne({ userId: authUser.userId })

    if (!cart) {
      return NextResponse.json({ message: 'Cart not found.' }, { status: 404 })
    }

    const item = cart.items.find((entry) => entry.productId.toString() === body.productId)

    if (!item) {
      return NextResponse.json({ message: 'Cart item not found.' }, { status: 404 })
    }

    item.quantity = body.quantity
    await cart.save()

    return NextResponse.json({ message: 'Cart quantity updated.' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown cart update error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to update cart quantity.', error: message }, { status: 500 })
    }

    const cart = await getLocalCart(authUser.userId)

    if (!cart) {
      return NextResponse.json({ message: 'Cart not found.' }, { status: 404 })
    }

    const item = cart.items.find((entry) => entry.productId === body.productId)

    if (!item) {
      return NextResponse.json({ message: 'Cart item not found.' }, { status: 404 })
    }

    item.quantity = body.quantity
    cart.updatedAt = new Date().toISOString()
    await saveLocalCart(cart)

    return NextResponse.json({ message: 'Cart quantity updated.', mode: 'local-fallback' }, { status: 200 })
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  const productId = request.nextUrl.searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ message: 'A valid productId is required.' }, { status: 400 })
  }

  try {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ message: 'A valid productId is required.' }, { status: 400 })
    }

    await dbConnect()

    const cart = await Cart.findOne({ userId: authUser.userId })

    if (!cart) {
      return NextResponse.json({ message: 'Cart not found.' }, { status: 404 })
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId)
    await cart.save()

    return NextResponse.json({ message: 'Item removed from cart.' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown cart delete error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to remove cart item.', error: message }, { status: 500 })
    }

    const cart = await getLocalCart(authUser.userId)

    if (!cart) {
      return NextResponse.json({ message: 'Cart not found.' }, { status: 404 })
    }

    cart.items = cart.items.filter((item) => item.productId !== productId)
    cart.updatedAt = new Date().toISOString()
    await saveLocalCart(cart)

    return NextResponse.json({ message: 'Item removed from cart.', mode: 'local-fallback' }, { status: 200 })
  }
}
