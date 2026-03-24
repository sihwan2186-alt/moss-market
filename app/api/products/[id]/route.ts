import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { deleteLocalProduct, updateLocalProduct } from '@/lib/dev-store'

type ProductBody = {
  name?: string
  description?: string
  price?: number
  images?: string[]
  stock?: number
  category?: string
  featured?: boolean
}

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = (await request.json()) as ProductBody

  if (!body.name || !body.description || typeof body.price !== 'number') {
    return NextResponse.json({ message: 'Name, description, and numeric price are required.' }, { status: 400 })
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'A valid product id is required.' }, { status: 400 })
    }

    await dbConnect()

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: body.name,
        description: body.description,
        price: body.price,
        images: body.images ?? [],
        stock: body.stock ?? 0,
        category: body.category ?? 'General',
        featured: body.featured ?? false,
      },
      { new: true }
    )

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product updated.', product }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown update error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to update product.', error: message }, { status: 500 })
    }

    const product = await updateLocalProduct(id, {
      name: body.name,
      description: body.description,
      price: body.price,
      images: body.images ?? [],
      stock: body.stock ?? 0,
      category: body.category ?? 'General',
      featured: body.featured ?? false,
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product updated.', product, mode: 'local-fallback' }, { status: 200 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'A valid product id is required.' }, { status: 400 })
    }

    await dbConnect()

    const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted.' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown delete error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Failed to delete product.', error: message }, { status: 500 })
    }

    const deleted = await deleteLocalProduct(id)

    if (!deleted) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted.', mode: 'local-fallback' }, { status: 200 })
  }
}
