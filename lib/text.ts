// Capitalize the first character (works across languages), but leave intentional
// intercaps alone: iPhone, eBay, iOS stay as written. Used so a generated next
// action reads as a clean imperative without corrupting brand names.
export function capitalizeFirst(s: string): string {
  if (!s.length) return s
  const first = s[0]
  if (first !== first.toLowerCase()) return s // already capital or non-letter
  if (s.length > 1 && s[1] !== s[1].toLowerCase()) return s // iPhone, eBay, iOS
  return first.toUpperCase() + s.slice(1)
}
