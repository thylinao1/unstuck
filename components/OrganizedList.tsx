'use client'

import type { TriageItem } from '@/lib/types'
import { addToCalendar, canAddToCalendar, formatEventTime } from '@/lib/calendar'

interface OrganizedListProps {
  items: TriageItem[]
  doneIds: string[]
  onToggle: (id: string) => void
}

// "Organized mode": the whole cleaned-up list at once, each item shown as its
// fluent next step with a check to tick it off. Claude has already rewritten a
// messy or non-fluent dump into clear, plain steps, so this view reads easily.
export function OrganizedList({ items, doneIds, onToggle }: OrganizedListProps) {
  const done = new Set(doneIds)
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {items.map((item) => {
        const isDone = done.has(item.id)
        const hasEvent = canAddToCalendar(item)
        return (
          <div
            key={item.id}
            className={`flex items-start gap-4 rounded-2xl border bg-surface px-5 py-4 transition ${
              isDone ? 'border-line opacity-70' : 'border-line shadow-[var(--shadow-soft)]'
            }`}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={isDone}
              aria-label={isDone ? `Mark "${item.title}" not done` : `Mark "${item.title}" done`}
              onClick={() => onToggle(item.id)}
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                isDone ? 'border-accent bg-accent text-white' : 'border-line hover:border-accent/60'
              }`}
            >
              {isDone && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12l5 5L20 6" />
                </svg>
              )}
            </button>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate text-xs uppercase tracking-[0.16em] text-faint">{item.title}</p>
              <p className={`text-base leading-snug ${isDone ? 'text-faint line-through' : 'text-ink'}`}>
                {item.nextAction}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted">
                <span className="tabular-nums">{item.minutes} min</span>
                {hasEvent && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{formatEventTime(item.eventStart as string)}</span>
                    <button
                      type="button"
                      onClick={() => addToCalendar(item)}
                      className="rounded-full border border-accent/40 px-2.5 py-0.5 text-accent-deep transition hover:bg-accent-soft/60"
                    >
                      Add to calendar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
