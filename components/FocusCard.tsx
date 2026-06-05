'use client'

import { useEffect, useRef } from 'react'
import type { TriageItem } from '@/lib/types'

interface FocusCardProps {
  item: TriageItem
  fits: boolean
  /** Show the pre-generated bigger step (the user has energy and time). */
  isBigger: boolean
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

export function FocusCard({ item, fits, isBigger, focusOnMount, onDone, onSkip }: FocusCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The picker swaps between the tiny first step and the pre-generated bigger one.
  const showBig = isBigger && Boolean(item.biggerAction)
  const action = showBig ? (item.biggerAction as string) : item.nextAction
  const mins = showBig ? (item.biggerMinutes ?? item.minutes) : item.minutes
  const why = showBig ? (item.biggerWhy ?? item.why) : item.why

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
        {action}
      </h2>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted tabular-nums">
          {mins} min
        </span>
        {showBig ? (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-deep">
            a bigger move, you have the energy
          </span>
        ) : (
          <>
            <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted">
              {ENERGY_LABEL[item.energy]}
            </span>
            {!fits && (
              <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-deep">
                a stretch for right now
              </span>
            )}
          </>
        )}
      </div>

      {why && (
        <div className="-mt-1 flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.18em] text-faint">Why this?</p>
          <p className="text-sm text-muted leading-relaxed">{why}</p>
        </div>
      )}

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
