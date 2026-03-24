import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    {
      message: 'Use the NextAuth signOut client flow for logout.',
    },
    { status: 200 }
  )

  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
