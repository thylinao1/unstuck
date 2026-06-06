'use client'

import { useEffect, useState } from 'react'
import { QUOTES, quoteForToday, type Quote } from '@/lib/quotes'

// "Quote of the day" in the footer: a calming line from a novel or a thinker,
// one per calendar day. A stable default renders on the server and first paint
// (so there is no hydration mismatch), then the day's quote swaps in after mount.
export function QuoteFooter() {
  const [quote, setQuote] = useState<Quote>(QUOTES[0])
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client-only, depends on the local date */
    setQuote(quoteForToday())
  }, [])

  return (
    <footer className="mx-auto w-full max-w-xl text-center flex flex-col items-center gap-1.5 pt-8">
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-faint/80">Quote of the day</p>
      <p className="font-display italic text-base text-muted leading-relaxed text-balance max-w-md">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-sm text-faint">{quote.author}</p>
      <p className="text-xs text-faint/60 pt-3">Unstuck · one small step at a time</p>
    </footer>
  )
}
