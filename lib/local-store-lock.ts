let localStoreQueue = Promise.resolve()

export async function withLocalStoreLock<T>(callback: () => Promise<T>) {
  const run = localStoreQueue.then(callback, callback)
  localStoreQueue = run.then(
    () => undefined,
    () => undefined
  )

  return run
}
