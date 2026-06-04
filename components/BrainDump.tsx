'use client'

import { useState } from 'react'
import { useDictation } from './useDictation'

interface BrainDumpProps {
  onSubmit: (text: string) => void
  loading: boolean
  error: string | null
  /** Present when a recent session can be resumed (opt-in, hero stays first). */
  onResume?: () => void
}

const MAX = 8000

const PLACEHOLDER = `reply to Dana about the invoice
book the dentist
that essay is due Friday and I haven't started
clean the kitchen
figure out the trip budget`

export function BrainDump({ onSubmit, loading, error, onResume }: BrainDumpProps) {
  const [text, setText] = useState('')
  const hasText = text.trim().length > 0
  const canSubmit = hasText && !loading

  const { supported: voiceSupported, listening, interim, toggle, stop } = useDictation(
    (finalText) =>
      setText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')} ${finalText}` : finalText)),
  )

  return (
    <section
      aria-labelledby="dump-heading"
      className="rise w-full max-w-xl mx-auto flex flex-col items-stretch gap-7"
    >
      <header className="text-center flex flex-col gap-4">
        <p className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-faint">
          <span className="unstuck-mark" aria-hidden />
          An anti-freeze engine
        </p>
        <h1
          id="dump-heading"
          className="font-display text-[2.4rem] leading-[1.08] sm:text-6xl sm:leading-[1.04] text-ink tracking-[-0.01em] text-balance"
        >
          Overwhelm freezes you. One small step{' '}
          <em className="italic font-normal text-accent-deep">thaws</em> it.
        </h1>
        <p className="text-faint text-lg leading-relaxed text-balance">
          Empty the noise. What comes back is a single, doable beginning.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          stop()
          if (canSubmit) onSubmit(text.trim())
        }}
        className="flex flex-col gap-4"
      >
        <div className="relative">
          {/* the "pile in your head": faint cards stacked behind the input */}
          <div aria-hidden className="dump-ghost dump-ghost-2" />
          <div aria-hidden className="dump-ghost dump-ghost-1" />
          <div className="relative z-[1] rounded-[1.4rem] bg-surface border border-line shadow-[var(--shadow-soft)] transition focus-within:border-accent/55 focus-within:shadow-[var(--shadow-card)]">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={MAX}
              placeholder={PLACEHOLDER}
              aria-label="Brain dump"
              className="w-full resize-none rounded-[1.4rem] bg-transparent px-6 py-5 text-ink text-lg leading-relaxed placeholder:text-faint/55 outline-none"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-accent-deep text-center">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggle}
              aria-pressed={listening}
              aria-label={listening ? 'Stop voice input' : 'Speak instead of typing'}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                listening
                  ? 'border-accent bg-accent-soft text-accent-deep'
                  : 'border-line text-muted hover:text-ink hover:border-ink/25'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
                className={listening ? 'mic-pulse' : ''}
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="21.5" />
              </svg>
              {listening ? 'Listening' : 'Speak'}
            </button>
          )}
          <p id="dump-hint" className="text-sm text-faint/80">
            {listening
              ? interim || 'Say what is on your mind.'
              : voiceSupported
                ? 'Messy is fine. Type or speak, one thought per line.'
                : 'Messy is fine. One thought per line works best.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-describedby="dump-hint"
          className={`group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-medium transition ${
            hasText
              ? `bg-accent text-white shadow-[var(--shadow-soft)] ${loading ? 'cursor-wait opacity-90' : 'hover:bg-accent-deep active:scale-[0.99]'}`
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

        {onResume && (
          <button
            type="button"
            onClick={onResume}
            className="mx-auto text-sm text-accent-deep underline-offset-4 transition hover:underline"
          >
            Resume where you left off →
          </button>
        )}
      </form>
    </section>
  )
}
