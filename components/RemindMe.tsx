'use client'

import { useState } from 'react'
import type { NudgeOption } from '@/lib/nudges'

interface RemindMeProps {
  onRemind: (option: NudgeOption) => void | Promise<void>
}

const OPTIONS: ReadonlyArray<{ value: NudgeOption; label: string }> = [
  { value: 'hour', label: 'in an hour' },
  { value: 'evening', label: 'this evening' },
  { value: 'tomorrow', label: 'tomorrow' },
]

export function RemindMe({ onRemind }: RemindMeProps) {
  const [state, setState] = useState<'collapsed' | 'choosing' | 'done'>('collapsed')

  if (state === 'done') {
    return <p className="text-center text-sm text-faint">I will nudge you then. Gently.</p>
  }

  if (state === 'collapsed') {
    return (
      <button
        type="button"
        onClick={() => setState('choosing')}
        className="mx-auto text-sm text-faint transition hover:text-ink"
      >
        Remind me later
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
      <span className="text-faint">Nudge me</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={async () => {
            await onRemind(opt.value)
            setState('done')
          }}
          className="rounded-full border border-line px-3 py-1 text-muted transition hover:text-ink hover:border-ink/25"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
