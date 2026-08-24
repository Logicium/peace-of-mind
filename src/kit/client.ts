/**
 * The shared spine every kit data module sits on.
 *
 * Two rules it exists to enforce:
 *
 *  - Nothing here ever throws into the host site. A studio outage should cost a
 *    contact form its submit button, not take the whole page down with an
 *    unhandled rejection. Every call resolves to a KitResult and the caller
 *    decides what the visitor sees.
 *  - Nothing here waits forever. Render idles services to sleep, and a cold
 *    start can take thirty seconds; a fetch with no timeout turns that into a
 *    spinner that never stops.
 */

export type KitResult<T> = { ok: true; data: T } | { ok: false; error: string }

const TIMEOUT_MS = 10_000

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export async function kitFetch<T>(
  env: { siteKey: string; apiUrl: string },
  path: string,
  init?: RequestInit,
): Promise<KitResult<T>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${env.apiUrl}/api${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    })

    const payload = await res.json().catch(() => null)

    if (!res.ok || (payload && payload.success === false)) {
      // the server's own message when it wrote one, because "Email is required"
      // is worth showing and "Request failed with status 400" is not
      const message =
        (payload && (payload.message || payload.error)) ||
        (res.status === 429
          ? 'That is a few too many tries. Give it a minute.'
          : GENERIC_ERROR)
      return { ok: false, error: String(message) }
    }

    // same unwrap the portal's api.ts uses: envelope when there is one, the
    // body itself when there is not
    return { ok: true, data: (payload?.data ?? payload) as T }
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError'
    return {
      ok: false,
      error: aborted ? 'That took too long. Please try again.' : GENERIC_ERROR,
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fire-and-forget POST for counters.
 *
 * sendBeacon first so it survives the page being closed mid-navigation, which
 * is exactly when a view is most likely to be recorded. Identical shape to
 * analytics.ts, deliberately: two files doing the same job differently is how
 * one of them quietly stops working.
 */
export function kitBeacon(url: string, body: unknown): void {
  try {
    const payload = JSON.stringify(body ?? {})
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
      return
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  } catch {
    /* counters never throw */
  }
}
