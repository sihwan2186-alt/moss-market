import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { createLocalProduct, getLocalProducts } from '@/lib/dev-store'
import { ensureProductsSeeded } from '@/lib/store'

type ProductBody = {
  name?: string
  description?: string
  price?: number
  images?: string[]
  stock?: number
  category?: string
  featured?: boolean
}

export async function GET() {
  try {
    await ensureProductsSeeded()
    const products = await Product.find().sort({ featured: -1, createdAt: -1 }).lean()

    return NextResponse.json({ products }, { status: 200 })
  } catch {
    const products = await getLocalProducts()
    return NextResponse.json({ products, mode: 'local-fallback' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ProductBody

  if (!body.name || !body.description || typeof body.price !== 'number') {
    return NextResponse.json({ message: 'Name, description, and numeric price are required.' }, { status: 400 })
  }

  try {
    await dbConnect()

    const product = await Product.create({
      name: body.name,
      description: body.description,
      price: body.price,
      images: body.images ?? [],
      stock: body.stock ?? 0,
      category: body.category ?? 'General',
      featured: body.featured ?? false,
    })

    return NextResponse.json({ message: 'Product created.', product }, { status: 201 })
  } catch {
    const product = await createLocalProduct({
      name: body.name,
      description: body.description,
      price: body.price,
      images: body.images ?? [],
      stock: body.stock ?? 0,
      category: body.category ?? 'General',
      featured: body.featured ?? false,
    })

    return NextResponse.json(
      { message: 'Product created in local fallback mode.', product, mode: 'local-fallback' },
      { status: 201 }
    )
  }
}
