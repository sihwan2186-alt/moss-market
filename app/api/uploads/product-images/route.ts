import path from 'path'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { storeProductImage } from '@/lib/product-image-storage'
import { getAuthUser } from '@/lib/session'

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
}
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function getSafeExtension(file: File) {
  const extensionFromName = path.extname(file.name).toLowerCase()

  if (ALLOWED_IMAGE_EXTENSIONS.has(extensionFromName)) {
    return extensionFromName
  }

  return MIME_EXTENSION_MAP[file.type] ?? ''
}

export async function POST(request: Request) {
  const authUser = await getAuthUser()

  if (!authUser) {
    return NextResponse.json({ message: 'Please log in first.' }, { status: 401 })
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ message: 'Please select at least one image file.' }, { status: 400 })
  }

  const imagePaths: string[] = []

  for (const file of files) {
    const safeExtension = getSafeExtension(file)

    if (!file.type.startsWith('image/') || !safeExtension) {
      return NextResponse.json({ message: 'Only JPG, PNG, WEBP, GIF, and AVIF images are supported.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ message: 'Each image must be 10MB or smaller.' }, { status: 400 })
    }

    const filename = `${Date.now()}-${randomUUID()}${safeExtension}`

    try {
      imagePaths.push(await storeProductImage(file, filename))
    } catch (error) {
      return NextResponse.json(
        {
          message: error instanceof Error ? error.message : 'Failed to store product images.',
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ images: imagePaths }, { status: 201 })
}
