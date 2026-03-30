import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import PasswordResetToken from '@/db/models/password-reset-token'
import User from '@/db/models/user'
import { hashPassword, hashToken } from '@/lib/auth'
import {
  findLocalPasswordResetTokenByHash,
  markLocalPasswordResetTokenUsed,
  updateLocalUserPassword,
} from '@/lib/dev-user-store'
import { getErrorMessage, logServerError } from '@/lib/server-error'

type PasswordResetConfirmBody = {
  token?: string
  password?: string
}

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

function getTokenHash(token?: string | null) {
  const normalizedToken = token?.trim() ?? ''
  return normalizedToken ? hashToken(normalizedToken) : ''
}

function getInvalidTokenResponse() {
  return NextResponse.json({ message: 'This reset link is invalid or has expired.' }, { status: 400 })
}

export async function GET(request: NextRequest) {
  const tokenHash = getTokenHash(request.nextUrl.searchParams.get('token'))

  if (!tokenHash) {
    return getInvalidTokenResponse()
  }

  try {
    await dbConnect()
    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean()

    if (!resetToken) {
      return getInvalidTokenResponse()
    }

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (!isConnectionError(message)) {
      logServerError('password-reset:validate', error)
      return NextResponse.json({ message: 'Could not validate the reset token.' }, { status: 500 })
    }

    const resetToken = await findLocalPasswordResetTokenByHash(tokenHash)

    if (!resetToken) {
      return getInvalidTokenResponse()
    }

    return NextResponse.json({ valid: true, mode: 'local-fallback' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PasswordResetConfirmBody
  const tokenHash = getTokenHash(body.token)
  const password = body.password?.trim() ?? ''

  if (!tokenHash) {
    return getInvalidTokenResponse()
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 })
  }

  try {
    await dbConnect()

    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })

    if (!resetToken) {
      return getInvalidTokenResponse()
    }

    await User.findByIdAndUpdate(resetToken.userId, {
      $set: {
        passwordHash: hashPassword(password),
      },
    })

    resetToken.usedAt = new Date()
    await resetToken.save()

    return NextResponse.json({ message: 'Password reset complete. You can now log in.' }, { status: 200 })
  } catch (error) {
    const message = getErrorMessage(error)

    if (!isConnectionError(message)) {
      logServerError('password-reset:confirm', error)
      return NextResponse.json({ message: 'Could not reset the password.' }, { status: 500 })
    }

    const resetToken = await findLocalPasswordResetTokenByHash(tokenHash)

    if (!resetToken) {
      return getInvalidTokenResponse()
    }

    await updateLocalUserPassword(resetToken.userId, hashPassword(password))
    await markLocalPasswordResetTokenUsed(resetToken.id)

    return NextResponse.json(
      { message: 'Password reset complete. You can now log in.', mode: 'local-fallback' },
      { status: 200 }
    )
  }
}
