'use client'

import { useEffect, useState } from 'react'
import { useDictation } from './useDictation'
import { HERO_PHRASES } from '@/lib/heroPhrases'

interface BrainDumpProps {
  onSubmit: (text: string) => void
  loading: boolean
  error: string | null
  /** Present when a recent session can be resumed (opt-in, hero stays first). */
  onResume?: () => void
}

const MAX = 8000

const PLACEHOLDER = `reply to Dana about the invoice
the essay is due Friday
figure out the trip budget`

// Render a hero phrase, giving the *marked* word an accent underline.
function renderPhrase(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    const marked = part.length > 2 && part.startsWith('*') && part.endsWith('*')
    return (
      <span
        key={i}
        className={
          marked
            ? 'text-accent-deep underline decoration-[3px] underline-offset-[6px] decoration-accent/40'
            : undefined
        }
      >
        {marked ? part.slice(1, -1) : part}
      </span>
    )
  })
}

export function BrainDump({ onSubmit, loading, error, onResume }: BrainDumpProps) {
  const [text, setText] = useState('')
  const hasText = text.trim().length > 0
  const canSubmit = hasText && !loading

  // A different hero line on each open. Render a stable default first (SSR and
  // first client paint), then swap to a random one after mount — the swap is
  // hidden under the section's entrance animation.
  const [phrase, setPhrase] = useState(HERO_PHRASES[0])
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- random per-open, client-only to avoid a hydration mismatch */
    setPhrase(HERO_PHRASES[Math.floor(Math.random() * HERO_PHRASES.length)])
  }, [])

  const { supported: voiceSupported, listening, interim, toggle, stop } = useDictation(
    (finalText) =>
      setText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')} ${finalText}` : finalText)),
  )

  return (
    <section
      aria-labelledby="dump-heading"
      className="rise w-full max-w-xl mx-auto flex flex-col items-stretch gap-8"
    >
      <h1
        id="dump-heading"
        className="font-display text-[1.8rem] leading-[1.18] sm:text-[2.5rem] sm:leading-[1.14] text-ink tracking-[-0.01em] text-balance text-center"
      >
        {renderPhrase(phrase)}
      </h1>

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
          <div className="dump-glow relative z-[1] rounded-[1.3rem] bg-surface border border-line transition focus-within:border-accent/60">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={MAX}
              placeholder={PLACEHOLDER}
              aria-label="Brain dump"
              className="w-full resize-none rounded-[1.3rem] bg-transparent px-5 py-4 text-ink text-base leading-relaxed placeholder:text-faint/55 outline-none"
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
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-base font-medium transition ${
                listening
                  ? 'border-accent bg-accent-soft text-accent-deep'
                  : 'speak-glow border-accent/30 bg-accent-soft/50 text-accent-deep hover:bg-accent-soft'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
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
            {listening ? interim || 'Say what is on your mind.' : 'Messy is fine.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-describedby="dump-hint"
          className={`group inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-5 text-lg font-medium transition ${
            hasText
              ? `bg-accent text-white shadow-[var(--shadow-card)] ${loading ? 'cursor-wait opacity-90' : 'hover:bg-accent-deep active:scale-[0.99]'}`
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
