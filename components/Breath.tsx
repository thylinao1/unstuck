'use client'

// The loading state, made into the product's signature calming beat: the
// unavoidable wait for triage becomes a single slow breath instead of a spinner.
// Respects prefers-reduced-motion (the orb holds still) via globals.css.

export function Breath() {
  return (
    <section
      className="rise flex flex-col items-center gap-8 text-center"
      aria-busy="true"
      aria-label="Finding your first step"
    >
      <span className="breath-orb" aria-hidden />
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-2xl text-ink">Take a breath.</p>
        <p className="text-faint text-base">Finding your first step…</p>
      </div>
    </section>
  )
}
