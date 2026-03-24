import ProductCatalog from '@/components/ProductCatalog'
import StoreHeader from '@/components/StoreHeader'
import { getProductsWithFallback } from '@/lib/store'

export default async function Home() {
  const { products, source, error } = await getProductsWithFallback()
  const catalogProducts = products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.images[0] ?? '',
    category: product.category,
    stock: product.stock,
  }))

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="grid gap-8 rounded-[40px] bg-[radial-gradient(circle_at_top_left,_rgba(108,148,123,0.35),_transparent_38%),linear-gradient(135deg,_#efe5d6_0%,_#f8f2ea_48%,_#e4ecdf_100%)] p-8 shadow-[0_25px_80px_rgba(23,31,26,0.08)] lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#577363]">Curated Everyday Goods</p>
            <h1 className="mt-4 max-w-xl text-5xl font-black leading-[1.02] tracking-tight text-[#152117]">
              Build your shop faster with a real MongoDB-backed storefront.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#49584c]">
              This starter now includes customer signup, login, product listing, cart storage, checkout, and order
              history endpoints so you can keep building from a working base instead of a blank screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/auth?type=sign-up"
                className="rounded-full bg-[#1d3124] px-6 py-3 text-sm font-semibold text-white"
              >
                Create account
              </a>
              <a
                href="/cart"
                className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
              >
                Open cart
              </a>
              <a
                href="/health"
                className="rounded-full border border-[#1d3124] px-6 py-3 text-sm font-semibold text-[#1d3124]"
              >
                Health check
              </a>
            </div>
          </div>
          <div className="grid gap-4 rounded-[28px] bg-[#203126] p-6 text-[#f5efe3]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#b8c9bc]">Included now</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#edf2ec]">
                <li>MongoDB connection and seed products</li>
                <li>Signup, login, and logout API routes</li>
                <li>Cart and order creation endpoints</li>
                <li>Starter shop, cart, and orders pages</li>
              </ul>
            </div>
            <div className="rounded-[24px] bg-[#f0e7d8] p-5 text-[#152117]">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#56715e]">Next build step</p>
              <p className="mt-3 text-sm leading-6">
                Replace the demo checkout with your payment provider, then connect deployment secrets in Vercel.
              </p>
            </div>
          </div>
        </section>

        {source === 'fallback' && (
          <div className="mt-12 rounded-[24px] border border-[#d9c9b0] bg-[#fff6e9] p-4 text-sm text-[#6c5840]">
            MongoDB is not reachable right now, so sample products are being shown instead.
            {error ? ` Error: ${error}` : ''}
          </div>
        )}

        <ProductCatalog products={catalogProducts} />
      </main>
    </div>
  )
}
