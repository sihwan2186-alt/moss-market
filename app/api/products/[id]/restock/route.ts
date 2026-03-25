import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import Product from '@/db/models/product'
import RestockSubscription from '@/db/models/restock-subscription'
import {
  createLocalRestockSubscription,
  findLocalProductById,
  findPendingLocalRestockSubscription,
} from '@/lib/dev-store'
import { parseOptionalJsonBody } from '@/lib/json-body'
import { getAuthUser } from '@/lib/session'

type RestockBody = {
  email?: string
}

const FALLBACK_PRODUCT_LOOKUP = 'FALLBACK_PRODUCT_LOOKUP'

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase() ?? ''
  return value.length > 0 ? value : ''
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authUser = await getAuthUser()
  const body = await parseOptionalJsonBody<RestockBody>(request)
  const email = normalizeEmail(body?.email ?? authUser?.email ?? '')

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: 'A valid email is required for restock alerts.' }, { status: 400 })
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(FALLBACK_PRODUCT_LOOKUP)
    }

    await dbConnect()
    const product = await Product.findById(id).lean()

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    if (product.stock > 0) {
      return NextResponse.json({ message: 'This product is already in stock.' }, { status: 400 })
    }

    const existing = await RestockSubscription.findOne({ productId: id, email, status: 'pending' }).lean()

    if (existing) {
      return NextResponse.json({ message: 'A restock alert is already active for this email.' }, { status: 200 })
    }

    await RestockSubscription.create({
      productId: id,
      email,
      userId: authUser?.userId && mongoose.Types.ObjectId.isValid(authUser.userId) ? authUser.userId : undefined,
      status: 'pending',
    })

    return NextResponse.json({ message: 'Restock alert created.' }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown restock subscription error'

    if (message !== FALLBACK_PRODUCT_LOOKUP && !isConnectionError(message)) {
      return NextResponse.json({ message: 'Could not create a restock alert.', error: message }, { status: 500 })
    }

    const product = await findLocalProductById(id)

    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
    }

    if (product.stock > 0) {
      return NextResponse.json({ message: 'This product is already in stock.' }, { status: 400 })
    }

    const existing = await findPendingLocalRestockSubscription(id, email)

    if (existing) {
      return NextResponse.json(
        { message: 'A restock alert is already active for this email.', mode: 'local-fallback' },
        { status: 200 }
      )
    }

    await createLocalRestockSubscription({
      productId: id,
      email,
      userId: authUser?.userId ?? null,
    })

    return NextResponse.json({ message: 'Restock alert created.', mode: 'local-fallback' }, { status: 201 })
  }
}
