import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'
import {
  ensureConfiguredAdminUserInDatabase,
  ensureConfiguredAdminUserInLocalStore,
  isConfiguredAdminEmail,
} from '@/lib/admin-account'
import { signAuthToken, verifyPassword } from '@/lib/auth'
import { findLocalUserByEmail } from '@/lib/dev-user-store'
import { getErrorMessage, logServerError } from '@/lib/server-error'

type LoginBody = {
  email?: string
  password?: string
  loginMode?: 'customer' | 'admin'
}

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const loginMode = body.loginMode === 'admin' ? 'admin' : 'customer'

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 })
  }

  try {
    await dbConnect()

    if (loginMode === 'admin' && isConfiguredAdminEmail(email)) {
      await ensureConfiguredAdminUserInDatabase()
    }

    const user = await User.findOne({ email })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ message: 'The email or password is incorrect.' }, { status: 401 })
    }

    if (loginMode === 'admin' && user.role !== 'admin') {
      return NextResponse.json({ message: 'The email or password is incorrect.' }, { status: 401 })
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      {
        message: 'Logged in successfully.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    )

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    const message = getErrorMessage(error)

    if (isConnectionError(message)) {
      if (loginMode === 'admin' && isConfiguredAdminEmail(email)) {
        await ensureConfiguredAdminUserInLocalStore()
      }

      const user = await findLocalUserByEmail(email)

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ message: 'The email or password is incorrect.' }, { status: 401 })
      }

      if (loginMode === 'admin' && user.role !== 'admin') {
        return NextResponse.json({ message: 'The email or password is incorrect.' }, { status: 401 })
      }

      const token = signAuthToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      const response = NextResponse.json(
        {
          message: 'Logged in successfully. The app is currently using local fallback mode.',
          mode: 'local-fallback',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 200 }
      )

      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      return response
    }

    logServerError('login', error)

    return NextResponse.json({ message: 'Login failed.' }, { status: 500 })
  }
}
