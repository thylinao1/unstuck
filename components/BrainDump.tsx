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

// Render a hero phrase so the type acts out the words. Markers:
//   *word* accent underline · _word_ drops below the line · ^word^ lifts above
//   ~word~ is set smaller · %word% is blurred (for "noise", "fog", "chaos")
function renderPhrase(text: string) {
  return text.split(/(\*[^*]+\*|_[^_]+_|\^[^^]+\^|~[^~]+~|%[^%]+%)/g).map((part, i) => {
    if (part.length > 2) {
      const inner = part.slice(1, -1)
      const mark = part[0]
      if (mark === '*')
        return (
          <span
            key={i}
            className="text-accent-deep underline decoration-[3px] underline-offset-[6px] decoration-accent/40"
          >
            {inner}
          </span>
        )
      if (mark === '_')
        return (
          <span key={i} className="inline-block translate-y-[0.16em] text-accent-deep">
            {inner}
          </span>
        )
      if (mark === '^')
        return (
          <span key={i} className="inline-block -translate-y-[0.18em] text-accent-deep">
            {inner}
          </span>
        )
      if (mark === '~')
        return (
          <span key={i} className="text-[0.62em] text-muted">
            {inner}
          </span>
        )
      if (mark === '%')
        return (
          <span key={i} className="inline-block text-ink/85 blur-[2px]">
            {inner}
          </span>
        )
    }
    return <span key={i}>{part}</span>
  })
}

export function BrainDump({ onSubmit, loading, error, onResume }: BrainDumpProps) {
  const [text, setText] = useState('')
  const hasText = text.trim().length > 0
  const canSubmit = hasText && !loading

  // A different hero line on each open. Render a stable default first (SSR and
  // first client paint), then swap to a random one after mount.
  const [phrase, setPhrase] = useState(HERO_PHRASES[0])
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- random per-open, client-only to avoid a hydration mismatch */
    setPhrase(HERO_PHRASES[Math.floor(Math.random() * HERO_PHRASES.length)])
  }, [])

  const { supported: voiceSupported, listening, interim, toggle, stop } = useDictation(
    (finalText) =>
      setText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')} ${finalText}` : finalText)),
  )

  // What you say appears IN the box: the committed text plus the live phrase.
  const display = listening && interim ? `${text}${text ? ' ' : ''}${interim}` : text

  return (
    <section
      aria-labelledby="dump-heading"
      className="rise w-full max-w-xl mx-auto flex flex-col items-stretch gap-8"
    >
      <h1
        id="dump-heading"
        className="font-display text-[1.9rem] leading-[1.2] sm:text-[2.6rem] sm:leading-[1.16] text-ink tracking-[-0.01em] text-balance text-center"
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
        {/* Voice is the primary, easiest way in: a big round button, centred. */}
        {voiceSupported && (
          <div className="flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={listening}
              aria-label={listening ? 'Stop voice input' : 'Speak instead of typing'}
              className={`flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border-2 transition active:scale-[0.97] ${
                listening
                  ? 'border-accent bg-accent text-white'
                  : 'speak-glow border-accent/40 bg-accent-soft/70 text-accent-deep hover:bg-accent-soft'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
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
            </button>
            <span className="text-sm font-medium text-accent-deep">
              {listening ? 'Listening…' : 'Speak'}
            </span>
          </div>
        )}

        <div className="dump-glow rounded-[1.3rem] bg-surface border border-line transition focus-within:border-accent/60">
          <textarea
            value={display}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            maxLength={MAX}
            placeholder="What's on your mind?"
            aria-label="Brain dump"
            className="w-full resize-none rounded-[1.3rem] bg-transparent px-5 py-3.5 text-ink text-base leading-relaxed placeholder:text-faint/60 outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-accent-deep text-center">
            {error}
          </p>
        )}

        <p id="dump-hint" className="text-center text-sm text-faint/80">
          {listening ? 'Listening…' : 'Type or speak. Messy is fine.'}
        </p>

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
            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
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
