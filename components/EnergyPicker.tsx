'use client'

import { useRef } from 'react'
import type { Energy } from '@/lib/types'

interface EnergyPickerProps {
  minutes: number
  energy: Energy
  onMinutes: (m: number) => void
  onEnergy: (e: Energy) => void
}

const TIMES = [5, 15, 30] as const
const ENERGIES: ReadonlyArray<{ value: Energy; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
]

interface Option<T> {
  value: T
  label: string
}

interface ChipGroupProps<T> {
  label: string
  lead: string
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (v: T) => void
}

// An accessible single-select group: role="radiogroup" with roving tabindex and
// arrow-key navigation, so a screen reader hears "Energy, Low, selected, 1 of 3"
// instead of three disconnected toggle buttons.
function ChipGroup<T extends string | number>({
  label,
  lead,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function move(currentIndex: number, delta: number) {
    const next = (currentIndex + delta + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1 rounded-full bg-surface/70 border border-line px-1.5 py-1"
    >
      <span className="pl-2.5 pr-1 text-faint" aria-hidden>
        {lead}
      </span>
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                move(i, 1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                move(i, -1)
              }
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-ink text-canvas shadow-[var(--shadow-soft)]'
                : 'text-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function EnergyPicker({
  minutes,
  energy,
  onMinutes,
  onEnergy,
}: EnergyPickerProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm">
      <ChipGroup
        label="Time you have"
        lead="I have"
        options={TIMES.map((t) => ({ value: t, label: `${t} min` }))}
        value={minutes}
        onChange={onMinutes}
      />
      <ChipGroup
        label="Energy you have"
        lead="energy"
        options={ENERGIES}
        value={energy}
        onChange={onEnergy}
      />
    </div>
  )
}
