const LOCAL_PRODUCT_IMAGE_PREFIX = '/uploads/products/'

export function shouldBypassProductImageOptimization(imageUrl: string) {
  return imageUrl.startsWith(LOCAL_PRODUCT_IMAGE_PREFIX)
}
