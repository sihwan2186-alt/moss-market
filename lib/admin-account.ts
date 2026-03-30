import User from '@/db/models/user'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { upsertLocalUser } from '@/lib/dev-user-store'

type AdminAccountConfig = {
  name: string
  email: string
  password: string
}

export function getAdminAccountConfig(): AdminAccountConfig | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD?.trim()
  const name = process.env.ADMIN_NAME?.trim() || 'Moss Market Admin'

  if (!email || !password) {
    return null
  }

  return {
    name,
    email,
    password,
  }
}

export function isConfiguredAdminEmail(email: string) {
  const adminConfig = getAdminAccountConfig()
  return Boolean(adminConfig && adminConfig.email === email.trim().toLowerCase())
}

export async function ensureConfiguredAdminUserInDatabase() {
  const adminConfig = getAdminAccountConfig()

  if (!adminConfig) {
    return null
  }

  const passwordHash = hashPassword(adminConfig.password)
  const existingUser = await User.findOne({ email: adminConfig.email })

  if (!existingUser) {
    return User.create({
      name: adminConfig.name,
      email: adminConfig.email,
      passwordHash,
      role: 'admin',
    })
  }

  let shouldSave = false

  if (existingUser.name !== adminConfig.name) {
    existingUser.name = adminConfig.name
    shouldSave = true
  }

  if (existingUser.role !== 'admin') {
    existingUser.role = 'admin'
    shouldSave = true
  }

  if (!verifyPassword(adminConfig.password, existingUser.passwordHash)) {
    existingUser.passwordHash = passwordHash
    shouldSave = true
  }

  if (shouldSave) {
    await existingUser.save()
  }

  return existingUser
}

export async function ensureConfiguredAdminUserInLocalStore() {
  const adminConfig = getAdminAccountConfig()

  if (!adminConfig) {
    return null
  }

  return upsertLocalUser({
    name: adminConfig.name,
    email: adminConfig.email,
    passwordHash: hashPassword(adminConfig.password),
    role: 'admin',
  })
}
