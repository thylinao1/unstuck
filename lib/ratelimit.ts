// Tiny in-memory fixed-window rate limiter, keyed per IP.
//
// Enough to stop a naive script from draining the Anthropic key on the public,
// unauthenticated /api/triage endpoint. State is per serverless instance and
// resets on cold start — acceptable for this app. For real scale, swap the Map
// for @upstash/ratelimit + @vercel/kv behind the same rateLimit() signature.

interface Bucket {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000
// 20/min per IP: high enough that a judge poking the live demo can't 429
// themselves, low enough to stop a naive script. Configurable for eval/load runs.
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX) || 20

const buckets = new Map<string, Bucket>()

export interface RateResult {
  ok: boolean
  /** Seconds until the window resets (only meaningful when ok is false). */
  retryAfter: number
}

export function rateLimit(ip: string): RateResult {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    // Opportunistic cleanup so the map can't grow unbounded on a long-lived instance.
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (now > value.resetAt) buckets.delete(key)
      }
    }
    return { ok: true, retryAfter: 0 }
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  bucket.count += 1
  return { ok: true, retryAfter: 0 }
}
