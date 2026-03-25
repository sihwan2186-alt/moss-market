import { promises as fs } from 'fs'
import crypto from 'crypto'
import path from 'path'

export type LocalUser = {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'customer' | 'admin'
  createdAt: string
  updatedAt: string
}

export type LocalPasswordResetToken = {
  id: string
  userId: string
  email: string
  tokenHash: string
  expiresAt: string
  usedAt: string | null
  createdAt: string
  updatedAt: string
}

const dataDir = path.join(process.cwd(), 'data')
const usersFile = path.join(dataDir, 'users.json')
const resetTokensFile = path.join(dataDir, 'password-reset-tokens.json')

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true })

  try {
    await fs.access(usersFile)
  } catch {
    await fs.writeFile(usersFile, '[]', 'utf8')
  }

  try {
    await fs.access(resetTokensFile)
  } catch {
    await fs.writeFile(resetTokensFile, '[]', 'utf8')
  }
}

export async function readLocalUsers() {
  await ensureStore()
  const raw = await fs.readFile(usersFile, 'utf8')

  try {
    return JSON.parse(raw) as LocalUser[]
  } catch {
    return []
  }
}

export async function findLocalUserByEmail(email: string) {
  const users = await readLocalUsers()
  return users.find((user) => user.email === email) ?? null
}

export async function findLocalUserById(userId: string) {
  const users = await readLocalUsers()
  return users.find((user) => user.id === userId) ?? null
}

export async function createLocalUser(input: Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>) {
  const users = await readLocalUsers()
  const now = new Date().toISOString()

  const user: LocalUser = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...input,
  }

  users.push(user)
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8')

  return user
}

export async function updateLocalUserPassword(userId: string, passwordHash: string) {
  const users = await readLocalUsers()
  const user = users.find((entry) => entry.id === userId)

  if (!user) {
    return null
  }

  user.passwordHash = passwordHash
  user.updatedAt = new Date().toISOString()
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8')

  return user
}

export async function readLocalPasswordResetTokens() {
  await ensureStore()
  const raw = await fs.readFile(resetTokensFile, 'utf8')

  try {
    return JSON.parse(raw) as LocalPasswordResetToken[]
  } catch {
    return []
  }
}

export async function createLocalPasswordResetToken(
  input: Pick<LocalPasswordResetToken, 'userId' | 'email' | 'tokenHash' | 'expiresAt'>
) {
  const tokens = await readLocalPasswordResetTokens()
  const now = new Date().toISOString()
  const nextTokens = tokens.map((token) =>
    token.userId === input.userId && token.usedAt === null ? { ...token, usedAt: now, updatedAt: now } : token
  )

  const token: LocalPasswordResetToken = {
    id: crypto.randomUUID(),
    usedAt: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  }

  nextTokens.unshift(token)
  await fs.writeFile(resetTokensFile, JSON.stringify(nextTokens, null, 2), 'utf8')

  return token
}

export async function findLocalPasswordResetTokenByHash(tokenHash: string) {
  const tokens = await readLocalPasswordResetTokens()
  const now = Date.now()

  return (
    tokens.find(
      (token) => token.tokenHash === tokenHash && token.usedAt === null && new Date(token.expiresAt).getTime() > now
    ) ?? null
  )
}

export async function markLocalPasswordResetTokenUsed(tokenId: string) {
  const tokens = await readLocalPasswordResetTokens()
  const token = tokens.find((entry) => entry.id === tokenId)

  if (!token) {
    return null
  }

  token.usedAt = new Date().toISOString()
  token.updatedAt = token.usedAt
  await fs.writeFile(resetTokensFile, JSON.stringify(tokens, null, 2), 'utf8')

  return token
}
