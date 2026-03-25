import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'
import { verifyPassword } from '@/lib/auth'
import { findLocalUserByEmail } from '@/lib/dev-user-store'

function isConnectionError(message: string) {
  return (
    message.includes('querySrv') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('buffering timed out')
  )
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.JWT_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null
        }

        const email = String(credentials.email ?? '')
          .trim()
          .toLowerCase()
        const password = String(credentials.password ?? '').trim()

        if (!email || !password) {
          return null
        }

        try {
          await dbConnect()
          const user = await User.findOne({ email })

          if (!user || !verifyPassword(password, user.passwordHash)) {
            return null
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown auth error'

          if (!isConnectionError(message)) {
            return null
          }

          const user = await findLocalUserByEmail(email)

          if (!user || !verifyPassword(password, user.passwordHash)) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.name = user.name ?? undefined
        token.email = user.email ?? undefined
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? '')
        session.user.role = String(token.role ?? 'customer')
        session.user.name = String(token.name ?? '')
        session.user.email = String(token.email ?? '')
      }

      return session
    },
  },
}
