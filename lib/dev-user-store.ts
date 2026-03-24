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

const dataDir = path.join(process.cwd(), 'data')
const usersFile = path.join(dataDir, 'users.json')

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true })

  try {
    await fs.access(usersFile)
  } catch {
    await fs.writeFile(usersFile, '[]', 'utf8')
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
