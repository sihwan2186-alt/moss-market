import { NextRequest, NextResponse } from 'next/server'
import { isConfiguredAdminEmail } from '@/lib/admin-account'
import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'
import { hashPassword } from '@/lib/auth'
import { isDatabaseUnavailableError } from '@/lib/database-error'
import { createLocalUser, findLocalUserByEmail } from '@/lib/dev-user-store'
import { logServerError } from '@/lib/server-error'

type SignUpBody = {
  name?: string
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SignUpBody
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()

  if (!name || !email || !password) {
    return NextResponse.json({ message: 'Name, email, and password are required.' }, { status: 400 })
  }

  if (isConfiguredAdminEmail(email)) {
    return NextResponse.json({ message: 'This email is reserved for the administrator account.' }, { status: 403 })
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 })
  }

  try {
    await dbConnect()

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return NextResponse.json({ message: 'This email is already registered.' }, { status: 409 })
    }

    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
      role: 'customer',
    })

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const existingLocalUser = await findLocalUserByEmail(email)

      if (existingLocalUser) {
        return NextResponse.json(
          {
            message: 'This email is already registered.',
            mode: 'local-fallback',
          },
          { status: 409 }
        )
      }

      const localUser = await createLocalUser({
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'customer',
      })

      return NextResponse.json(
        {
          message: 'Account created successfully. The app is currently using local fallback mode.',
          mode: 'local-fallback',
          user: {
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            role: localUser.role,
          },
        },
        { status: 201 }
      )
    }

    logServerError('signup', error)

    return NextResponse.json({ message: 'Sign up failed.' }, { status: 500 })
  }
}
