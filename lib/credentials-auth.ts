import dbConnect from '@/db/dbConnect'
import User from '@/db/models/user'
import {
  ensureConfiguredAdminUserInDatabase,
  ensureConfiguredAdminUserInLocalStore,
  isConfiguredAdminEmail,
} from '@/lib/admin-account'
import { verifyPassword } from '@/lib/auth'
import { isDatabaseUnavailableError } from '@/lib/database-error'
import { findLocalUserByEmail } from '@/lib/dev-user-store'

export type LoginMode = 'customer' | 'admin'

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: string
  mode: 'database' | 'local-fallback'
}

type AuthenticateCredentialsInput = {
  email: string
  password: string
  loginMode: LoginMode
}

export async function authenticateCredentials({
  email,
  password,
  loginMode,
}: AuthenticateCredentialsInput): Promise<AuthenticatedUser | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()

  if (!normalizedEmail || !normalizedPassword) {
    return null
  }

  try {
    await dbConnect()

    if (loginMode === 'admin' && isConfiguredAdminEmail(normalizedEmail)) {
      await ensureConfiguredAdminUserInDatabase()
    }

    const user = await User.findOne({ email: normalizedEmail }).lean()

    if (!user || !verifyPassword(normalizedPassword, user.passwordHash)) {
      return null
    }

    if (loginMode === 'admin' && user.role !== 'admin') {
      return null
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      mode: 'database',
    }
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error
    }

    if (loginMode === 'admin' && isConfiguredAdminEmail(normalizedEmail)) {
      await ensureConfiguredAdminUserInLocalStore()
    }

    const user = await findLocalUserByEmail(normalizedEmail)

    if (!user || !verifyPassword(normalizedPassword, user.passwordHash)) {
      return null
    }

    if (loginMode === 'admin' && user.role !== 'admin') {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mode: 'local-fallback',
    }
  }
}
