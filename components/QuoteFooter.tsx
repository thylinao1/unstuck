'use client'

import { useEffect, useState } from 'react'
import { QUOTES, randomQuote, type Quote } from '@/lib/quotes'

// A quietly rotating line at the bottom. A stable default renders on the server
// and first paint (so there is no hydration mismatch), then a random one swaps in
// after mount, the same approach as the hero phrase.
export function QuoteFooter() {
  const [quote, setQuote] = useState<Quote>(QUOTES[0])
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- random per open, client-only */
    setQuote(randomQuote())
  }, [])

  return (
    <footer className="mx-auto w-full max-w-xl text-center flex flex-col gap-2 pt-6">
      <p className="font-display italic text-sm text-muted leading-relaxed text-balance">
        {quote.text}
        {quote.author && <span className="not-italic text-faint"> · {quote.author}</span>}
      </p>
      <p className="text-xs text-faint/70">Unstuck · one small step at a time</p>
    </footer>
  )
}
