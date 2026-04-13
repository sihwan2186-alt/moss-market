'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ProductDetailActions from '@/components/ProductDetailActions'
import StoreHeader from '@/components/StoreHeader'
import { useLanguage } from '@/components/LanguageProvider'
import { Locale, translateCategory } from '@/lib/i18n'
import { shouldBypassProductImageOptimization } from '@/lib/product-image-utils'
import { translateProductDescription, translateProductName } from '@/lib/sample-products'

type ProductDetail = {
  _id: string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: string
}

type ProductDetailViewProps = {
  product: ProductDetail | null
  source: 'database' | 'fallback'
}

function getStockLabel(stock: number, locale: Locale, availableLabel: string) {
  return locale === 'ko' ? `${stock}${availableLabel}` : `${stock} ${availableLabel}`
}

export default function ProductDetailView({ product, source }: ProductDetailViewProps) {
  const { locale, messages: t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState('')
  const initialImage = product?.images[0] ?? ''

  useEffect(() => {
    setSelectedImage(initialImage)
  }, [initialImage])

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
        <StoreHeader />
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h1 className="text-3xl font-black">{t.productDetail.notFoundTitle}</h1>
            <p className="mt-4 text-[#5d6a61]">{t.productDetail.notFoundDescription}</p>
            <Link href="/" className="mt-6 inline-block font-semibold text-[#1d3124] underline underline-offset-4">
              {t.productDetail.backToShop}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const localizedName = translateProductName(product.name, locale)
  const localizedDescription = translateProductDescription(product.description, locale)
  const activeImage = selectedImage || initialImage

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          {t.productDetail.backToShop}
        </Link>

        {source === 'fallback' && (
          <div className="mt-6 rounded-[24px] border border-[#d9c9b0] bg-[#fff6e9] p-4 text-sm text-[#6c5840]">
            {t.productDetail.fallback}
          </div>
        )}

        <section className="mt-8 grid gap-8 rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)] lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="overflow-hidden rounded-[28px] bg-[#e8dfd2]">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={localizedName}
                  width={1200}
                  height={900}
                  unoptimized={shouldBypassProductImageOptimization(activeImage)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex min-h-80 items-center justify-center text-sm font-semibold uppercase tracking-[0.3em] text-[#68736a]">
                  No image
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.images.map((image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-[20px] border ${
                      activeImage === image ? 'border-[#1d3124]' : 'border-black/10'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={localizedName}
                      width={240}
                      height={180}
                      unoptimized={shouldBypassProductImageOptimization(image)}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#68806f]">
                {translateCategory(product.category, locale)}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{localizedName}</h1>
              <p className="mt-5 text-lg leading-8 text-[#4e5c52]">{localizedDescription}</p>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-[24px] bg-[#f7f1e8] px-5 py-4">
                <span className="text-sm uppercase tracking-[0.2em] text-[#68806f]">{t.productDetail.price}</span>
                <strong className="text-2xl">${product.price}</strong>
              </div>
              <div className="flex items-center justify-between rounded-[24px] bg-[#f7f1e8] px-5 py-4">
                <span className="text-sm uppercase tracking-[0.2em] text-[#68806f]">{t.productDetail.stock}</span>
                <strong className="text-lg">{getStockLabel(product.stock, locale, t.productDetail.available)}</strong>
              </div>
              <ProductDetailActions productId={String(product._id)} stock={product.stock} />
              <p className="text-sm text-[#5d6a61]">{t.productDetail.tip}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
