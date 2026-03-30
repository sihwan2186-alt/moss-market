export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown server error'
}

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error)
}
