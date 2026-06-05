'use client'

// A small celebratory spark burst on each completed step: a few warm sparks fly
// outward and fade, so finishing one feels like a little win. Each spark's
// direction lives in its own CSS keyframe (.spark-0 ... .spark-7) so it animates
// in Safari too. Re-keyed by `trigger` to replay.
export function Burst({ trigger }: { trigger: number }) {
  if (trigger === 0) return null
  return (
    <span key={trigger} aria-hidden className="burst">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <span key={i} className={`spark spark-${i}`} />
      ))}
    </span>
  )
}
