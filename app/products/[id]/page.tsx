import ProductDetailView from '@/components/ProductDetailView'
import { getProductByIdWithFallback } from '@/lib/store'

type ProductDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const { product, source } = await getProductByIdWithFallback(id)

  return (
    <ProductDetailView
      product={
        product
          ? {
              _id: String(product._id),
              name: product.name,
              description: product.description,
              price: product.price,
              images: product.images,
              stock: product.stock,
              category: product.category,
            }
          : null
      }
      source={source}
    />
  )
}
