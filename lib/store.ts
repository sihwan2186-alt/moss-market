import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import { findLocalProductById, getLocalProducts } from '@/lib/dev-store'
import { deprecatedSampleProductNames, seedProducts } from '@/lib/sample-products'
import { logServerError } from '@/lib/server-error'

type ProductLike = {
  _id: { toString(): string } | string
  seedKey?: string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
  featured: boolean
}

function seedProductNeedsSync(existingProduct: Partial<ProductLike>, seedProduct: (typeof seedProducts)[number]) {
  return (
    existingProduct.seedKey !== seedProduct.seedKey ||
    existingProduct.name !== seedProduct.name ||
    existingProduct.description !== seedProduct.description ||
    existingProduct.price !== seedProduct.price ||
    existingProduct.stock !== seedProduct.stock ||
    existingProduct.category !== seedProduct.category ||
    existingProduct.featured !== seedProduct.featured ||
    JSON.stringify(existingProduct.images ?? []) !== JSON.stringify(seedProduct.images)
  )
}

export async function ensureProductsSeeded() {
  await dbConnect()

  const existingProducts = await Product.find(
    {},
    {
      seedKey: 1,
      name: 1,
      description: 1,
      price: 1,
      images: 1,
      stock: 1,
      category: 1,
      featured: 1,
    }
  ).lean()
  const existingBySeedKey = new Map(
    existingProducts
      .filter((product) => typeof product.seedKey === 'string' && product.seedKey.length > 0)
      .map((product) => [String(product.seedKey), product])
  )
  const existingByName = new Map(existingProducts.map((product) => [product.name, product]))
  const activeSeedKeys = new Set(seedProducts.map((product) => product.seedKey))
  const deprecatedNames = new Set<string>(deprecatedSampleProductNames)
  const operations = seedProducts.flatMap((product) => {
    const existingProduct = existingBySeedKey.get(product.seedKey) ?? existingByName.get(product.name)

    if (!existingProduct) {
      return {
        insertOne: {
          document: product,
        },
      }
    }

    if (seedProductNeedsSync(existingProduct as ProductLike, product)) {
      return {
        updateOne: {
          filter: { _id: existingProduct._id },
          update: { $set: product },
        },
      }
    }

    return []
  })

  const staleSeedProducts = existingProducts
    .filter(
      (product) =>
        (typeof product.seedKey === 'string' && product.seedKey.length > 0 && !activeSeedKeys.has(product.seedKey)) ||
        (!product.seedKey && deprecatedNames.has(product.name))
    )
    .map((product) => ({
      deleteOne: {
        filter: { _id: product._id },
      },
    }))

  if (operations.length > 0 || staleSeedProducts.length > 0) {
    await Product.bulkWrite([...operations, ...staleSeedProducts])
  }
}

export async function getProducts() {
  await ensureProductsSeeded()
  return Product.find().sort({ featured: -1, createdAt: -1 }).lean()
}

export async function getProductsWithFallback(): Promise<{
  products: ProductLike[]
  source: 'database' | 'fallback'
}> {
  try {
    const products = await getProducts()

    return {
      products: products as ProductLike[],
      source: 'database',
    }
  } catch (error) {
    logServerError('store:getProductsWithFallback', error)

    return {
      products: await getLocalProducts(),
      source: 'fallback',
    }
  }
}

export async function getProductByIdWithFallback(productId: string): Promise<{
  product: ProductLike | null
  source: 'database' | 'fallback'
}> {
  try {
    await ensureProductsSeeded()
    const product = await Product.findById(productId).lean()

    return {
      product: (product as ProductLike | null) ?? null,
      source: 'database',
    }
  } catch (error) {
    logServerError('store:getProductByIdWithFallback', error)

    return {
      product: await findLocalProductById(productId),
      source: 'fallback',
    }
  }
}
