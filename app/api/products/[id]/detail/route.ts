import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { isDatabaseUnavailableError } from '@/lib/database-error'
import { findLocalProductById } from '@/lib/dev-store'
import { getErrorMessage, logServerError } from '@/lib/server-error'

const FALLBACK_PRODUCT_LOOKUP = 'FALLBACK_PRODUCT_LOOKUP'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(FALLBACK_PRODUCT_LOOKUP)
    }

    await dbConnect()
    const product = await Product.findById(id).lean()

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ product }, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (message !== FALLBACK_PRODUCT_LOOKUP && !isDatabaseUnavailableError(error)) {
      logServerError('products:getDetail', error)
      return NextResponse.json({ message: 'Failed to load product.' }, { status: 500 })
    }

    const product = await findLocalProductById(id)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ product, mode: 'local-fallback' }, { status: 200 })
  }
}
