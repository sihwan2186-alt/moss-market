'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import ProductCard from '@/components/ProductCard'
import { translateCategory } from '@/lib/i18n'
import { translateProductDescription, translateProductName } from '@/lib/sample-products'

type CatalogProduct = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
}

type ProductCatalogProps = {
  products: CatalogProduct[]
}

export default function ProductCatalog({ products }: ProductCatalogProps) {
  const { locale, messages: t } = useLanguage()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('featured')

  const categories = useMemo(() => {
    const values = new Set(products.map((product) => product.category).filter(Boolean))
    return Array.from(values)
  }, [products])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const nextProducts = products.filter((product) => {
      const translatedCategory = translateCategory(product.category, locale).toLowerCase()
      const translatedName = translateProductName(product.name, locale).toLowerCase()
      const translatedDescription = translateProductDescription(product.description, locale).toLowerCase()
      const matchesCategory = selectedCategory.length === 0 || product.category === selectedCategory
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        translatedName.includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        translatedDescription.includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        translatedCategory.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })

    return nextProducts.sort((left, right) => {
      if (sortBy === 'price-asc') {
        return left.price - right.price
      }

      if (sortBy === 'price-desc') {
        return right.price - left.price
      }

      if (sortBy === 'name-asc') {
        return translateProductName(left.name, locale).localeCompare(translateProductName(right.name, locale), locale)
      }

      return 0
    })
  }, [locale, products, query, selectedCategory, sortBy])

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">{t.catalog.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{t.catalog.title}</h2>
        </div>
        <a href="/orders" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          {t.catalog.viewOrderHistory}
        </a>
      </div>

      <div className="mb-8 grid gap-4 rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)] lg:grid-cols-[1.1fr_0.7fr_0.7fr_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
            {t.catalog.search}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            className="w-full rounded-[18px] border border-[#d8d2c6] bg-[#fcfaf6] px-4 py-3 text-sm text-[#18261d] outline-none transition focus:border-[#68806f]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
            {t.catalog.category}
          </span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-[18px] border border-[#d8d2c6] bg-[#fcfaf6] px-4 py-3 text-sm text-[#18261d] outline-none transition focus:border-[#68806f]"
          >
            <option value="">{t.catalog.allCategories}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {translateCategory(category, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">
            {t.catalog.sort}
          </span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-[18px] border border-[#d8d2c6] bg-[#fcfaf6] px-4 py-3 text-sm text-[#18261d] outline-none transition focus:border-[#68806f]"
          >
            <option value="featured">{t.catalog.featuredFirst}</option>
            <option value="price-asc">{t.catalog.priceLowToHigh}</option>
            <option value="price-desc">{t.catalog.priceHighToLow}</option>
            <option value="name-asc">{t.catalog.nameAToZ}</option>
          </select>
        </label>

        <div className="flex items-end">
          <div className="w-full rounded-[18px] bg-[#203126] px-4 py-3 text-sm font-semibold text-white">
            {locale === 'ko'
              ? `${filteredProducts.length}${t.catalog.productsFoundPlural}`
              : `${filteredProducts.length} ${
                  filteredProducts.length === 1 ? t.catalog.productsFoundSingular : t.catalog.productsFoundPlural
                }`}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[28px] bg-white p-6 text-[#5d6a61] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          {t.catalog.noResults}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              image={product.image}
              category={product.category}
              stock={product.stock}
            />
          ))}
        </div>
      )}
    </section>
  )
}
