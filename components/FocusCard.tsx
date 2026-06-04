'use client'

import type { TriageItem } from '@/lib/types'

interface FocusCardProps {
  item: TriageItem
  fits: boolean
  onDone: () => void
  onSkip: () => void
}

const ENERGY_LABEL: Record<TriageItem['energy'], string> = {
  low: 'low energy',
  med: 'medium energy',
  high: 'high energy',
}

export function FocusCard({ item, fits, onDone, onSkip }: FocusCardProps) {
  return (
    <article
      // keyed by id in the parent so a fresh card animates in on each change
      className="unstuck-card relative w-full rounded-3xl bg-surface border border-line shadow-[0_24px_64px_-28px_rgba(60,40,20,0.4)] px-7 py-9 sm:px-9 sm:py-11 flex flex-col gap-6"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-muted/80">
        From your dump
      </p>
      <p className="-mt-3 text-base text-muted">{item.title}</p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink leading-snug text-balance">
        {item.nextAction}
      </h2>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted">
          ⏱ {item.minutes} min
        </span>
        <span className="rounded-full bg-canvas border border-line px-3 py-1 text-muted">
          {ENERGY_LABEL[item.energy]}
        </span>
        {!fits && (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-accent">
            a stretch for right now
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-full bg-accent px-6 py-3.5 text-base font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
        >
          Done&nbsp;✓
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full px-5 py-3.5 text-base font-medium text-muted transition hover:text-ink"
        >
          Not now
        </button>
      </div>
    </article>
  )
}
