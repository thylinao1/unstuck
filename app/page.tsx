'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { TriageItem, TriageResponse } from '@/lib/types'
import { BrainDump } from '@/components/BrainDump'
import { Breath } from '@/components/Breath'
import { EffortSlider } from '@/components/EffortSlider'
import { FocusCard } from '@/components/FocusCard'
import { MomentumMeter } from '@/components/MomentumMeter'
import { OrganizedList } from '@/components/OrganizedList'
import { RemindMe } from '@/components/RemindMe'
import { SupportCard } from '@/components/SupportCard'
import { LearnPanel } from '@/components/LearnPanel'
import {
  clearNudge,
  fireNotification,
  loadNudge,
  nudgeTime,
  randomNudgeMessage,
  requestNudgePermission,
  scheduleNudge,
  type NudgeOption,
} from '@/lib/nudges'
import { clearSession, loadSession, saveSession, type StoredSession } from '@/lib/storage'
import { addCleared, loadStats } from '@/lib/stats'
import { DONE_PHRASES } from '@/lib/donePhrases'
import { randomPraise } from '@/lib/microPraise'
import { celebrateDone, celebrateStep } from '@/lib/celebrate'
import { clearCheckIn, loadDueCheckIn, recordCheckIn } from '@/lib/checkin'

// How long to hold the praise and confetti on a completed step before the next
// card slides in, so the two never collide. Longer than the praise fade.
const ADVANCE_BEAT_MS = 1500

// The praise line lands at one of the card's corners, never over the action text.
const PRAISE_POSITIONS: ReadonlyArray<CSSProperties> = [
  { top: '3%', left: '3%' },
  { top: '3%', right: '3%' },
  { bottom: '4%', left: '5%' },
  { bottom: '4%', right: '5%' },
]

// The effort slider starts low, so the first thing you see is the gentle step.
const DEFAULT_EFFORT = 0.18

type Mode = 'unstuck' | 'organized'

// Render a celebration line, giving the *marked* word the big animated treatment.
function renderDone(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    const marked = part.length > 2 && part.startsWith('*') && part.endsWith('*')
    return (
      <span key={i} className={marked ? 'done-em' : undefined}>
        {marked ? part.slice(1, -1) : part}
      </span>
    )
  })
}

// The user's local "now" as ISO with no zone, so the AI can resolve "3pm" and
// "Friday" into a real calendar time for the add-to-calendar feature.
function localNowIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function Home() {
  const [items, setItems] = useState<TriageItem[]>([])
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [effort, setEffort] = useState(DEFAULT_EFFORT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [support, setSupport] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [savedSession, setSavedSession] = useState<StoredSession | null>(null)
  const [lifetimeCleared, setLifetimeCleared] = useState(0)
  const [donePhrase, setDonePhrase] = useState(DONE_PHRASES[0])
  const [nudgeBanner, setNudgeBanner] = useState<string | null>(null)
  const [nudgeTick, setNudgeTick] = useState(0)
  const [doneToast, setDoneToast] = useState<{ text: string; n: number; pos: CSSProperties } | null>(
    null,
  )
  const [advancing, setAdvancing] = useState(false)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<Mode>('unstuck')
  const [showLearn, setShowLearn] = useState(false)
  const [checkInTask, setCheckInTask] = useState<string | null>(null)

  // Whether the last view change was an "advance" (new card) or a "pick" (effort
  // change), so a slider nudge doesn't yank focus out of the slider.
  const [lastAction, setLastAction] = useState<'advance' | 'pick'>('advance')

  // One-time hydration from localStorage (unavailable during SSR).
  useEffect(() => {
    const session = loadSession()
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    if (session && session.items.length > 0) setSavedSession(session)
    setLifetimeCleared(loadStats().cleared)
    setCheckInTask(loadDueCheckIn())
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Persist after every meaningful change. Never persist a crisis session.
  useEffect(() => {
    if (!hydrated || items.length === 0 || support) return
    saveSession({ items, doneIds, effort })
  }, [hydrated, items, doneIds, effort, support])

  // Gentle nudge: surface a due reminder on load; fire a scheduled one while open.
  useEffect(() => {
    if (!hydrated) return
    const nudge = loadNudge()
    if (!nudge) return
    const delay = nudge.at - Date.now()
    if (delay <= 0) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- surface a due reminder on load */
      setNudgeBanner(nudge.message)
      return
    }
    const id = setTimeout(() => {
      setNudgeBanner(nudge.message)
      fireNotification(nudge.message)
    }, Math.min(delay, 2_147_483_000))
    return () => clearTimeout(id)
  }, [hydrated, nudgeTick])

  // Don't leave a pending advance timer running if the component unmounts.
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  const doneSet = useMemo(() => new Set(doneIds), [doneIds])
  const remaining = useMemo(() => items.filter((it) => !doneSet.has(it.id)), [items, doneSet])

  // Surface the most important remaining item (one card at a time). The effort
  // slider sizes its step; it no longer changes which item shows.
  const current = useMemo(() => {
    if (remaining.length === 0) return null
    return [...remaining].sort((a, b) => b.priority - a.priority)[0]
  }, [remaining])

  // The current item offers 1 or 2 step sizes (tiny, plus a bigger one when the
  // AI generated one). The slider splits into that many bins; its position picks
  // the size, so every meaningful slide visibly changes the step.
  const bins = current ? 1 + (current.biggerAction ? 1 : 0) : 1
  const sizeIndex = Math.min(bins - 1, Math.floor(effort * bins))
  const showBigger = sizeIndex >= 1

  async function handleSubmit(text: string) {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainDump: text, now: localNowIso() }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Something went wrong. Try again.')
      }
      const data = (await res.json()) as TriageResponse
      const isCrisis = data.support ?? false
      if (data.items.length === 0 && !isCrisis) {
        setError('I could not find anything to act on. Try a few more words.')
        return
      }
      setLastAction('advance')
      setSupport(isCrisis)
      setItems(data.items)
      setDoneIds([])
      setSavedSession(null)
      // Remember the first thing you set out to do, for a gentle check-in later.
      if (!isCrisis && data.items[0]) recordCheckIn(data.items[0].title)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function resumeSession() {
    if (!savedSession) return
    setLastAction('advance')
    setItems(savedSession.items)
    setDoneIds(savedSession.doneIds ?? [])
    setEffort(savedSession.effort ?? DEFAULT_EFFORT)
    setSavedSession(null)
  }

  function completeCurrent() {
    if (!current || advancing) return
    const completedId = current.id

    if (remaining.length === 1) {
      setLastAction('advance')
      setDonePhrase(DONE_PHRASES[Math.floor(Math.random() * DONE_PHRASES.length)])
      setDoneIds((prev) => [...prev, completedId])
      setLifetimeCleared(addCleared(1))
      void celebrateDone()
      return
    }

    // Mid-flow: hold the card, play praise + a confetti pop, then advance.
    setLastAction('advance')
    setAdvancing(true)
    setDoneToast((prev) => ({
      text: randomPraise(),
      n: (prev?.n ?? 0) + 1,
      pos: PRAISE_POSITIONS[Math.floor(Math.random() * PRAISE_POSITIONS.length)],
    }))
    void celebrateStep()
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      setDoneIds((prev) => [...prev, completedId])
      setLifetimeCleared(addCleared(1))
      setDoneToast(null)
      setAdvancing(false)
      advanceTimer.current = null
    }, ADVANCE_BEAT_MS)
  }

  function skipCurrent() {
    if (!current || advancing) return
    setLastAction('advance')
    setItems((prev) => {
      const lowest = Math.min(...prev.map((p) => p.priority))
      return prev.map((p) => (p.id === current.id ? { ...p, priority: lowest - 1 } : p))
    })
  }

  // Organized mode: tick an item off (or back on) directly in the list.
  function toggleOrganized(id: string) {
    if (doneSet.has(id)) {
      setDoneIds((prev) => prev.filter((x) => x !== id))
      return
    }
    const next = [...doneIds, id]
    setLastAction('pick')
    setDoneIds(next)
    setLifetimeCleared(addCleared(1))
    if (next.length >= items.length) {
      setDonePhrase(DONE_PHRASES[Math.floor(Math.random() * DONE_PHRASES.length)])
      void celebrateDone()
    } else {
      void celebrateStep()
    }
  }

  function setEffortPicked(value: number) {
    setLastAction('pick')
    setEffort(value)
  }

  function reset() {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    setAdvancing(false)
    setDoneToast(null)
    clearSession()
    setItems([])
    setDoneIds([])
    setSupport(false)
    setError(null)
    setSavedSession(null)
    setMode('unstuck')
  }

  function dismissSupport() {
    setSupport(false)
  }

  function dismissCheckIn() {
    setCheckInTask(null)
    clearCheckIn()
  }

  async function handleRemind(option: NudgeOption) {
    await requestNudgePermission()
    scheduleNudge({ at: nudgeTime(option), message: randomNudgeMessage() })
    setNudgeTick((t) => t + 1)
  }

  const view: 'dump' | 'support' | 'focus' | 'done' = loading
    ? 'dump'
    : support
      ? 'support'
      : items.length === 0
        ? 'dump'
        : remaining.length === 0
          ? 'done'
          : 'focus'

  return (
    <main className="relative z-10 min-h-dvh w-full text-ink px-5 py-7 sm:py-10 flex flex-col">
      <header className="mx-auto w-full max-w-xl flex items-center justify-between">
        <span className="font-display text-lg text-ink inline-flex items-center gap-2">
          <span className="unstuck-mark" aria-hidden />
          Unstuck
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLearn(true)}
            aria-label="Why starting small works"
            className="text-faint transition hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18h6" />
              <path d="M10 21.5h4" />
              <path d="M12 2.5a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.3 2.2h4.6c.2-.9.7-1.7 1.3-2.2A6 6 0 0 0 12 2.5Z" />
            </svg>
          </button>
          {items.length > 0 && !loading && (
            <button onClick={reset} className="text-sm text-faint transition hover:text-ink">
              Start over
            </button>
          )}
        </div>
      </header>

      {checkInTask ? (
        <div
          role="status"
          className="rise mx-auto mt-3 flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent-soft/50 px-5 py-3 text-sm text-accent-deep"
        >
          <span>
            No rush. Last time you started &ldquo;{checkInTask}&rdquo;. How did it go?
          </span>
          <button
            type="button"
            onClick={dismissCheckIn}
            className="shrink-0 text-accent-deep/70 transition hover:text-accent-deep"
          >
            Okay
          </button>
        </div>
      ) : nudgeBanner ? (
        <div
          role="status"
          className="rise mx-auto mt-3 flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent-soft/60 px-5 py-3 text-sm text-accent-deep"
        >
          <span>{nudgeBanner}</span>
          <button
            type="button"
            onClick={() => {
              setNudgeBanner(null)
              clearNudge()
            }}
            className="shrink-0 text-accent-deep/70 transition hover:text-accent-deep"
            aria-label="Dismiss reminder"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {view === 'focus' && current
          ? `Next: ${showBigger ? current.biggerAction : current.nextAction}`
          : ''}
      </p>

      <div className="flex-1 flex flex-col items-center justify-center py-12">
        {loading && <Breath />}

        {!loading && view === 'dump' && (
          <BrainDump
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onResume={savedSession ? resumeSession : undefined}
          />
        )}

        {!loading && view === 'support' && (
          <SupportCard onContinue={items.length > 0 ? dismissSupport : undefined} onReset={reset} />
        )}

        {!loading && view === 'focus' && current && (
          <section className="rise relative w-full max-w-xl flex flex-col items-center gap-7">
            <div role="tablist" aria-label="View mode" className="inline-flex items-center gap-1 rounded-full border border-line bg-surface/70 p-1 text-sm">
              <button
                role="tab"
                aria-selected={mode === 'unstuck'}
                onClick={() => setMode('unstuck')}
                className={`rounded-full px-4 py-1.5 transition ${mode === 'unstuck' ? 'bg-ink text-canvas font-medium' : 'text-muted hover:text-ink'}`}
              >
                Unstuck
              </button>
              <button
                role="tab"
                aria-selected={mode === 'organized'}
                onClick={() => setMode('organized')}
                className={`rounded-full px-4 py-1.5 transition ${mode === 'organized' ? 'bg-ink text-canvas font-medium' : 'text-muted hover:text-ink'}`}
              >
                Organized
              </button>
            </div>

            {mode === 'unstuck' ? (
              <>
                {doneToast && (
                  <span
                    key={doneToast.n}
                    style={doneToast.pos}
                    className="micro-praise font-display text-xl text-accent-deep"
                  >
                    {doneToast.text}
                  </span>
                )}
                <EffortSlider value={effort} bins={bins} onChange={setEffortPicked} />
                <FocusCard
                  key={current.id}
                  item={current}
                  isBigger={showBigger}
                  hasBigger={bins >= 2}
                  focusOnMount={lastAction === 'advance'}
                  frozen={advancing}
                  onDone={completeCurrent}
                  onSkip={skipCurrent}
                />
                <MomentumMeter done={doneIds.length} total={items.length} />
                <RemindMe onRemind={handleRemind} />
              </>
            ) : (
              <>
                <OrganizedList items={items} doneIds={doneIds} onToggle={toggleOrganized} />
                <MomentumMeter done={doneIds.length} total={items.length} />
              </>
            )}
          </section>
        )}

        {!loading && view === 'done' && (
          <section className="rise w-full max-w-md text-center flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center">
              <span aria-hidden className="celebrate absolute h-24 w-24 rounded-full bg-accent-soft/60 blur-xl" />
              <span
                aria-hidden
                className="celebrate relative h-1.5 w-24 rounded-full bg-gradient-to-r from-accent to-accent-deep"
              />
            </div>
            <h2 className="font-display text-[2.6rem] sm:text-[3.1rem] leading-[1.12] text-ink text-balance">
              {renderDone(donePhrase)}
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Head cleared. {items.length} {items.length === 1 ? 'thing' : 'things'},
              one small step at a time.
            </p>
            {lifetimeCleared > 0 && (
              <p className="text-sm text-faint">
                {lifetimeCleared} {lifetimeCleared === 1 ? 'step' : 'steps'} cleared with
                Unstuck, and counting.
              </p>
            )}
            <button
              onClick={reset}
              className="rounded-full bg-accent px-7 py-4 text-base font-medium text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-deep active:scale-[0.99]"
            >
              Begin again
            </button>
          </section>
        )}
      </div>

      {showLearn && <LearnPanel onClose={() => setShowLearn(false)} />}

      <footer className="mx-auto w-full max-w-xl text-center text-xs text-faint/70">
        Unstuck · one small step at a time
      </footer>
    </main>
  )
}
