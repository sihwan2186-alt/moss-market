'use client'

import ProductCatalog from '@/components/ProductCatalog'
import StoreHeader from '@/components/StoreHeader'
import { useLanguage } from '@/components/LanguageProvider'

type CatalogProduct = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
}

type HomePageContentProps = {
  products: CatalogProduct[]
  source: 'database' | 'fallback'
  error?: string
  isLoggedIn: boolean
}

export default function HomePageContent({ products, source, error, isLoggedIn }: HomePageContentProps) {
  const { messages: t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-[40px] bg-[radial-gradient(circle_at_top_left,_rgba(108,148,123,0.35),_transparent_38%),linear-gradient(135deg,_#efe5d6_0%,_#f8f2ea_48%,_#e4ecdf_100%)] p-8 shadow-[0_25px_80px_rgba(23,31,26,0.08)] lg:p-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#577363]">{t.home.eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-5xl font-black leading-[1.02] tracking-tight text-[#152117]">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#49584c]">{t.home.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoggedIn && (
                <a
                  href="/auth?type=sign-up"
                  className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white"
                >
                  {t.home.createAccount}
                </a>
              )}
              <a
                href="/cart"
                className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
              >
                {t.home.openCart}
              </a>
              <a
                href="/health"
                className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
              >
                {t.home.healthCheck}
              </a>
            </div>
          </div>
        </section>

        {source === 'fallback' && (
          <div className="mt-12 rounded-[24px] border border-[#d9c9b0] bg-[#fff6e9] p-4 text-sm text-[#6c5840]">
            {t.home.fallback}
            {error ? ` Error: ${error}` : ''}
          </div>
        )}

        <ProductCatalog products={products} />
      </main>
    </div>
  )
}
