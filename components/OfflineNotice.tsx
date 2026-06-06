'use client'

// A clear, unmissable bar across the very top of the public demo. The hosted
// version runs with the live AI off (to keep it free), so the offline engine can
// give rougher, simpler suggestions. This sets that expectation up front and
// points anyone who wants the full thing to an email. Shown only when
// NEXT_PUBLIC_OFFLINE_DEMO=1.
export function OfflineNotice() {
  return (
    <div className="bg-accent-soft/80 border-b border-accent/25 px-5 py-2.5 text-center text-xs sm:text-sm text-accent-deep">
      <span className="opacity-90">
        Offline demo. The live AI is off here to keep it free, so suggestions are simplified.{' '}
      </span>
      <a
        href="mailto:mthylinao@gmail.com"
        className="font-medium underline underline-offset-2 whitespace-nowrap"
      >
        Email for the full AI version
      </a>
    </div>
  )
}
