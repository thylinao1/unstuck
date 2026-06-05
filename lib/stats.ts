'use client'

// Calm, anti-anxiety gamification: a lifetime count of steps you have cleared.
// It only ever grows. No streaks to break, no points to chase, no leaderboards.
// Research on gamifying productivity is clear that competitive and loss-averse
// mechanics raise stress, which is the opposite of what this tool is for.

const KEY = 'unstuck:stats:v1'

interface Stats {
  cleared: number
}

export function loadStats(): Stats {
  if (typeof window === 'undefined') return { cleared: 0 }
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Stats>) : null
    return { cleared: typeof parsed?.cleared === 'number' ? parsed.cleared : 0 }
  } catch {
    return { cleared: 0 }
  }
}

/** Add to the lifetime count and return the new total. */
export function addCleared(n: number): number {
  const next = loadStats().cleared + n
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ cleared: next }))
    } catch {
      // non-fatal
    }
  }
  return next
}
