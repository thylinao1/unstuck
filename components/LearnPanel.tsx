'use client'

import { LEARN_NOTES } from '@/lib/learn'

interface LearnPanelProps {
  onClose: () => void
}

// A calm dialog of short, research-based notes on beating procrastination, opened
// from the small "Why this works" icon in the header.
export function LearnPanel({ onClose }: LearnPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/20 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Why starting small works"
        onClick={(e) => e.stopPropagation()}
        className="rise w-full max-w-md max-h-[82dvh] overflow-y-auto rounded-[1.5rem] bg-surface border border-line shadow-[var(--shadow-card)] p-6 flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl text-ink">Why starting small works</h2>
            <p className="text-sm text-faint">A few calm, research-backed nudges.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-faint transition hover:text-ink"
          >
            Close
          </button>
        </div>

        <ul className="flex flex-col gap-4">
          {LEARN_NOTES.map((note) => (
            <li key={note.title} className="flex flex-col gap-1">
              <h3 className="text-base font-medium text-ink">{note.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{note.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
