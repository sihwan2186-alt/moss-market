import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { sampleProducts } from '@/lib/sample-products'

type ProductLike = {
  _id: { toString(): string } | string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
  featured: boolean
}

export async function ensureProductsSeeded() {
  await dbConnect()

  const count = await Product.countDocuments()

  if (count === 0) {
    await Product.insertMany(sampleProducts)
  }
}

export async function getProducts() {
  await ensureProductsSeeded()
  return Product.find().sort({ featured: -1, createdAt: -1 }).lean()
}

export async function getProductsWithFallback(): Promise<{
  products: ProductLike[]
  source: 'database' | 'fallback'
  error?: string
}> {
  try {
    const products = await getProducts()

    return {
      products: products as ProductLike[],
      source: 'database',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown store error'

    return {
      products: sampleProducts.map((product, index) => ({
        _id: `fallback-${index + 1}`,
        ...product,
      })),
      source: 'fallback',
      error: message,
    }
  }
}

export async function getProductByIdWithFallback(productId: string): Promise<{
  product: ProductLike | null
  source: 'database' | 'fallback'
  error?: string
}> {
  try {
    await ensureProductsSeeded()
    const product = await Product.findById(productId).lean()

    return {
      product: (product as ProductLike | null) ?? null,
      source: 'database',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown store error'
    const fallbackProduct =
      sampleProducts
        .map((product, index) => ({
          _id: `fallback-${index + 1}`,
          ...product,
        }))
        .find((product) => product._id === productId) ?? null

    return {
      product: fallbackProduct,
      source: 'fallback',
      error: message,
    }
  }
}
