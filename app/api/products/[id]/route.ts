import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import RestockSubscription from '@/db/models/restock-subscription'
import { isDatabaseUnavailableError } from '@/lib/database-error'
import {
  deleteLocalProduct,
  findLocalProductById,
  markLocalRestockSubscriptionsNotified,
  updateLocalProduct,
} from '@/lib/dev-store'
import { removeStoredProductImages } from '@/lib/product-image-storage'
import { getErrorMessage, logServerError } from '@/lib/server-error'
import { getAuthUser } from '@/lib/session'

type ProductBody = {
  name?: string
  description?: string
  price?: number
  images?: string[]
  stock?: number
  category?: string
  featured?: boolean
}

type NormalizedProductInput = {
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
  featured: boolean
}

const FALLBACK_PRODUCT_LOOKUP = 'FALLBACK_PRODUCT_LOOKUP'

function normalizeProductBody(body: ProductBody): { data?: NormalizedProductInput; message?: string } {
  const name = body.name?.trim() ?? ''
  const description = body.description?.trim() ?? ''
  const price = Number(body.price)
  const stock = Number(body.stock ?? 0)
  const images = Array.isArray(body.images)
    ? body.images.map((image) => image.trim()).filter((image) => image.length > 0)
    : []
  const category = body.category?.trim() || 'General'

  if (!name || !description || !Number.isFinite(price)) {
    return {
      message: 'Name, description, and numeric price are required.',
    }
  }

  if (price < 0) {
    return {
      message: 'Price must be 0 or higher.',
    }
  }

  if (images.length === 0) {
    return {
      message: 'At least one image is required.',
    }
  }

  if (!Number.isFinite(stock) || stock < 0) {
    return {
      message: 'Stock must be 0 or higher.',
    }
  }

  return {
    data: {
      name,
      description,
      price,
      images,
      stock,
      category,
      featured: Boolean(body.featured),
    },
  }
}

async function notifyRestockSubscribers(productId: string) {
  const subscriptions = await RestockSubscription.find({ productId, status: 'pending' }).select({ email: 1 }).lean()

  if (subscriptions.length === 0) {
    return []
  }

  await RestockSubscription.updateMany(
    { productId, status: 'pending' },
    { $set: { status: 'notified', notifiedAt: new Date() } }
  )

  return subscriptions.map((subscription) => subscription.email)
}

async function requireAdmin() {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  return null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin()

  if (authError) {
    return authError
  }

  const { id } = await params
  const body = (await request.json()) as ProductBody
  const normalized = normalizeProductBody(body)

  if (!normalized.data) {
    return NextResponse.json({ message: normalized.message }, { status: 400 })
  }

  const productInput = normalized.data

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(FALLBACK_PRODUCT_LOOKUP)
    }

    await dbConnect()
    const existingProduct = await Product.findById(id)

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    const previousStock = existingProduct.stock
    const previousImages = [...existingProduct.images]
    existingProduct.set(productInput)
    await existingProduct.save()

    const removedImages = previousImages.filter((image) => !productInput.images.includes(image))

    try {
      await removeStoredProductImages(removedImages)
    } catch (error) {
      logServerError('products:update-image-cleanup', error)
    }

    const restockNotifications = previousStock <= 0 && productInput.stock > 0 ? await notifyRestockSubscribers(id) : []

    return NextResponse.json(
      {
        message: 'Product updated.',
        product: existingProduct,
        restockNotifications,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = getErrorMessage(error)

    if (message !== FALLBACK_PRODUCT_LOOKUP && !isDatabaseUnavailableError(error)) {
      logServerError('products:update', error)
      return NextResponse.json({ message: 'Failed to update product.' }, { status: 500 })
    }

    const existingProduct = await findLocalProductById(id)

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    const previousStock = existingProduct.stock
    const product = await updateLocalProduct(id, normalized.data)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    const restockNotifications =
      previousStock <= 0 && normalized.data.stock > 0 ? await markLocalRestockSubscriptionsNotified(id) : []

    return NextResponse.json(
      {
        message: 'Product updated.',
        product,
        mode: 'local-fallback',
        restockNotifications,
      },
      { status: 200 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin()

  if (authError) {
    return authError
  }

  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(FALLBACK_PRODUCT_LOOKUP)
    }

    await dbConnect()

    const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    try {
      await removeStoredProductImages(product.images)
    } catch (error) {
      logServerError('products:delete-image-cleanup', error)
    }

    return NextResponse.json({ message: 'Product deleted.' }, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (message !== FALLBACK_PRODUCT_LOOKUP && !isDatabaseUnavailableError(error)) {
      logServerError('products:delete', error)
      return NextResponse.json({ message: 'Failed to delete product.' }, { status: 500 })
    }

    const deleted = await deleteLocalProduct(id)

    if (!deleted) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted.', mode: 'local-fallback' }, { status: 200 })
  }
}
