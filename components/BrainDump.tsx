'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
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
// How tall the input may grow before it starts scrolling (about six lines).
const INPUT_MAX_HEIGHT = 168

// Structural classes per emphasis token. Color is resolved separately (see
// heroColor) so composed treatments like "u blue" or "u sm" pick one sensible
// color instead of fighting over Tailwind text-color utilities.
const HERO_STRUCT: Record<string, string> = {
  u: 'underline decoration-[3px] underline-offset-[6px] decoration-accent/40',
  i: 'italic',
  down: 'inline-block translate-y-[0.16em]',
  up: 'inline-block -translate-y-[0.18em]',
  sm: 'text-[0.62em]',
  xs: 'text-[0.45em]',
  xxs: 'text-[0.3em] opacity-50',
  blur: 'inline-block text-ink/85 blur-[2px]',
  caps: 'uppercase tracking-[0.04em]',
  gap: 'ml-[1.1em]',
  drip: 'hero-drip',
  glass: 'hero-glass',
  script: 'hero-script',
}

// One color wins, by priority, unless a treatment paints itself (blur/drip/glass).
function heroColor(tokens: Set<string>): string {
  if (tokens.has('blur') || tokens.has('drip') || tokens.has('glass')) return ''
  if (tokens.has('blue')) return 'text-hero-blue'
  if (tokens.has('red')) return 'text-hero-red'
  if (tokens.has('u') || tokens.has('i') || tokens.has('down') || tokens.has('up')) {
    return 'text-accent-deep'
  }
  if (tokens.has('sm') || tokens.has('xs') || tokens.has('xxs')) return 'text-muted'
  return '' // caps / gap alone inherit the ink color
}

function heroClasses(raw: string): string {
  const tokens = new Set(raw.trim().split(/\s+/))
  const classes: string[] = []
  const color = heroColor(tokens)
  if (color) classes.push(color)
  for (const token of tokens) {
    if (HERO_STRUCT[token]) classes.push(HERO_STRUCT[token])
  }
  return classes.join(' ')
}

// Render a hero phrase, acting out the words. Emphasis is [text](treatments);
// see lib/heroPhrases.ts for the treatment vocabulary.
function renderPhrase(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let key = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>)
    }
    parts.push(
      <span key={key++} className={heroClasses(match[2])}>
        {match[1]}
      </span>,
    )
    last = re.lastIndex
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>)
  return parts
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

  const {
    supported: voiceSupported,
    listening,
    interim,
    error: dictationError,
    toggle,
    stop,
  } = useDictation((finalText) =>
    setText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')} ${finalText}` : finalText)),
  )

  // What you say appears IN the box: the committed text plus the live phrase.
  const display = listening && interim ? `${text}${text ? ' ' : ''}${interim}` : text

  // Grow the box with its content and keep the newest line in view, so dictated
  // or typed text that wraps slides up on its own instead of making the user
  // scroll the field by hand.
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)}px`
    el.scrollTop = el.scrollHeight
  }, [display])

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

        {dictationError && (
          <p role="alert" className="text-center text-sm text-accent-deep">
            {dictationError}
          </p>
        )}

        {/* Flex-centered wrapper so a single line of text (or the placeholder)
            sits vertically centered in the box rather than riding high, which is
            what a bare rows=1 textarea does. The textarea sizes to its content. */}
        <div className="dump-glow flex min-h-[3.5rem] items-center rounded-[1.3rem] bg-surface border border-line px-5 transition focus-within:border-accent/60">
          <textarea
            ref={inputRef}
            value={display}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            maxLength={MAX}
            placeholder="What's on your mind?"
            aria-label="Brain dump"
            className="block w-full resize-none overflow-y-auto bg-transparent py-2 text-ink text-base leading-normal placeholder:text-faint/60 outline-none"
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
