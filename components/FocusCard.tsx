'use client'

import { useEffect, useRef } from 'react'
import type { TriageItem } from '@/lib/types'
import { addToCalendar, canAddToCalendar, formatEventTime } from '@/lib/calendar'

interface FocusCardProps {
  item: TriageItem
  /** Show the pre-generated bigger step (the effort slider is in its upper bin). */
  isBigger: boolean
  /** Whether a bigger step exists at all, so the hint can invite sliding for more. */
  hasBigger: boolean
  /** Move keyboard focus here on mount (true when advancing to a new card, false
   *  on an effort-slider change so focus is not yanked out of the slider). */
  focusOnMount: boolean
  /** True during the beat after this step is completed: the card is held and
   *  dimmed, its actions disabled, while the praise and confetti play out. */
  frozen: boolean
  onDone: () => void
  onSkip: () => void
}

// How demanding the STEP is (not how much effort you have), as a small tag.
const DEMAND_LABEL: Record<TriageItem['energy'], string> = {
  low: 'easy',
  med: 'moderate',
  high: 'demanding',
}

export function FocusCard({
  item,
  isBigger,
  hasBigger,
  focusOnMount,
  frozen,
  onDone,
  onSkip,
}: FocusCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The effort slider swaps between the tiny first step and the bigger one.
  const showBig = isBigger && Boolean(item.biggerAction)
  const action = showBig ? (item.biggerAction as string) : item.nextAction
  const mins = showBig ? (item.biggerMinutes ?? item.minutes) : item.minutes
  const why = showBig ? (item.biggerWhy ?? item.why) : item.why
  const calibration = showBig
    ? 'A bigger move, for when you have more in you.'
    : hasBigger
      ? 'A gentle first step. Slide right when you have more.'
      : 'The smallest possible first step.'
  const hasEvent = canAddToCalendar(item)

  useEffect(() => {
    // Mount only: the card remounts per surfaced action (keyed by id in the
    // parent), so this lands focus on the new step for keyboard users.
    if (focusOnMount) headingRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <article
      aria-busy={frozen}
      className={`unstuck-card relative w-full rounded-[1.75rem] bg-surface border border-line shadow-[var(--shadow-card)] px-7 py-9 sm:px-10 sm:py-12 flex flex-col gap-6 transition-opacity duration-300 ${
        frozen ? 'opacity-50' : 'opacity-100'
      }`}
    >
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
          <span className="rounded-full bg-accent-soft px-3 py-1 text-accent-deep">a bigger move</span>
        ) : (
          <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted">
            {DEMAND_LABEL[item.energy]}
          </span>
        )}
      </div>

      <div className="-mt-1 flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.18em] text-faint">Why this?</p>
        {why && <p className="text-sm text-muted leading-relaxed">{why}</p>}
        {/* Keyed by the chosen size so it re-fades when the effort slider flips it. */}
        <p key={showBig ? 'big' : 'small'} className="value-pop text-sm text-muted leading-relaxed">
          {calibration}
        </p>
      </div>

      {hasEvent && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-canvas/60 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-faint">Scheduled</span>
            <span className="text-sm text-muted">
              {item.eventTitle ? `${item.eventTitle} · ` : ''}
              {formatEventTime(item.eventStart as string)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => addToCalendar(item)}
            disabled={frozen}
            className="ml-auto rounded-full border border-accent/40 bg-accent-soft/60 px-4 py-2 text-sm font-medium text-accent-deep transition hover:bg-accent-soft disabled:opacity-60"
          >
            Add to calendar
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          disabled={frozen}
          className="flex-1 rounded-full bg-accent px-6 py-4 text-base font-medium text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-deep active:scale-[0.99] disabled:cursor-default disabled:hover:bg-accent"
        >
          Done
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={frozen}
          className="rounded-full border border-line px-5 py-4 text-base font-medium text-muted transition hover:text-ink hover:border-ink/25 disabled:cursor-default disabled:hover:text-muted disabled:hover:border-line"
        >
          Not now
        </button>
      </div>
    </article>
  )
}
