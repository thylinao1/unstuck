interface MomentumMeterProps {
  done: number
  total: number
}

const LINES = [
  "Let's get the first one.",
  'Nice. That is momentum.',
  "You're rolling now.",
  'Look at you go.',
  'Almost clear.',
]

export function MomentumMeter({ done, total }: MomentumMeterProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const line = LINES[Math.min(done, LINES.length - 1)]

  return (
    <div className="w-full flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink font-medium">{line}</span>
        <span className="text-muted">
          {done} of {total} done
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-line/60"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
