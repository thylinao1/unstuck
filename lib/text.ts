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

// Keep the Quiet Luxury voice consistent even in AI-generated text: en and em
// dashes are not used anywhere. A dash between numbers becomes "to" ("10–15" ->
// "10 to 15"); any other en/em dash becomes a comma. Ordinary hyphens (9-5,
// cover-letter) are left untouched.
export function normalizeDashes(s: string): string {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[–—]\s*/g, ', ')
}
