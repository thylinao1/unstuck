'use client'

import { useEffect } from 'react'
import { clearSession } from '@/lib/storage'

// Segment error boundary. A bad/stale localStorage blob or any render throw
// lands here instead of a blank white screen, and clearing the session is always
// one click away (the most common cause + cure).

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[unstuck] render error', error)
  }, [error])

  return (
    <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center gap-6 px-5 text-center">
      <div
        aria-hidden
        className="h-1.5 w-16 rounded-full bg-gradient-to-r from-accent to-accent-deep"
      />
      <h2 className="font-display text-3xl text-ink">Something slipped.</h2>
      <p className="text-muted text-lg max-w-sm leading-relaxed">
        A small hiccup on our end. Starting fresh usually clears it.
      </p>
      <button
        onClick={() => {
          clearSession()
          reset()
        }}
        className="rounded-full bg-accent px-7 py-4 text-base font-medium text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-deep active:scale-[0.99]"
      >
        Start fresh
      </button>
    </main>
  )
}
