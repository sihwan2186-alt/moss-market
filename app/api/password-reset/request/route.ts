import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import PasswordResetToken from '@/db/models/password-reset-token'
import User from '@/db/models/user'
import { createSecureToken, hashToken } from '@/lib/auth'
import { createLocalPasswordResetToken, findLocalUserByEmail } from '@/lib/dev-user-store'

type PasswordResetRequestBody = {
  email?: string
}

const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function buildResetUrl(request: NextRequest, token: string) {
  return new URL(`/auth/reset-password?token=${token}`, request.nextUrl.origin).toString()
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PasswordResetRequestBody
  const email = body.email?.trim().toLowerCase() ?? ''

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ message: 'A valid email is required.' }, { status: 400 })
  }

  try {
    await dbConnect()
    const user = await User.findOne({ email }).lean()

    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists for that email, a reset link will be prepared.' },
        { status: 200 }
      )
    }

    const token = createSecureToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS)

    await PasswordResetToken.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } })
    await PasswordResetToken.create({
      userId: user._id,
      email: user.email,
      tokenHash,
      expiresAt,
    })

    return NextResponse.json(
      {
        message: 'Reset link created. Open the link below to choose a new password.',
        resetUrl: buildResetUrl(request, token),
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown password reset request error'

    if (!isConnectionError(message)) {
      return NextResponse.json({ message: 'Could not create a password reset link.', error: message }, { status: 500 })
    }

    const user = await findLocalUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        {
          message: 'If an account exists for that email, a reset link will be prepared.',
          mode: 'local-fallback',
        },
        { status: 200 }
      )
    }

    const token = createSecureToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString()

    await createLocalPasswordResetToken({
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt,
    })

    return NextResponse.json(
      {
        message: 'Reset link created. Open the link below to choose a new password.',
        resetUrl: buildResetUrl(request, token),
        mode: 'local-fallback',
      },
      { status: 200 }
    )
  }
}
