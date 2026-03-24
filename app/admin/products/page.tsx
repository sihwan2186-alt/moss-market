'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import StoreHeader from '@/components/StoreHeader'

type Product = {
  _id: string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
  featured: boolean
}

type SessionUser = {
  email: string
  role: string
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  stock: '0',
  category: 'General',
  featured: false,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState(emptyForm.name)
  const [description, setDescription] = useState(emptyForm.description)
  const [price, setPrice] = useState(emptyForm.price)
  const [image, setImage] = useState(emptyForm.image)
  const [stock, setStock] = useState(emptyForm.stock)
  const [category, setCategory] = useState(emptyForm.category)
  const [featured, setFeatured] = useState(emptyForm.featured)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [editingId, setEditingId] = useState('')

  const loadProducts = async () => {
    const response = await fetch('/api/products', { cache: 'no-store' })
    const data = await response.json()
    setProducts(data.products ?? [])
  }

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' })
        const data = await response.json()
        setUser(data.user ?? null)

        if (data.user?.role === 'admin') {
          await loadProducts()
        }
      } finally {
        setSessionLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const resetForm = () => {
    setName(emptyForm.name)
    setDescription(emptyForm.description)
    setPrice(emptyForm.price)
    setImage(emptyForm.image)
    setStock(emptyForm.stock)
    setCategory(emptyForm.category)
    setFeatured(emptyForm.featured)
    setEditingId('')
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const isEditing = Boolean(editingId)
      const response = await fetch(isEditing ? `/api/products/${editingId}` : '/api/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          images: image ? [image] : [],
          stock: Number(stock),
          category,
          featured,
        }),
      })

      const data = await response.json()
      setMessage(data.message ?? (response.ok ? 'Product saved.' : 'Could not save product.'))

      if (response.ok) {
        resetForm()
        await loadProducts()
      }
    } catch {
      setMessage('Could not save product.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product._id)
    setName(product.name)
    setDescription(product.description)
    setPrice(String(product.price))
    setImage(product.images[0] ?? '')
    setStock(String(product.stock))
    setCategory(product.category)
    setFeatured(product.featured)
    setMessage('Editing product.')
  }

  const handleDelete = async (productId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      const data = await response.json()
      setMessage(data.message ?? (response.ok ? 'Product deleted.' : 'Could not delete product.'))

      if (response.ok) {
        if (editingId === productId) {
          resetForm()
        }
        await loadProducts()
      }
    } catch {
      setMessage('Could not delete product.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickUpdate = async (product: Product, updates: Partial<Pick<Product, 'stock' | 'featured'>>) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${product._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images,
          stock: updates.stock ?? product.stock,
          category: product.category,
          featured: updates.featured ?? product.featured,
        }),
      })

      const data = await response.json()
      setMessage(data.message ?? (response.ok ? 'Product updated.' : 'Could not update product.'))

      if (response.ok) {
        await loadProducts()
      }
    } catch {
      setMessage('Could not update product.')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">Admin</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Product management</h1>
        </div>

        {sessionLoading ? (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">Checking access...</div>
        ) : !user ? (
          <div className="rounded-[28px] border border-[#d6c5ae] bg-[#fff5e7] p-6 text-[#6d5641] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            You need to log in before opening the admin page.
            <a href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              Go to login
            </a>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-[28px] border border-[#e1c9c9] bg-[#fff1f1] p-6 text-[#7a3d3d] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            Your current account does not have admin access.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit product' : 'Add product'}</h2>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3"
                />
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price"
                  type="number"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3"
                />
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Image URL"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3"
                />
                <input
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Stock"
                  type="number"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3"
                />
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Category"
                  className="w-full rounded-2xl border border-black/10 px-4 py-3"
                />
                <label className="flex items-center gap-3 text-sm font-semibold text-[#314338]">
                  <input checked={featured} onChange={(e) => setFeatured(e.target.checked)} type="checkbox" />
                  Feature this product on the shop page
                </label>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={loading}
                  className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? 'Saving product...' : editingId ? 'Update product' : 'Create product'}
                </button>
                {message && <p className="text-sm text-[#2f6d43]">{message}</p>}
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Current products</h2>
                <button
                  onClick={() => void loadProducts()}
                  className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                >
                  Refresh
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="overflow-hidden rounded-[24px] border border-black/5 bg-[#faf7f1]"
                  >
                    <Image
                      src={product.images[0] ?? ''}
                      alt={product.name}
                      width={800}
                      height={440}
                      className="h-44 w-full bg-[#e8dfd2] object-cover"
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {product.category}
                          </p>
                          <h3 className="mt-2 text-lg font-bold">{product.name}</h3>
                        </div>
                        <p className="font-bold">${product.price}</p>
                      </div>
                      <p className="text-sm leading-6 text-[#5d6a61]">{product.description}</p>
                      <div className="flex items-center justify-between text-sm text-[#5d6a61]">
                        <span>Stock {product.stock}</span>
                        <span>{product.featured ? 'Featured' : 'Standard'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 text-sm font-semibold">
                        <button
                          onClick={() => void handleQuickUpdate(product, { featured: !product.featured })}
                          disabled={loading}
                          className="rounded-full border border-[#1d3124] px-3 py-2 text-[#1d3124] disabled:opacity-60"
                        >
                          {product.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => void handleQuickUpdate(product, { stock: Math.max(0, product.stock - 1) })}
                          disabled={loading || product.stock === 0}
                          className="rounded-full border border-black/10 px-3 py-2 text-[#425247] disabled:opacity-50"
                        >
                          Stock -1
                        </button>
                        <button
                          onClick={() => void handleQuickUpdate(product, { stock: product.stock + 1 })}
                          disabled={loading}
                          className="rounded-full border border-black/10 px-3 py-2 text-[#425247] disabled:opacity-50"
                        >
                          Stock +1
                        </button>
                      </div>
                      <div className="flex gap-4 pt-2 text-sm font-semibold">
                        <button
                          onClick={() => startEdit(product)}
                          className="text-[#1d3124] underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(product._id)}
                          className="text-[#8b2d2d] underline underline-offset-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
