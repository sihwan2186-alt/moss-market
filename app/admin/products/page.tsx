'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import StoreHeader from '@/components/StoreHeader'
import { translateCategory } from '@/lib/i18n'
import { shouldBypassProductImageOptimization } from '@/lib/product-image-utils'
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
  stock: '0',
  category: 'General',
  featured: false,
}

export default function AdminProductsPage() {
  const { locale, messages: t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState(emptyForm.name)
  const [description, setDescription] = useState(emptyForm.description)
  const [price, setPrice] = useState(emptyForm.price)
  const [stock, setStock] = useState(emptyForm.stock)
  const [category, setCategory] = useState(emptyForm.category)
  const [featured, setFeatured] = useState(emptyForm.featured)
  const [storedImages, setStoredImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [localPreviewUrls, setLocalPreviewUrls] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [editingId, setEditingId] = useState('')
  const [restockNotifications, setRestockNotifications] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const copy = useMemo(
    () =>
      locale === 'ko'
        ? {
            manageOrders: '\uc8fc\ubb38 \uad00\ub9ac',
            selectImages: '\uc0c1\ud488 \uc774\ubbf8\uc9c0 \uc120\ud0dd',
            replaceImages: '\uc0c8 \uc774\ubbf8\uc9c0\ub85c \uad50\uccb4',
            imageHint:
              '\ucef4\ud4e8\ud130\uc5d0 \uc788\ub294 \uc774\ubbf8\uc9c0 \ud30c\uc77c\uc744 \uc120\ud0dd\ud558\uc138\uc694. \uccab \ubc88\uc9f8 \uc774\ubbf8\uc9c0\uac00 \ub300\ud45c \uc774\ubbf8\uc9c0\ub85c \uc0ac\uc6a9\ub429\ub2c8\ub2e4.',
            editImageHint:
              '\uc0c8 \ud30c\uc77c\uc744 \uc120\ud0dd\ud558\uba74 \ud604\uc7ac \uc774\ubbf8\uc9c0\ub97c \ub300\uccb4\ud569\ub2c8\ub2e4. \uc120\ud0dd\ud558\uc9c0 \uc54a\uc73c\uba74 \uae30\uc874 \uc774\ubbf8\uc9c0\ub97c \uadf8\ub300\ub85c \uc720\uc9c0\ud569\ub2c8\ub2e4.',
            imageRequired: '\uc774\ubbf8\uc9c0\ub97c \ucd5c\uc18c 1\uc7a5 \uc120\ud0dd\ud574\uc8fc\uc138\uc694.',
            imageCount: '\uc774\ubbf8\uc9c0',
            currentImages: '\ud604\uc7ac \uc774\ubbf8\uc9c0',
            selectedImages: '\uc120\ud0dd\ub41c \uc774\ubbf8\uc9c0',
            keepCurrentImages: '\uae30\uc874 \uc774\ubbf8\uc9c0 \uc720\uc9c0',
            uploadFailed: '\uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.',
            restockTitle: '\uc7ac\uc785\uace0 \uc54c\ub9bc \ucc98\ub9ac \uc644\ub8cc',
            restockHint:
              '\uc7ac\uace0\uac00 0\uc5d0\uc11c \ub2e4\uc2dc \uc62c\ub77c\uac00\uba74 \uc544\ub798 \uc774\uba54\uc77c\uc5d0 \uc7ac\uc785\uace0 \uc54c\ub9bc\uc774 \ubc18\uc601\ub429\ub2c8\ub2e4.',
            noExtraImages: '\ucd94\uac00 \uc774\ubbf8\uc9c0 \uc5c6\uc74c',
            noImage: '\uc774\ubbf8\uc9c0 \uc5c6\uc74c',
          }
        : {
            manageOrders: 'Manage orders',
            selectImages: 'Select images',
            replaceImages: 'Replace images',
            imageHint: 'Choose image files from your computer. The first image becomes the primary product image.',
            editImageHint:
              'Selecting new files replaces the current images. Leave this empty to keep the existing images.',
            imageRequired: 'Please select at least one image.',
            imageCount: 'Images',
            currentImages: 'Current images',
            selectedImages: 'Selected images',
            keepCurrentImages: 'Keep current images',
            uploadFailed: 'Image upload failed.',
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

  const resetSelectedFiles = useCallback(() => {
    setSelectedFiles([])
    setLocalPreviewUrls((currentUrls) => {
      currentUrls.forEach((url) => URL.revokeObjectURL(url))
      return []
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

  useEffect(() => {
    return () => {
      localPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [localPreviewUrls])

  const resetForm = useCallback(() => {
    setName(emptyForm.name)
    setDescription(emptyForm.description)
    setPrice(emptyForm.price)
    setStock(emptyForm.stock)
    setCategory(emptyForm.category)
    setFeatured(emptyForm.featured)
    setStoredImages([])
    setEditingId('')
    resetSelectedFiles()
  }, [resetSelectedFiles])

  const applyFeedback = useCallback((isSuccess: boolean, message: string, nextRestockNotifications?: string[]) => {
    setFeedback({
      tone: isSuccess ? 'success' : 'error',
      text: message,
    })
    setRestockNotifications(Array.isArray(nextRestockNotifications) ? nextRestockNotifications : [])
  }, [])

  const buildPayload = useCallback(
    (images: string[]) => ({
      name,
      description,
      price: Number(price),
      images,
      stock: Number(stock),
      category,
      featured,
    }),
    [category, description, featured, name, price, stock]
  )

  const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      return []
    }

    const formData = new FormData()

    for (const file of selectedFiles) {
      formData.append('files', file)
    }

    const response = await fetch('/api/uploads/product-images', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()

    if (!response.ok || !Array.isArray(data.images) || data.images.length === 0) {
      throw new Error(data.message ?? copy.uploadFailed)
    }

    return data.images as string[]
  }, [copy.uploadFailed, selectedFiles])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setSelectedFiles(files)
    setLocalPreviewUrls((currentUrls) => {
      currentUrls.forEach((url) => URL.revokeObjectURL(url))
      return files.map((file) => URL.createObjectURL(file))
    })
  }, [])

  const handleSubmit = async () => {
    let images = storedImages

    if (selectedFiles.length > 0) {
      try {
        setLoading(true)
        images = await uploadSelectedFiles()
      } catch (error) {
        applyFeedback(false, error instanceof Error ? error.message : copy.uploadFailed)
        setLoading(false)
        return
      }
    }

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
        body: JSON.stringify(buildPayload(images)),
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
    setStock(String(product.stock))
    setCategory(product.category)
    setFeatured(product.featured)
    setStoredImages(product.images)
    resetSelectedFiles()
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

  const previewImages = localPreviewUrls.length > 0 ? localPreviewUrls : storedImages
  const previewLabel = localPreviewUrls.length > 0 ? copy.selectedImages : copy.currentImages
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
            <Link href="/auth?type=admin-login" className="ml-2 font-semibold underline underline-offset-4">
              {t.header.adminLogin}
            </Link>
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

                  <div className="space-y-3 rounded-[24px] border border-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1d3124]">
                          {editingId ? copy.replaceImages : copy.selectImages}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#5d6a61]">
                          {editingId ? copy.editImageHint : copy.imageHint}
                        </p>
                      </div>
                      {editingId && localPreviewUrls.length > 0 && storedImages.length > 0 && (
                        <button
                          onClick={resetSelectedFiles}
                          className="text-xs font-semibold text-[#1d3124] underline underline-offset-4"
                          type="button"
                        >
                          {copy.keepCurrentImages}
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="block w-full cursor-pointer rounded-2xl border border-dashed border-black/15 bg-[#faf7f1] px-4 py-3 text-sm text-[#425247] file:mr-4 file:rounded-full file:border-0 file:bg-[#1d3124] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      type="file"
                    />

                    {previewImages.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
                          {previewLabel} {previewImages.length}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {previewImages.slice(0, 4).map((image, index) =>
                            localPreviewUrls.length > 0 ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                key={`${image}-${index}`}
                                src={image}
                                alt={`Selected product preview ${index + 1}`}
                                className="h-28 w-full rounded-2xl object-cover"
                              />
                            ) : (
                              <Image
                                key={`${image}-${index}`}
                                src={image}
                                alt={`Stored product preview ${index + 1}`}
                                width={240}
                                height={180}
                                unoptimized={shouldBypassProductImageOptimization(image)}
                                className="h-28 w-full rounded-2xl object-cover"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
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
                          unoptimized={shouldBypassProductImageOptimization(product.images[0])}
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
                                  unoptimized={shouldBypassProductImageOptimization(image)}
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
