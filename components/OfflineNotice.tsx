'use client'

import { useState } from 'react'

// A small, unobtrusive "!" in the header. On the public demo the live AI is
// switched off to keep it free, so this quietly explains that and points anyone
// who wants the full thing to an email. Hidden unless NEXT_PUBLIC_OFFLINE_DEMO=1.
export function OfflineNotice() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="About this demo"
        className="grid h-6 w-6 place-items-center rounded-full border border-faint/50 text-[0.7rem] font-semibold text-faint transition hover:border-ink/40 hover:text-ink"
      >
        !
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/20 px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="About this demo"
            onClick={(e) => e.stopPropagation()}
            className="rise w-full max-w-sm rounded-[1.5rem] bg-surface border border-line shadow-[var(--shadow-card)] p-6 flex flex-col gap-3 text-left"
          >
            <h2 className="font-display text-xl text-ink">About this demo</h2>
            <p className="text-sm text-muted leading-relaxed">
              The live AI is switched off for this public demo to keep it free, so you are
              seeing the offline version with simpler, pre-set suggestions. The full AI is
              what the video shows.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              To try the full live version, just reach out:
            </p>
            <a
              href="mailto:mthylinao@gmail.com"
              className="text-sm font-medium text-accent-deep underline-offset-4 hover:underline"
            >
              mthylinao@gmail.com
            </a>
            <button
              onClick={() => setOpen(false)}
              className="mx-auto mt-2 rounded-full border border-line px-6 py-2.5 text-sm font-medium text-muted transition hover:text-ink hover:border-ink/25"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
