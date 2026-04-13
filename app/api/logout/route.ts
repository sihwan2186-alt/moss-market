import { NextResponse } from 'next/server'
import { clearAuthSessionCookies } from '@/lib/next-auth-session'

export async function POST() {
  const response = NextResponse.json(
    {
      message: 'Logged out successfully.',
    },
    { status: 200 }
  )

  clearAuthSessionCookies(response)

  return response
}
