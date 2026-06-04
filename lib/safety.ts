// Crisis detection. Deliberately high-precision: a brain-dump is the highest-risk
// free-text box for a self-harm disclosure, and this is a tool for ages 13+.
//
// When this fires (or the model sets needsSupport), the UI shows a calm support
// card instead of converting a crisis into a task with a momentum meter. This is
// a belt-and-suspenders net so the deterministic fallback path is covered too,
// not only the AI path.

const CRISIS =
  /\b(kill(ing)?\s+(myself|me)|want(ing)?\s+to\s+die|wanna\s+die|end(ing)?\s+(my\s+life|it\s+all)|suicid|self[\s-]?harm|harm(ing)?\s+myself|hurt(ing)?\s+myself|don'?t\s+want\s+to\s+(be\s+alive|live|exist|wake\s+up)|no\s+reason\s+to\s+live|better\s+off\s+dead|can'?t\s+go\s+on)\b/i

export function looksLikeCrisis(text: string): boolean {
  return CRISIS.test(text)
}
