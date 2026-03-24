import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { findLocalProductById } from '@/lib/dev-store'

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'A valid product id is required.' }, { status: 400 })
    }

    await dbConnect()
    const product = await Product.findById(id).lean()

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ product }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown product detail error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to load product.', error: message }, { status: 500 })
    }

    const product = await findLocalProductById(id)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ product, mode: 'local-fallback' }, { status: 200 })
  }
}
