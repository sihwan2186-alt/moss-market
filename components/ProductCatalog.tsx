'use client'

import { useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'

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
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('featured')

  const categories = useMemo(() => {
    const values = new Set(products.map((product) => product.category).filter(Boolean))
    return ['All', ...Array.from(values)]
  }, [products])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const nextProducts = products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery)

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
        return left.name.localeCompare(right.name)
      }

      return 0
    })
  }, [products, query, selectedCategory, sortBy])

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#68806f]">Featured catalog</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Start selling from this product grid</h2>
        </div>
        <a href="/orders" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          View order history
        </a>
      </div>

      <div className="mb-8 grid gap-4 rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.08)] lg:grid-cols-[1.1fr_0.7fr_0.7fr_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, category, or description"
            className="w-full rounded-[18px] border border-[#d8d2c6] bg-[#fcfaf6] px-4 py-3 text-sm text-[#18261d] outline-none transition focus:border-[#68806f]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Category</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-[18px] border border-[#d8d2c6] bg-[#fcfaf6] px-4 py-3 text-sm text-[#18261d] outline-none transition focus:border-[#68806f]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#68806f]">Sort</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="w-full rounded-[18px] border border-[#d8d2c6] bg-[#fcfaf6] px-4 py-3 text-sm text-[#18261d] outline-none transition focus:border-[#68806f]"
          >
            <option value="featured">Featured first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </label>

        <div className="flex items-end">
          <div className="w-full rounded-[18px] bg-[#203126] px-4 py-3 text-sm font-semibold text-white">
            {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} found
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[28px] bg-white p-6 text-[#5d6a61] shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          No products matched your search. Try another keyword or switch the category filter.
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
