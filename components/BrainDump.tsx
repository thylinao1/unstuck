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
      className="w-full max-w-xl mx-auto flex flex-col items-stretch gap-6"
    >
      <header className="text-center flex flex-col gap-3">
        <h1
          id="dump-heading"
          className="font-display text-4xl sm:text-5xl text-ink leading-tight tracking-tight text-balance"
        >
          Overwhelm freezes you. One small step thaws it.
        </h1>
        <p className="text-muted text-lg">
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
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={PLACEHOLDER}
          aria-label="Brain dump"
          className="w-full resize-none rounded-2xl bg-surface border border-line px-5 py-4 text-ink text-lg leading-relaxed shadow-sm placeholder:text-muted/50 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
        />

        {error && (
          <p role="alert" className="text-sm text-accent text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white shadow-sm transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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

        <p className="text-center text-sm text-muted/80">
          Messy is fine. One thought per line works best.
        </p>
      </form>
    </section>
  )
}
