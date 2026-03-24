import Image from 'next/image'
import ProductDetailActions from '@/components/ProductDetailActions'
import StoreHeader from '@/components/StoreHeader'
import { getProductByIdWithFallback } from '@/lib/store'
import Link from 'next/link'

type ProductDetailPageProps = {
  params: {
    id: string
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { product, source, error } = await getProductByIdWithFallback(params.id)

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
        <StoreHeader />
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
            <h1 className="text-3xl font-black">Product not found</h1>
            <p className="mt-4 text-[#5d6a61]">The requested product does not exist.</p>
            <Link href="/" className="mt-6 inline-block font-semibold text-[#1d3124] underline underline-offset-4">
              Back to shop
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#18261d]">
      <StoreHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/" className="text-sm font-semibold text-[#1d3124] underline underline-offset-4">
          Back to shop
        </Link>

        {source === 'fallback' && (
          <div className="mt-6 rounded-[24px] border border-[#d9c9b0] bg-[#fff6e9] p-4 text-sm text-[#6c5840]">
            MongoDB is not reachable right now, so this product detail is shown from fallback data.
            {error ? ` Error: ${error}` : ''}
          </div>
        )}

        <section className="mt-8 grid gap-8 rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.08)] lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="overflow-hidden rounded-[28px] bg-[#e8dfd2]">
            <Image
              src={product.images[0] ?? ''}
              alt={product.name}
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#68806f]">{product.category}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{product.name}</h1>
              <p className="mt-5 text-lg leading-8 text-[#4e5c52]">{product.description}</p>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-[24px] bg-[#f7f1e8] px-5 py-4">
                <span className="text-sm uppercase tracking-[0.2em] text-[#68806f]">Price</span>
                <strong className="text-2xl">${product.price}</strong>
              </div>
              <div className="flex items-center justify-between rounded-[24px] bg-[#f7f1e8] px-5 py-4">
                <span className="text-sm uppercase tracking-[0.2em] text-[#68806f]">Stock</span>
                <strong className="text-lg">{product.stock} available</strong>
              </div>
              <ProductDetailActions productId={String(product._id)} stock={product.stock} />
              <p className="text-sm text-[#5d6a61]">
                Tip: use the cart page to continue the test payment and order flow after adding products.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
