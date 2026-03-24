import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      user,
    },
    { status: 200 }
  )
}
