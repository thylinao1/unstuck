'use client'

import type { CSSProperties } from 'react'

// A small celebratory spark burst on each completed step: a few warm sparks fly
// outward and fade. Calm but fun, so finishing one feels like a little win
// instead of the next card just sliding in. Re-keyed by `trigger` to replay.
const SPARKS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0.85, -0.5],
  [1, 0.25],
  [0.6, 0.85],
  [-0.6, 0.85],
  [-1, 0.25],
  [-0.85, -0.5],
  [0.2, -0.95],
]

export function Burst({ trigger }: { trigger: number }) {
  if (trigger === 0) return null
  return (
    <span key={trigger} aria-hidden className="burst">
      {SPARKS.map(([dx, dy], i) => (
        <span
          key={i}
          className="spark"
          style={{ '--dx': `${dx * 72}px`, '--dy': `${dy * 72}px` } as CSSProperties}
        />
      ))}
    </span>
  )
}
