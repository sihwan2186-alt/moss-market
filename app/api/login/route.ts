import { NextRequest, NextResponse } from 'next/server'
import { authenticateCredentials } from '@/lib/credentials-auth'
import { applyNextAuthSession } from '@/lib/next-auth-session'
import { logServerError } from '@/lib/server-error'

type LoginBody = {
  email?: string
  password?: string
  loginMode?: 'customer' | 'admin'
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
    const user = await authenticateCredentials({ email, password, loginMode })

    if (!user) {
      return NextResponse.json({ message: 'The email or password is incorrect.' }, { status: 401 })
    }

    const response = NextResponse.json(
      {
        message:
          user.mode === 'local-fallback'
            ? 'Logged in successfully. The app is currently using local fallback mode.'
            : 'Logged in successfully.',
        mode: user.mode === 'local-fallback' ? user.mode : undefined,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    )

    await applyNextAuthSession(response, user)

    return response
  } catch (error) {
    logServerError('login', error)
    return NextResponse.json({ message: 'Login failed.' }, { status: 500 })
  }
}
