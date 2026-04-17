export class FetchTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    this.name = 'FetchTimeoutError'
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const external = init.signal

  if (external) {
    if (external.aborted) {
      controller.abort(external.reason)
    } else {
      external.addEventListener('abort', () => controller.abort(external.reason), { once: true })
    }
  }

  const timer = setTimeout(() => {
    controller.abort(new FetchTimeoutError(timeoutMs))
  }, timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted && controller.signal.reason instanceof FetchTimeoutError) {
      throw controller.signal.reason
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
