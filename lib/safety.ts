// Crisis detection for the DETERMINISTIC FALLBACK PATH ONLY.
//
// When the AI runs, the model's needsSupport flag is authoritative. It reasons
// about context and tells "this deadline is killing me" (hyperbole) apart from
// "I want to kill myself" (crisis), which no regex can. This net only runs when
// the AI is unavailable (no key / error / rate-limit), so the degraded path is
// still covered. It is high-precision: the common overwhelm idioms ("killing
// me", "can't go on") are deliberately excluded to avoid false positives, while
// the unambiguous phrases (incl. every form of "suicide", which a stale word
// boundary previously dropped) are kept.

const CRISIS =
  /\b(kill(ing)?\s+myself|want(ing)?\s+to\s+die|wanna\s+die|end(ing)?\s+(my\s+life|it\s+all)|suicid\w*|self[\s-]?harm\w*|harm(ing)?\s+myself|hurt(ing)?\s+myself|don'?t\s+want\s+to\s+(be\s+alive|live|exist|wake\s+up)|no\s+reason\s+to\s+live|better\s+off\s+dead)\b/i

// A deliberately NARROW violence net: disposing of a body is almost never said
// non-literally, so it is high precision (it will not fire on "dump the trash"
// or "bury myself in work"). Broader harm-to-others is left to the model, which
// has the context a regex lacks. This is OR-ed with the model in the route, so
// it catches the case the model shrugs off as a joke.
const VIOLENCE =
  /\b(dump(ing)?|dispos(e|ing)\s+of|hid(e|ing)|bury(ing)?|get(ting)?\s+rid\s+of)\s+(a|the|that|my|his|her|their)?\s*(dead\s+)?bod(y|ies)\b/i

export function looksLikeCrisis(text: string): boolean {
  return CRISIS.test(text) || VIOLENCE.test(text)
}
