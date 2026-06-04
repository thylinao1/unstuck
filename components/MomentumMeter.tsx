interface MomentumMeterProps {
  done: number
  total: number
}

const LINES = [
  'Start with one.',
  'One done. That is momentum.',
  'It builds from here.',
  'The pile is getting smaller.',
  'Almost clear.',
]

export function MomentumMeter({ done, total }: MomentumMeterProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const line = LINES[Math.min(done, LINES.length - 1)]

  return (
    <div className="w-full flex flex-col gap-2.5" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink font-medium">{line}</span>
        <span className="text-faint tabular-nums">
          {done} of {total}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line/70"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-deep transition-[width] duration-[900ms]"
          style={{ width: `${pct}%`, transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
        />
      </div>
    </div>
  )
}
