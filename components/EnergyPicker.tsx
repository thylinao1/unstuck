'use client'

import type { ReactNode } from 'react'
import type { Energy } from '@/lib/types'

interface EnergyPickerProps {
  minutes: number
  energy: Energy
  onMinutes: (m: number) => void
  onEnergy: (e: Energy) => void
}

const TIMES = [5, 15, 30]
const ENERGIES: ReadonlyArray<{ value: Energy; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Medium' },
  { value: 'high', label: 'High' },
]

interface ChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-ink text-canvas shadow-sm'
          : 'bg-surface text-muted border border-line hover:text-ink hover:border-ink/30'
      }`}
    >
      {children}
    </button>
  )
}

export function EnergyPicker({
  minutes,
  energy,
  onMinutes,
  onEnergy,
}: EnergyPickerProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted">I&rsquo;ve got</span>
        {TIMES.map((t) => (
          <Chip key={t} active={minutes === t} onClick={() => onMinutes(t)}>
            {t} min
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted">energy</span>
        {ENERGIES.map((e) => (
          <Chip
            key={e.value}
            active={energy === e.value}
            onClick={() => onEnergy(e.value)}
          >
            {e.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
