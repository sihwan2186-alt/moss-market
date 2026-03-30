import HomePageContent from '@/components/HomePageContent'
import { getAuthUser } from '@/lib/session'
import { getProductsWithFallback } from '@/lib/store'

export default async function Home() {
  const authUser = await getAuthUser()
  const { products, source } = await getProductsWithFallback()
  const catalogProducts = products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.images[0] ?? '',
    category: product.category,
    stock: product.stock,
  }))

  return <HomePageContent products={catalogProducts} source={source} isLoggedIn={Boolean(authUser)} />
}
