import { getErrorMessage } from '@/lib/server-error'

const DATABASE_UNAVAILABLE_PATTERNS = [
  'mongodb_uri is not defined',
  'querysrv',
  'econnrefused',
  'enotfound',
  'buffering timed out',
  'server selection timed out',
] as const

export function isDatabaseUnavailableError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return DATABASE_UNAVAILABLE_PATTERNS.some((pattern) => message.includes(pattern))
}
