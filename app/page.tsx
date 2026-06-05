'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Energy, TriageItem, TriageResponse } from '@/lib/types'
import { BrainDump } from '@/components/BrainDump'
import { Breath } from '@/components/Breath'
import { Burst } from '@/components/Burst'
import { EnergyPicker } from '@/components/EnergyPicker'
import { FocusCard } from '@/components/FocusCard'
import { MomentumMeter } from '@/components/MomentumMeter'
import { RemindMe } from '@/components/RemindMe'
import { SupportCard } from '@/components/SupportCard'
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

const ENERGY_RANK: Record<Energy, number> = { low: 0, med: 1, high: 2 }
// Energy is a protective ceiling: never surface something you're too drained
// for. Within what fits, urgency leads; matching the energy you picked only
// breaks ties, so a deadline is never buried under a lighter task.
function energyMatch(item: TriageItem, energy: Energy): number {
  return item.energy === energy ? 1 : 0
}

export default function Home() {
  const [items, setItems] = useState<TriageItem[]>([])
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [minutes, setMinutes] = useState(15)
  const [energy, setEnergy] = useState<Energy>('med')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [support, setSupport] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [savedSession, setSavedSession] = useState<StoredSession | null>(null)
  const [lifetimeCleared, setLifetimeCleared] = useState(0)
  const [donePhrase, setDonePhrase] = useState(DONE_PHRASES[0])
  const [nudgeBanner, setNudgeBanner] = useState<string | null>(null)
  const [nudgeTick, setNudgeTick] = useState(0)
  const [burst, setBurst] = useState(0)
  const [doneToast, setDoneToast] = useState<{ text: string; n: number } | null>(null)
  const [showList, setShowList] = useState(false)

  // Whether the last view change was an "advance" (new card to act on) or a
  // "pick" (time/energy toggle) — drives whether focus moves to the new card,
  // so a chip toggle doesn't yank focus out of the picker.
  const [lastAction, setLastAction] = useState<'advance' | 'pick'>('advance')

  // Detect a previous session on mount, but DON'T auto-jump into it — the hero
  // (which carries the whole pitch) always shows first; resume is opt-in.
  useEffect(() => {
    const session = loadSession()
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage, which is unavailable during SSR */
    if (session && session.items.length > 0) setSavedSession(session)
    setLifetimeCleared(loadStats().cleared)
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Persist after every meaningful change (once hydrated, and only with real
  // data). Never persist a crisis session: there should be nothing to silently
  // resume into that would skip the support card on a later visit.
  useEffect(() => {
    if (!hydrated || items.length === 0 || support) return
    saveSession({ items, doneIds, minutes, energy })
  }, [hydrated, items, doneIds, minutes, energy, support])

  // Gentle nudge: surface a due reminder on load; if one is scheduled for the
  // future, fire it at its time while the tab stays open. The reminder is only
  // cleared when the user dismisses it (so a missed one is not lost), which also
  // keeps this effect idempotent and safe under dev double-invoke.
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

  // Clear the floating praise line shortly after it appears.
  useEffect(() => {
    if (!doneToast) return
    const id = setTimeout(() => setDoneToast(null), 1400)
    return () => clearTimeout(id)
  }, [doneToast])

  const doneSet = useMemo(() => new Set(doneIds), [doneIds])
  const remaining = useMemo(
    () => items.filter((it) => !doneSet.has(it.id)),
    [items, doneSet],
  )

  // Surface the most fitting next step for the time + energy you have right now.
  // Energy is a hard ceiling (never something you're too drained for); within
  // what fits, rank by urgency plus an energy-match nudge. If nothing fits, still
  // offer the top remaining item so the screen is never blank.
  const current = useMemo(() => {
    if (remaining.length === 0) return null
    const affordable = remaining.filter(
      (it) => it.minutes <= minutes && ENERGY_RANK[it.energy] <= ENERGY_RANK[energy],
    )
    const pool = affordable.length > 0 ? affordable : remaining
    return [...pool].sort(
      (a, b) => b.priority - a.priority || energyMatch(b, energy) - energyMatch(a, energy),
    )[0]
  }, [remaining, minutes, energy])

  const currentFits = current
    ? current.minutes <= minutes && ENERGY_RANK[current.energy] <= ENERGY_RANK[energy]
    : true

  // When you have real energy and time, swap in the bigger step the AI already
  // pre-generated. Instant, client-side, no extra API call. High energy needs
  // 15+ min; medium needs the full 30, so the picker visibly does something.
  const showBigger = current
    ? Boolean(current.biggerAction) &&
      ((energy === 'high' && minutes >= 15) || (energy === 'med' && minutes >= 30))
    : false

  async function handleSubmit(text: string) {
    if (loading) return // guard against a fast double-submit
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainDump: text, minutes, energy }),
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
    setMinutes(savedSession.minutes ?? 15)
    setEnergy(savedSession.energy ?? 'med')
    setSavedSession(null)
  }

  function completeCurrent() {
    if (!current) return
    setLastAction('advance')
    setBurst((b) => b + 1) // a little spark burst on each completed step
    if (remaining.length === 1) {
      // Last one: go to the big celebration screen.
      setDonePhrase(DONE_PHRASES[Math.floor(Math.random() * DONE_PHRASES.length)])
    } else {
      // Mid-flow: a brief praise line floats up in the middle.
      setDoneToast((prev) => ({ text: randomPraise(), n: (prev?.n ?? 0) + 1 }))
    }
    setDoneIds((prev) => [...prev, current.id])
    setLifetimeCleared(addCleared(1)) // calm gamification: a count that only grows
  }

  function skipCurrent() {
    if (!current) return
    setLastAction('advance')
    // Push this card to the back by dropping its priority below the rest.
    setItems((prev) => {
      const lowest = Math.min(...prev.map((p) => p.priority))
      return prev.map((p) =>
        p.id === current.id ? { ...p, priority: lowest - 1 } : p,
      )
    })
  }

  function setMinutesPicked(m: number) {
    setLastAction('pick')
    setMinutes(m)
  }

  function setEnergyPicked(e: Energy) {
    setLastAction('pick')
    setEnergy(e)
  }

  function reset() {
    clearSession()
    setItems([])
    setDoneIds([])
    setSupport(false)
    setError(null)
    setSavedSession(null)
    setShowList(false)
  }

  function dismissSupport() {
    setSupport(false)
  }

  async function handleRemind(option: NudgeOption) {
    await requestNudgePermission() // opt-in; the on-reopen line works regardless
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
        {items.length > 0 && !loading && (
          <div className="flex items-center gap-4">
            {view === 'focus' && (
              <button
                onClick={() => setShowList(true)}
                className="text-sm text-faint transition hover:text-ink"
              >
                See all
              </button>
            )}
            <button onClick={reset} className="text-sm text-faint transition hover:text-ink">
              Start over
            </button>
          </div>
        )}
      </header>

      {nudgeBanner && (
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
      )}

      {/* Screen-reader announcer: reads the surfaced action whenever it changes,
          including on a time/energy chip toggle that swaps the card. */}
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
          <section className="rise relative w-full max-w-xl flex flex-col gap-8">
            <Burst trigger={burst} />
            {doneToast && (
              <span key={doneToast.n} className="micro-praise font-display text-xl text-accent-deep">
                {doneToast.text}
              </span>
            )}
            <EnergyPicker
              minutes={minutes}
              energy={energy}
              onMinutes={setMinutesPicked}
              onEnergy={setEnergyPicked}
            />
            {/* key forces a fresh entrance animation per surfaced action */}
            <FocusCard
              key={current.id}
              item={current}
              fits={currentFits}
              isBigger={showBigger}
              focusOnMount={lastAction === 'advance'}
              onDone={completeCurrent}
              onSkip={skipCurrent}
            />
            <MomentumMeter done={doneIds.length} total={items.length} />
            <RemindMe onRemind={handleRemind} />
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

      {showList && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/20 px-4 py-6"
          onClick={() => setShowList(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Your task list"
            onClick={(e) => e.stopPropagation()}
            className="rise w-full max-w-md max-h-[80dvh] overflow-y-auto rounded-[1.5rem] bg-surface border border-line shadow-[var(--shadow-card)] p-6 flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Your list</h2>
              <span className="text-sm text-faint tabular-nums">
                {doneIds.length} of {items.length} done
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {items.map((it) => {
                const isDone = doneSet.has(it.id)
                return (
                  <li key={it.id} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${isDone ? 'bg-accent border-accent' : 'border-line'}`}
                    />
                    <span
                      className={`text-base leading-snug ${isDone ? 'text-faint line-through' : 'text-ink'}`}
                    >
                      {it.title}
                    </span>
                  </li>
                )
              })}
            </ul>
            <button
              onClick={() => setShowList(false)}
              className="mx-auto rounded-full border border-line px-6 py-2.5 text-sm font-medium text-muted transition hover:text-ink hover:border-ink/25"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <footer className="mx-auto w-full max-w-xl text-center text-xs text-faint/70">
        Unstuck · one small step at a time
      </footer>
    </main>
  )
}
