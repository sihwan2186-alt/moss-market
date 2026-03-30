import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const HASH_KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, HASH_KEY_LENGTH).toString('hex')

  return `${salt}:${derivedKey}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')

  if (!salt || !originalHash) {
    return false
  }

  const derivedKey = crypto.scryptSync(password, salt, HASH_KEY_LENGTH).toString('hex')
  const originalBuffer = Uint8Array.from(Buffer.from(originalHash, 'hex'))
  const derivedBuffer = Uint8Array.from(Buffer.from(derivedKey, 'hex'))

  if (originalBuffer.length !== derivedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(originalBuffer, derivedBuffer)
}

export function signAuthToken(payload: { userId: string; email: string; role: string }) {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not defined. Add it to your .env.local file.')
  }

  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function createSecureToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
