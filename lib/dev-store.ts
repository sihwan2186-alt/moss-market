import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { deprecatedSampleProductNames, seedProducts } from '@/lib/sample-products'

type JsonValue = Record<string, unknown>[]

export type LocalProduct = {
  _id: string
  seedKey?: string
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
  customerName: string
  contactEmail: string
  shippingAddress: {
    recipient: string
    line1: string
    line2: string
    city: string
    postalCode: string
    country: string
  } | null
  note: string
  paymentLast4: string
  createdAt: string
  updatedAt: string
}

export type LocalRestockSubscription = {
  id: string
  productId: string
  email: string
  userId: string | null
  status: 'pending' | 'notified'
  createdAt: string
  updatedAt: string
  notifiedAt: string | null
}

const dataDir = path.join(process.cwd(), 'data')
const productsFile = path.join(dataDir, 'products.json')
const cartsFile = path.join(dataDir, 'carts.json')
const ordersFile = path.join(dataDir, 'orders.json')
const restockSubscriptionsFile = path.join(dataDir, 'restock-subscriptions.json')

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

function seedProductNeedsSync(existingProduct: LocalProduct, seedProduct: (typeof seedProducts)[number]) {
  return (
    existingProduct.seedKey !== seedProduct.seedKey ||
    existingProduct.name !== seedProduct.name ||
    existingProduct.description !== seedProduct.description ||
    existingProduct.price !== seedProduct.price ||
    existingProduct.stock !== seedProduct.stock ||
    existingProduct.category !== seedProduct.category ||
    existingProduct.featured !== seedProduct.featured ||
    JSON.stringify(existingProduct.images) !== JSON.stringify(seedProduct.images)
  )
}

function createSeedProducts(): LocalProduct[] {
  const now = nowIso()

  return seedProducts.map((product, index) => ({
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

  const timestamp = nowIso()
  const existingBySeedKey = new Map(
    products
      .filter((product) => typeof product.seedKey === 'string' && product.seedKey.length > 0)
      .map((product) => [String(product.seedKey), product])
  )
  const existingByName = new Map(products.map((product) => [product.name, product]))
  const activeSeedKeys = new Set(seedProducts.map((product) => product.seedKey))
  const deprecatedNames = new Set<string>(deprecatedSampleProductNames)
  let didChange = false

  for (const product of seedProducts) {
    const existingProduct = existingBySeedKey.get(product.seedKey) ?? existingByName.get(product.name)

    if (existingProduct) {
      if (seedProductNeedsSync(existingProduct, product)) {
        Object.assign(existingProduct, product, {
          updatedAt: timestamp,
        })
        didChange = true
      }
      continue
    }

    products.unshift({
      _id: crypto.randomUUID(),
      ...product,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    didChange = true
  }

  const syncedProducts = products.filter(
    (product) => (!product.seedKey || activeSeedKeys.has(product.seedKey)) && !deprecatedNames.has(product.name)
  )

  if (syncedProducts.length !== products.length) {
    didChange = true
  }

  if (didChange) {
    await writeJsonFile(productsFile, syncedProducts)
  }

  return syncedProducts.sort((a, b) => Number(b.featured) - Number(a.featured))
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

export async function findLocalOrderById(orderId: string) {
  const orders = await readJsonFile<LocalOrder[]>(ordersFile, [])
  return orders.find((order) => order.id === orderId) ?? null
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

export async function updateLocalOrderStatus(orderId: string, status: LocalOrder['status']) {
  const orders = await readJsonFile<LocalOrder[]>(ordersFile, [])
  const order = orders.find((entry) => entry.id === orderId)

  if (!order) {
    return null
  }

  order.status = status
  order.updatedAt = nowIso()
  await writeJsonFile(ordersFile, orders)

  return order
}

export async function getLocalRestockSubscriptions() {
  return readJsonFile<LocalRestockSubscription[]>(restockSubscriptionsFile, [])
}

export async function findPendingLocalRestockSubscription(productId: string, email: string) {
  const subscriptions = await getLocalRestockSubscriptions()
  return subscriptions.find(
    (entry) => entry.productId === productId && entry.email === email && entry.status === 'pending'
  )
}

export async function createLocalRestockSubscription(
  input: Pick<LocalRestockSubscription, 'productId' | 'email' | 'userId'>
) {
  const subscriptions = await getLocalRestockSubscriptions()
  const timestamp = nowIso()
  const subscription: LocalRestockSubscription = {
    id: crypto.randomUUID(),
    status: 'pending',
    notifiedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  }

  subscriptions.unshift(subscription)
  await writeJsonFile(restockSubscriptionsFile, subscriptions)

  return subscription
}

export async function markLocalRestockSubscriptionsNotified(productId: string) {
  const subscriptions = await getLocalRestockSubscriptions()
  const timestamp = nowIso()
  const emails: string[] = []
  let didChange = false

  for (const subscription of subscriptions) {
    if (subscription.productId !== productId || subscription.status !== 'pending') {
      continue
    }

    subscription.status = 'notified'
    subscription.notifiedAt = timestamp
    subscription.updatedAt = timestamp
    emails.push(subscription.email)
    didChange = true
  }

  if (didChange) {
    await writeJsonFile(restockSubscriptionsFile, subscriptions)
  }

  return emails
}
