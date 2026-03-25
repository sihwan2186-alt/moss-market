'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import StoreHeader from '@/components/StoreHeader'
import { translateCategory } from '@/lib/i18n'
import { translateProductDescription, translateProductName } from '@/lib/sample-products'

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

type Feedback = {
  tone: 'error' | 'success'
  text: string
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  imagesInput: '',
  stock: '0',
  category: 'General',
  featured: false,
}

function parseImageInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((image) => image.trim())
    .filter((image) => image.length > 0)
}

function formatImageInput(images: string[]) {
  return images.join('\n')
}

export default function AdminProductsPage() {
  const { locale, messages: t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState(emptyForm.name)
  const [description, setDescription] = useState(emptyForm.description)
  const [price, setPrice] = useState(emptyForm.price)
  const [imagesInput, setImagesInput] = useState(emptyForm.imagesInput)
  const [stock, setStock] = useState(emptyForm.stock)
  const [category, setCategory] = useState(emptyForm.category)
  const [featured, setFeatured] = useState(emptyForm.featured)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [editingId, setEditingId] = useState('')
  const [restockNotifications, setRestockNotifications] = useState<string[]>([])

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            manageOrders: '주문 관리',
            imageUrls: '이미지 URL 목록',
            imageHint: '한 줄에 하나씩 입력하거나 쉼표로 구분하세요. 첫 번째 이미지가 대표 이미지가 됩니다.',
            imageRequired: '이미지를 최소 한 장 이상 입력해 주세요.',
            imageCount: '이미지 수',
            restockTitle: '재입고 알림 처리됨',
            restockHint: '재고가 0에서 다시 올라가며 아래 이메일에 재입고 알림이 반영되었습니다.',
            noExtraImages: '추가 이미지 없음',
            noImage: '이미지 없음',
          }
        : {
            manageOrders: 'Manage orders',
            imageUrls: 'Image URLs',
            imageHint: 'Add one image URL per line or separate them with commas. The first image becomes the cover.',
            imageRequired: 'Please provide at least one image URL.',
            imageCount: 'Images',
            restockTitle: 'Restock notifications sent',
            restockHint: 'These emails were processed when the product moved back in stock.',
            noExtraImages: 'No extra images',
            noImage: 'No image',
          },
    [locale]
  )

  const loadProducts = useCallback(async () => {
    const response = await fetch('/api/products', { cache: 'no-store' })
    const data = await response.json()
    setProducts(data.products ?? [])
  }, [])

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
  }, [loadProducts])

  const resetForm = useCallback(() => {
    setName(emptyForm.name)
    setDescription(emptyForm.description)
    setPrice(emptyForm.price)
    setImagesInput(emptyForm.imagesInput)
    setStock(emptyForm.stock)
    setCategory(emptyForm.category)
    setFeatured(emptyForm.featured)
    setEditingId('')
  }, [])

  const applyFeedback = useCallback((isSuccess: boolean, message: string, nextRestockNotifications?: string[]) => {
    setFeedback({
      tone: isSuccess ? 'success' : 'error',
      text: message,
    })
    setRestockNotifications(Array.isArray(nextRestockNotifications) ? nextRestockNotifications : [])
  }, [])

  const buildPayload = () => ({
    name,
    description,
    price: Number(price),
    images: parseImageInput(imagesInput),
    stock: Number(stock),
    category,
    featured,
  })

  const handleSubmit = async () => {
    const images = parseImageInput(imagesInput)

    if (images.length === 0) {
      applyFeedback(false, copy.imageRequired)
      return
    }

    try {
      setLoading(true)
      const isEditing = Boolean(editingId)
      const response = await fetch(isEditing ? `/api/products/${editingId}` : '/api/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...buildPayload(),
          images,
        }),
      })

      const data = await response.json()
      applyFeedback(
        response.ok,
        data.message ?? (response.ok ? t.adminProducts.productSaved : t.adminProducts.couldNotSave),
        data.restockNotifications
      )

      if (response.ok) {
        resetForm()
        await loadProducts()
      }
    } catch {
      applyFeedback(false, t.adminProducts.couldNotSave)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product._id)
    setName(product.name)
    setDescription(product.description)
    setPrice(String(product.price))
    setImagesInput(formatImageInput(product.images))
    setStock(String(product.stock))
    setCategory(product.category)
    setFeatured(product.featured)
    setFeedback({
      tone: 'success',
      text: t.adminProducts.editingProduct,
    })
    setRestockNotifications([])
  }

  const handleDelete = async (productId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      const data = await response.json()
      applyFeedback(
        response.ok,
        data.message ?? (response.ok ? t.adminProducts.productDeleted : t.adminProducts.couldNotDelete)
      )

      if (response.ok) {
        if (editingId === productId) {
          resetForm()
        }
        await loadProducts()
      }
    } catch {
      applyFeedback(false, t.adminProducts.couldNotDelete)
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
      applyFeedback(
        response.ok,
        data.message ?? (response.ok ? t.adminProducts.productUpdated : t.adminProducts.couldNotUpdate),
        data.restockNotifications
      )

      if (response.ok) {
        await loadProducts()
      }
    } catch {
      applyFeedback(false, t.adminProducts.couldNotUpdate)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.adminProducts.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{t.adminProducts.title}</h1>
          </div>
          <Link href="/admin/orders" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
            {copy.manageOrders}
          </Link>
        </div>

        {sessionLoading ? (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {t.adminProducts.checkingAccess}
          </div>
        ) : !user ? (
          <div className="rounded-[28px] border border-[#d6c5ae] bg-[#fff5e7] p-6 text-[#6d5641] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {t.adminProducts.needsLogin}
            <a href="/auth?type=login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.login}
            </a>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-[28px] border border-[#e1c9c9] bg-[#fff1f1] p-6 text-[#7a3d3d] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            {t.adminProducts.noAccess}
          </div>
        ) : (
          <div className="space-y-6">
            {feedback && (
              <div
                className={`rounded-[24px] border p-5 text-sm ${
                  feedback.tone === 'error'
                    ? 'border-[#e1c9c9] bg-[#fff1f1] text-[#7a3d3d]'
                    : 'border-[#c9dfcb] bg-[#edf8ee] text-[#2f5b39]'
                }`}
              >
                {feedback.text}
              </div>
            )}

            {restockNotifications.length > 0 && (
              <div className="rounded-[24px] border border-[#c9dfcb] bg-[#edf8ee] p-5 text-sm text-[#2f5b39]">
                <p className="font-semibold">{copy.restockTitle}</p>
                <p className="mt-2">{copy.restockHint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {restockNotifications.map((email) => (
                    <span key={email} className="rounded-full bg-white px-3 py-1 font-semibold text-[#274c30]">
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
              <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold">
                    {editingId ? t.adminProducts.editProduct : t.adminProducts.addProduct}
                  </h2>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                      type="button"
                    >
                      {t.adminProducts.cancelEdit}
                    </button>
                  )}
                </div>
                <div className="mt-5 space-y-4">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t.adminProducts.productName}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3"
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t.adminProducts.description}
                    className="min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3"
                  />
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder={t.adminProducts.price}
                    type="number"
                    className="w-full rounded-2xl border border-black/10 px-4 py-3"
                  />
                  <div>
                    <textarea
                      value={imagesInput}
                      onChange={(event) => setImagesInput(event.target.value)}
                      placeholder={copy.imageUrls}
                      className="min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3"
                    />
                    <p className="mt-2 text-xs leading-5 text-[#5d6a61]">{copy.imageHint}</p>
                  </div>
                  <input
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                    placeholder={t.adminProducts.stock}
                    type="number"
                    className="w-full rounded-2xl border border-black/10 px-4 py-3"
                  />
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder={t.adminProducts.category}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3"
                  />
                  <label className="flex items-center gap-3 text-sm font-semibold text-[#314338]">
                    <input checked={featured} onChange={(event) => setFeatured(event.target.checked)} type="checkbox" />
                    {t.adminProducts.featureOnShopPage}
                  </label>
                  <button
                    onClick={() => void handleSubmit()}
                    disabled={loading}
                    className="w-full rounded-full bg-[#1d3124] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                    type="button"
                  >
                    {loading
                      ? t.adminProducts.savingProduct
                      : editingId
                        ? t.adminProducts.updateProduct
                        : t.adminProducts.createProduct}
                  </button>
                </div>
              </section>

              <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t.adminProducts.currentProducts}</h2>
                  <button
                    onClick={() => void loadProducts()}
                    className="text-sm font-semibold text-[#1d3124] underline underline-offset-4"
                    type="button"
                  >
                    {t.adminProducts.refresh}
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {products.map((product) => (
                    <article
                      key={product._id}
                      className="overflow-hidden rounded-[24px] border border-black/5 bg-[#faf7f1]"
                    >
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={translateProductName(product.name, locale)}
                          width={800}
                          height={440}
                          className="h-44 w-full bg-[#e8dfd2] object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-[#e8dfd2] text-sm font-semibold uppercase tracking-[0.3em] text-[#68736a]">
                          {copy.noImage}
                        </div>
                      )}
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                              {translateCategory(product.category, locale)}
                            </p>
                            <h3 className="mt-2 text-lg font-bold">{translateProductName(product.name, locale)}</h3>
                          </div>
                          <p className="font-bold">${product.price}</p>
                        </div>
                        <p className="text-sm leading-6 text-[#5d6a61]">
                          {translateProductDescription(product.description, locale)}
                        </p>
                        <div className="flex items-center justify-between text-sm text-[#5d6a61]">
                          <span>
                            {t.adminProducts.stock} {product.stock}
                          </span>
                          <span>{product.featured ? t.adminProducts.featured : t.adminProducts.standard}</span>
                        </div>
                        <div className="rounded-[20px] bg-white/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                            {copy.imageCount} {product.images.length}
                          </p>
                          {product.images.length > 1 ? (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {product.images.slice(1, 4).map((image, index) => (
                                <Image
                                  key={`${product._id}-gallery-${index}`}
                                  src={image}
                                  alt={`${translateProductName(product.name, locale)} ${index + 2}`}
                                  width={160}
                                  height={120}
                                  className="h-16 w-full rounded-2xl object-cover"
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-[#5d6a61]">{copy.noExtraImages}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 text-sm font-semibold">
                          <button
                            onClick={() => void handleQuickUpdate(product, { featured: !product.featured })}
                            disabled={loading}
                            className="rounded-full border border-[#1d3124] px-3 py-2 text-[#1d3124] disabled:opacity-60"
                            type="button"
                          >
                            {product.featured ? t.adminProducts.unfeature : t.adminProducts.feature}
                          </button>
                          <button
                            onClick={() => void handleQuickUpdate(product, { stock: Math.max(0, product.stock - 1) })}
                            disabled={loading || product.stock === 0}
                            className="rounded-full border border-black/10 px-3 py-2 text-[#425247] disabled:opacity-50"
                            type="button"
                          >
                            {t.adminProducts.stockMinus}
                          </button>
                          <button
                            onClick={() => void handleQuickUpdate(product, { stock: product.stock + 1 })}
                            disabled={loading}
                            className="rounded-full border border-black/10 px-3 py-2 text-[#425247] disabled:opacity-50"
                            type="button"
                          >
                            {t.adminProducts.stockPlus}
                          </button>
                        </div>
                        <div className="flex gap-4 pt-2 text-sm font-semibold">
                          <button
                            onClick={() => startEdit(product)}
                            className="text-[#1d3124] underline underline-offset-4"
                            type="button"
                          >
                            {t.adminProducts.edit}
                          </button>
                          <button
                            onClick={() => void handleDelete(product._id)}
                            className="text-[#8b2d2d] underline underline-offset-4"
                            type="button"
                          >
                            {t.adminProducts.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
