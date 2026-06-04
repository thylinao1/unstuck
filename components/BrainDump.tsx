'use client'

import { useState } from 'react'

interface BrainDumpProps {
  onSubmit: (text: string) => void
  loading: boolean
  error: string | null
}

const PLACEHOLDER = `reply to Dana about the invoice
book the dentist
that essay is due Friday and I haven't started
clean the kitchen
figure out the trip budget`

export function BrainDump({ onSubmit, loading, error }: BrainDumpProps) {
  const [text, setText] = useState('')
  const canSubmit = text.trim().length > 0 && !loading

  return (
    <section
      aria-labelledby="dump-heading"
      className="rise w-full max-w-xl mx-auto flex flex-col items-stretch gap-7"
    >
      <header className="text-center flex flex-col gap-4">
        <h1
          id="dump-heading"
          className="font-display text-[2.4rem] leading-[1.08] sm:text-6xl sm:leading-[1.04] text-ink tracking-[-0.01em] text-balance"
        >
          Overwhelm freezes you. One small step{' '}
          <em className="italic font-normal text-accent-deep">thaws</em> it.
        </h1>
        <p className="text-faint text-lg leading-relaxed">
          Empty the noise. What comes back is a single, doable beginning.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onSubmit(text.trim())
        }}
        className="flex flex-col gap-4"
      >
        <div className="rounded-[1.4rem] bg-surface border border-line shadow-[var(--shadow-soft)] transition focus-within:border-accent/55 focus-within:shadow-[var(--shadow-card)]">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={PLACEHOLDER}
            aria-label="Brain dump"
            className="w-full resize-none rounded-[1.4rem] bg-transparent px-6 py-5 text-ink text-lg leading-relaxed placeholder:text-faint/55 outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-accent-deep text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-medium transition ${
            canSubmit
              ? 'bg-accent text-white shadow-[var(--shadow-soft)] hover:bg-accent-deep active:scale-[0.99]'
              : 'border border-line text-faint cursor-not-allowed'
          }`}
        >
          {loading ? 'Finding your first step…' : 'Begin'}
          {!loading && (
            <span
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          )}
        </button>

        <p className="text-center text-sm text-faint/80">
          Messy is fine. One thought per line works best.
        </p>
      </form>
    </section>
  )
}
