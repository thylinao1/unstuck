'use client'

interface EffortSliderProps {
  /** Effort the user has right now, 0 to 1. */
  value: number
  /** How many distinct step sizes this item offers (the slider splits into this
   *  many bins: two sizes to two halves, three to thirds). */
  bins: number
  onChange: (value: number) => void
}

// Bin labels by how many sizes the current item has. The slider is continuous,
// so the user slides "how much they have in them" and it lands in a bin.
const BIN_LABELS: Record<number, readonly string[]> = {
  2: ['A little', 'A lot'],
  3: ['A little', 'Some', 'A lot'],
}

export function EffortSlider({ value, bins, onChange }: EffortSliderProps) {
  // One size only: nothing to choose, so the slider would be pointless.
  if (bins < 2) return null
  const labels = BIN_LABELS[bins] ?? BIN_LABELS[2]
  const active = Math.min(bins - 1, Math.floor(value * bins))

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2.5">
      <label htmlFor="effort" className="text-center text-sm text-muted">
        How much do you have in you right now?
      </label>
      <input
        id="effort"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="How much effort you have right now"
        aria-valuetext={labels[active]}
        className="w-full cursor-pointer [accent-color:var(--color-accent)]"
      />
      <div className="flex justify-between text-xs">
        {labels.map((label, i) => (
          <span
            key={label}
            className={
              i === active ? 'font-medium text-accent-deep transition' : 'text-faint transition'
            }
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
