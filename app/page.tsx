'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Energy, TriageItem, TriageResponse } from '@/lib/types'
import { BrainDump } from '@/components/BrainDump'
import { EnergyPicker } from '@/components/EnergyPicker'
import { FocusCard } from '@/components/FocusCard'
import { MomentumMeter } from '@/components/MomentumMeter'
import { clearSession, loadSession, saveSession } from '@/lib/storage'

const ENERGY_RANK: Record<Energy, number> = { low: 0, med: 1, high: 2 }

export default function Home() {
  const [items, setItems] = useState<TriageItem[]>([])
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [minutes, setMinutes] = useState(15)
  const [energy, setEnergy] = useState<Energy>('med')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Resume a previous session from the browser, once, on mount.
  useEffect(() => {
    const session = loadSession()
    if (session && session.items.length > 0) {
      setItems(session.items)
      setDoneIds(session.doneIds ?? [])
      setMinutes(session.minutes ?? 15)
      setEnergy(session.energy ?? 'med')
    }
    setHydrated(true)
  }, [])

  // Persist after every change (once hydrated, and only with real data).
  useEffect(() => {
    if (!hydrated || items.length === 0) return
    saveSession({ items, doneIds, minutes, energy })
  }, [hydrated, items, doneIds, minutes, energy])

  const doneSet = useMemo(() => new Set(doneIds), [doneIds])
  const remaining = useMemo(
    () => items.filter((it) => !doneSet.has(it.id)),
    [items, doneSet],
  )

  // Surface the most unblocking thing that fits the time + energy you have
  // right now. If nothing fits, still offer the top remaining item so you are
  // never left with a blank screen.
  const current = useMemo(() => {
    if (remaining.length === 0) return null
    const fitsNow = remaining
      .filter(
        (it) =>
          it.minutes <= minutes && ENERGY_RANK[it.energy] <= ENERGY_RANK[energy],
      )
      .sort((a, b) => b.priority - a.priority)
    if (fitsNow.length > 0) return fitsNow[0]
    return [...remaining].sort((a, b) => b.priority - a.priority)[0]
  }, [remaining, minutes, energy])

  const currentFits = current
    ? current.minutes <= minutes && ENERGY_RANK[current.energy] <= ENERGY_RANK[energy]
    : true

  async function handleSubmit(text: string) {
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
      if (data.items.length === 0) {
        setError('I could not find anything to act on. Try a few more words.')
        return
      }
      setItems(data.items)
      setDoneIds([])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function completeCurrent() {
    if (!current) return
    setDoneIds((prev) => [...prev, current.id])
  }

  function skipCurrent() {
    if (!current) return
    // Push this card to the back by dropping its priority below the rest.
    setItems((prev) => {
      const lowest = Math.min(...prev.map((p) => p.priority))
      return prev.map((p) =>
        p.id === current.id ? { ...p, priority: lowest - 1 } : p,
      )
    })
  }

  function reset() {
    clearSession()
    setItems([])
    setDoneIds([])
    setError(null)
  }

  const view: 'dump' | 'focus' | 'done' =
    items.length === 0 ? 'dump' : remaining.length === 0 ? 'done' : 'focus'

  return (
    <main className="min-h-dvh w-full bg-canvas text-ink px-5 py-8 sm:py-12 flex flex-col">
      <div className="mx-auto w-full max-w-xl flex items-center justify-between">
        <span className="font-display text-lg text-ink">Unstuck</span>
        {items.length > 0 && (
          <button
            onClick={reset}
            className="text-sm text-muted transition hover:text-ink"
          >
            Start over
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-10">
        {view === 'dump' && (
          <BrainDump onSubmit={handleSubmit} loading={loading} error={error} />
        )}

        {view === 'focus' && current && (
          <section className="w-full max-w-xl flex flex-col gap-8">
            <EnergyPicker
              minutes={minutes}
              energy={energy}
              onMinutes={setMinutes}
              onEnergy={setEnergy}
            />
            {/* key forces a fresh entrance animation per surfaced action */}
            <FocusCard
              key={current.id}
              item={current}
              fits={currentFits}
              onDone={completeCurrent}
              onSkip={skipCurrent}
            />
            <MomentumMeter done={doneIds.length} total={items.length} />
          </section>
        )}

        {view === 'done' && (
          <section className="w-full max-w-md text-center flex flex-col items-center gap-6">
            <div
              aria-hidden
              className="h-1 w-16 rounded-full bg-accent/70"
            />
            <h2 className="font-display text-3xl text-ink">Head cleared.</h2>
            <p className="text-muted text-lg">
              {items.length} {items.length === 1 ? 'thing' : 'things'}, cleared one
              small step at a time. Momentum is only ever this, repeated.
            </p>
            <button
              onClick={reset}
              className="rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
            >
              Begin again
            </button>
          </section>
        )}
      </div>

      <footer className="mx-auto w-full max-w-xl text-center text-xs text-muted/70">
        Unstuck · one small step at a time
      </footer>
    </main>
  )
}
