'use client'

import { useEffect, useRef } from 'react'
import type { TriageItem } from '@/lib/types'

interface FocusCardProps {
  item: TriageItem
  fits: boolean
  /** Plain-language reason this step fits the current time + energy. */
  reason: string
  /** Move keyboard focus here on mount (true when advancing to a new card,
   *  false on a time/energy chip change so focus isn't yanked out of the picker). */
  focusOnMount: boolean
  onDone: () => void
  onSkip: () => void
}

const ENERGY_LABEL: Record<TriageItem['energy'], string> = {
  low: 'low energy',
  med: 'medium energy',
  high: 'high energy',
}

export function FocusCard({ item, fits, reason, focusOnMount, onDone, onSkip }: FocusCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Mount only: the card remounts per surfaced action (keyed by id in the
    // parent), so this lands focus on the new step for keyboard users.
    if (focusOnMount) headingRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <article className="unstuck-card relative w-full rounded-[1.75rem] bg-surface border border-line shadow-[var(--shadow-card)] px-7 py-9 sm:px-10 sm:py-12 flex flex-col gap-6">
      <div className="flex items-center gap-2.5 text-xs uppercase tracking-[0.2em] text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        From your dump
      </div>
      <p className="-mt-2 text-base text-muted">{item.title}</p>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[1.7rem] leading-snug sm:text-[2rem] text-ink text-balance outline-none"
      >
        {item.nextAction}
      </h2>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted tabular-nums">
          {item.minutes} min
        </span>
        <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted">
          {ENERGY_LABEL[item.energy]}
        </span>
        {!fits && (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-deep">
            a stretch for right now
          </span>
        )}
      </div>

      <p className="-mt-1 text-sm text-faint italic">{reason}</p>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-full bg-accent px-6 py-4 text-base font-medium text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-deep active:scale-[0.99]"
        >
          Done
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-line px-5 py-4 text-base font-medium text-muted transition hover:text-ink hover:border-ink/25"
        >
          Not now
        </button>
      </div>
    </article>
  )
}
