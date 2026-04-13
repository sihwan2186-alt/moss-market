import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'

type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7
const LEGACY_AUTH_COOKIE = 'auth_token'

function shouldUseSecureCookies() {
  const nextAuthUrl = process.env.NEXTAUTH_URL

  return nextAuthUrl?.startsWith('https://') ?? Boolean(process.env.VERCEL)
}

function getSessionCookieName() {
  return shouldUseSecureCookies() ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
}

function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: shouldUseSecureCookies(),
    path: '/',
    maxAge,
  }
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.JWT_SECRET

  if (!secret) {
    throw new Error('AUTH_SECRET or JWT_SECRET is not defined. Add it to your environment configuration first.')
  }

  return secret
}

export async function applyNextAuthSession(response: NextResponse, user: SessionUser) {
  const sessionToken = await encode({
    secret: getAuthSecret(),
    maxAge: SESSION_MAX_AGE,
    token: {
      sub: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })

  response.cookies.set({
    name: getSessionCookieName(),
    value: sessionToken,
    ...getSessionCookieOptions(SESSION_MAX_AGE),
  })
}

export function clearAuthSessionCookies(response: NextResponse) {
  for (const name of [LEGACY_AUTH_COOKIE, 'next-auth.session-token', '__Secure-next-auth.session-token']) {
    response.cookies.set({
      name,
      value: '',
      ...getSessionCookieOptions(0),
      secure: name.startsWith('__Secure-') ? true : shouldUseSecureCookies(),
    })
  }
}
