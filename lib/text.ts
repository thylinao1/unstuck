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

// House typography for model-written copy: the interface uses no en or em dashes
// anywhere. One sitting between two numbers becomes "to", so a range renders as
// "10 to 15"; anywhere else it becomes a comma. Ordinary hyphens (9-5,
// cover-letter) are left untouched. The character classes below are the only
// place those code points appear in the codebase.
export function normalizeDashes(s: string): string {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[–—]\s*/g, ', ')
}
