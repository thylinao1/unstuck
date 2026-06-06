// Hero one-liners. One is picked at random each time the app opens, so the
// landing feels alive without adding clutter. Quiet Luxury voice: calm, plain,
// no hype, no em-dashes.
//
// Emphasis uses a small markup: [text](treatments), where treatments is a
// space-separated list (so they compose). See renderPhrase in BrainDump.tsx.
//
//   u     accent underline            i     italic
//   down  shift down + accent         up    shift up + accent
//   sm    smaller (muted)             xs    smaller still
//   xxs   tiny and faint              blur  blurred
//   blue  cool blue (freeze/clear)    red   urgent red
//   caps  UPPERCASE                   gap   extra leading space
//   drip  blue liquid ooze            glass crystalline glass, clean sans
//   script  ornamental flowing script (inherits ink color)
export const HERO_PHRASES: readonly string[] = [
  'Overwhelm [freezes](blue) you. One [small](sm) step thaws it.',
  'Too much at once? [Start](u) with one thing.',
  'You do not have to do it [all](caps). Just the next [small](sm) thing.',
  'Empty your head. Leave with [one thing](u) to start.',
  'The hardest part is [starting](u). Let us make it [small](sm).',
  'A long list [freezes](blue) you. [One step](u) moves you.',
  '[Big](caps) pile in, one small step [out](gap).',
  'Stuck is just the moment before the [first step](u i).',
  'Quiet the [noise](blur), then take one [small](sm) step.',
  'What is the [smallest thing](u sm) you could start right now?',
  'One small step is enough to [break the ](u)[freeze](u blue).',
  'Put it all [down](down). Pick [up](up) one thing.',
  'You are not [lazy](drip), just overwhelmed. [Start ](u)[small](u sm).',
  'Momentum is [one small step](u), repeated, [repeated](sm), [repeated](xs), [repeated](xxs).',
  'Dump the [chaos](blur). Leave with one [clear](glass) move.',
  'When everything feels [urgent](red), start with [one](script).',
  'The pile [shrinks](sm) one small step at a time.',
  '[Begin](u) before you feel ready. Begin small.',
  'Clear the [fog](blur). Find the [one ](u)[next](u i)[ step](u).',
  'Less deciding, [more ](u)[starting](u i).',
]
