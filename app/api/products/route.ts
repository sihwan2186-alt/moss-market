import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { createLocalProduct, getLocalProducts } from '@/lib/dev-store'
import { ensureProductsSeeded } from '@/lib/store'
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
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  const body = (await request.json()) as ProductBody
  const normalized = normalizeProductBody(body)

  if (!normalized.data) {
    return NextResponse.json({ message: normalized.message }, { status: 400 })
  }

  try {
    await dbConnect()

    const product = await Product.create(normalized.data)

    return NextResponse.json({ message: 'Product created.', product }, { status: 201 })
  } catch {
    const product = await createLocalProduct(normalized.data)

    return NextResponse.json(
      { message: 'Product created in local fallback mode.', product, mode: 'local-fallback' },
      { status: 201 }
    )
  }
}
