import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { sampleProducts } from '@/lib/sample-products'

type JsonValue = Record<string, unknown>[]

export type LocalProduct = {
  _id: string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
  featured: boolean
  createdAt: string
  updatedAt: string
}

export type LocalCartItem = {
  productId: string
  quantity: number
}

export type LocalCart = {
  id: string
  userId: string
  items: LocalCartItem[]
  createdAt: string
  updatedAt: string
}

export type LocalOrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export type LocalOrder = {
  id: string
  userId: string
  items: LocalOrderItem[]
  totalPrice: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  updatedAt: string
}

const dataDir = path.join(process.cwd(), 'data')
const productsFile = path.join(dataDir, 'products.json')
const cartsFile = path.join(dataDir, 'carts.json')
const ordersFile = path.join(dataDir, 'orders.json')

async function ensureJsonFile(filePath: string, initialData: JsonValue) {
  await fs.mkdir(dataDir, { recursive: true })

  try {
    await fs.access(filePath)
  } catch {
    await fs.writeFile(filePath, JSON.stringify(initialData, null, 2), 'utf8')
  }
}

async function readJsonFile<T>(filePath: string, initialData: T): Promise<T> {
  await ensureJsonFile(filePath, initialData as JsonValue)

  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return initialData
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await ensureJsonFile(filePath, [] as JsonValue)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function nowIso() {
  return new Date().toISOString()
}

function createSeedProducts(): LocalProduct[] {
  const now = nowIso()

  return sampleProducts.map((product, index) => ({
    _id: `local-product-${index + 1}`,
    ...product,
    createdAt: now,
    updatedAt: now,
  }))
}

export async function getLocalProducts() {
  const products = await readJsonFile<LocalProduct[]>(productsFile, createSeedProducts())

  if (products.length === 0) {
    const seeded = createSeedProducts()
    await writeJsonFile(productsFile, seeded)
    return seeded
  }

  return products.sort((a, b) => Number(b.featured) - Number(a.featured))
}

export async function createLocalProduct(input: Omit<LocalProduct, '_id' | 'createdAt' | 'updatedAt'>) {
  const products = await getLocalProducts()
  const product: LocalProduct = {
    _id: crypto.randomUUID(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...input,
  }

  products.unshift(product)
  await writeJsonFile(productsFile, products)

  return product
}

export async function findLocalProductById(productId: string) {
  const products = await getLocalProducts()
  return products.find((product) => product._id === productId) ?? null
}

export async function updateLocalProduct(
  productId: string,
  input: Partial<Omit<LocalProduct, '_id' | 'createdAt' | 'updatedAt'>>
) {
  const products = await getLocalProducts()
  const product = products.find((entry) => entry._id === productId)

  if (!product) {
    return null
  }

  Object.assign(product, input, {
    updatedAt: nowIso(),
  })

  await writeJsonFile(productsFile, products)
  return product
}

export async function deleteLocalProduct(productId: string) {
  const products = await getLocalProducts()
  const nextProducts = products.filter((product) => product._id !== productId)

  if (nextProducts.length === products.length) {
    return false
  }

  await writeJsonFile(productsFile, nextProducts)
  return true
}

export async function updateLocalProductStock(productId: string, quantityDelta: number) {
  const products = await getLocalProducts()
  const product = products.find((entry) => entry._id === productId)

  if (!product) {
    return null
  }

  product.stock = Math.max(0, product.stock + quantityDelta)
  product.updatedAt = nowIso()
  await writeJsonFile(productsFile, products)

  return product
}

export async function getLocalCart(userId: string) {
  const carts = await readJsonFile<LocalCart[]>(cartsFile, [])
  return carts.find((cart) => cart.userId === userId) ?? null
}

export async function saveLocalCart(cart: LocalCart) {
  const carts = await readJsonFile<LocalCart[]>(cartsFile, [])
  const index = carts.findIndex((entry) => entry.userId === cart.userId)

  if (index >= 0) {
    carts[index] = cart
  } else {
    carts.push(cart)
  }

  await writeJsonFile(cartsFile, carts)
}

export async function createEmptyLocalCart(userId: string) {
  const now = nowIso()
  const cart: LocalCart = {
    id: crypto.randomUUID(),
    userId,
    items: [],
    createdAt: now,
    updatedAt: now,
  }

  await saveLocalCart(cart)
  return cart
}

export async function getLocalOrders(userId: string) {
  const orders = await readJsonFile<LocalOrder[]>(ordersFile, [])
  return orders.filter((order) => order.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getAllLocalOrders() {
  const orders = await readJsonFile<LocalOrder[]>(ordersFile, [])
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getLocalOrderById(userId: string, orderId: string) {
  const orders = await getLocalOrders(userId)
  return orders.find((order) => order.id === orderId) ?? null
}

export async function createLocalOrder(input: Omit<LocalOrder, 'id' | 'createdAt' | 'updatedAt'>) {
  const orders = await readJsonFile<LocalOrder[]>(ordersFile, [])
  const now = nowIso()
  const order: LocalOrder = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...input,
  }

  orders.unshift(order)
  await writeJsonFile(ordersFile, orders)

  return order
}
