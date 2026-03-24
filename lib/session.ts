import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export type AuthPayload = {
  userId: string
  email: string
  role: string
}

export async function getAuthUser(): Promise<AuthPayload | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.email) {
    return null
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role ?? 'customer',
  }
}
