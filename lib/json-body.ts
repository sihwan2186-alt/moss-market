export async function parseOptionalJsonBody<T>(request: Request): Promise<T | null> {
  const contentType = request.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  const raw = await request.text()

  if (!raw.trim()) {
    return null
  }

  return JSON.parse(raw) as T
}
