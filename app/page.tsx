'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Energy, TriageItem, TriageResponse } from '@/lib/types'
import { BrainDump } from '@/components/BrainDump'
import { Breath } from '@/components/Breath'
import { EnergyPicker } from '@/components/EnergyPicker'
import { FocusCard } from '@/components/FocusCard'
import { MomentumMeter } from '@/components/MomentumMeter'
import { SupportCard } from '@/components/SupportCard'
import { clearSession, loadSession, saveSession, type StoredSession } from '@/lib/storage'

const ENERGY_RANK: Record<Energy, number> = { low: 0, med: 1, high: 2 }
// Energy is a protective ceiling: never surface something you're too drained
// for. Within what fits, urgency leads; matching the energy you picked only
// breaks ties, so a deadline is never buried under a lighter task.
function energyMatch(item: TriageItem, energy: Energy): number {
  return item.energy === energy ? 1 : 0
}

// The state-aware reason this card is the one, in plain calm language. This is
// what makes the matching legible instead of magic — the app surfaces a step
// AND tells you why it fits the moment you're in.
function fitLine(item: TriageItem, minutes: number, energy: Energy): string {
  const fits = item.minutes <= minutes && ENERGY_RANK[item.energy] <= ENERGY_RANK[energy]
  if (!fits) return 'A small stretch for right now, but the most unblocking thing left.'
  if (item.energy === energy && energy === 'high') return "You have the energy. A good moment to take this one on."
  if (item.energy === energy && energy === 'low') return 'Gentle enough for a low-energy moment, and it still moves things.'
  if (item.energy === 'low') return 'Light enough to begin right now, whatever your energy.'
  return `Fits the ${minutes} minutes and the energy you have right now.`
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
    setDoneIds((prev) => [...prev, current.id])
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
  }

  function dismissSupport() {
    setSupport(false)
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
          <button
            onClick={reset}
            className="text-sm text-faint transition hover:text-ink"
          >
            Start over
          </button>
        )}
      </header>

      {/* Screen-reader announcer: reads the surfaced action whenever it changes,
          including on a time/energy chip toggle that swaps the card. */}
      <p className="sr-only" aria-live="polite">
        {view === 'focus' && current ? `Next: ${current.nextAction}` : ''}
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
          <section className="rise w-full max-w-xl flex flex-col gap-8">
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
              reason={fitLine(current, minutes, energy)}
              focusOnMount={lastAction === 'advance'}
              onDone={completeCurrent}
              onSkip={skipCurrent}
            />
            <MomentumMeter done={doneIds.length} total={items.length} />
          </section>
        )}

        {!loading && view === 'done' && (
          <section className="rise w-full max-w-md text-center flex flex-col items-center gap-6">
            <div
              aria-hidden
              className="h-1.5 w-24 rounded-full bg-gradient-to-r from-accent to-accent-deep"
            />
            <h2 className="font-display text-4xl text-ink">Head cleared.</h2>
            <p className="text-muted text-lg leading-relaxed">
              {items.length} {items.length === 1 ? 'thing' : 'things'}, cleared one
              small step at a time. Momentum is only ever this, repeated.
            </p>
            <button
              onClick={reset}
              className="rounded-full bg-accent px-7 py-4 text-base font-medium text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-deep active:scale-[0.99]"
            >
              Begin again
            </button>
          </section>
        )}
      </div>

      <footer className="mx-auto w-full max-w-xl text-center text-xs text-faint/70">
        Unstuck · one small step at a time
      </footer>
    </main>
  )
}
