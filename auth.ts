import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authenticateCredentials } from '@/lib/credentials-auth'
import { logServerError } from '@/lib/server-error'

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
        loginMode: { label: 'Login Mode', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null
        }

        const email = String(credentials.email ?? '')
          .trim()
          .toLowerCase()
        const password = String(credentials.password ?? '').trim()
        const loginMode = String(credentials.loginMode ?? 'customer') === 'admin' ? 'admin' : 'customer'

        if (!email || !password) {
          return null
        }

        try {
          const user = await authenticateCredentials({ email, password, loginMode })

          if (!user) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          logServerError('auth:authorize', error)
          return null
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
