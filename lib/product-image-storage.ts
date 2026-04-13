import 'server-only'

import { del, put } from '@vercel/blob'
import { promises as fs } from 'fs'
import path from 'path'

const LOCAL_PRODUCT_IMAGE_PREFIX = '/uploads/products/'
const BLOB_HOST_SUFFIX = '.blob.vercel-storage.com'

function getLocalUploadDir() {
  return path.join(process.cwd(), 'public', 'uploads', 'products')
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

export function isBlobStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function isBlobProductImageUrl(imageUrl: string) {
  try {
    return new URL(imageUrl).hostname.endsWith(BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}

export async function storeProductImage(file: File, filename: string) {
  if (isBlobStorageConfigured()) {
    const blob = await put(`products/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return blob.url
  }

  if (isProductionRuntime()) {
    throw new Error('Production image uploads require Vercel Blob. Set BLOB_READ_WRITE_TOKEN first.')
  }

  const uploadDir = getLocalUploadDir()
  const filePath = path.join(uploadDir, filename)
  const bytes = new Uint8Array(await file.arrayBuffer())

  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(filePath, bytes)

  return `${LOCAL_PRODUCT_IMAGE_PREFIX}${filename}`
}

export async function removeStoredProductImages(imageUrls: string[]) {
  if (!isBlobStorageConfigured()) {
    return
  }

  const blobUrls = imageUrls.filter(isBlobProductImageUrl)

  if (blobUrls.length === 0) {
    return
  }

  await del(blobUrls)
}
