// A brief line that floats up in the middle each time you finish a step (not the
// final one). Short, warm, varied, gone in about a second.
export const MICRO_PRAISE: readonly string[] = [
  'Great job. Keep it going.',
  'Nice. One down.',
  "That's momentum.",
  'Look at you go.',
  'Onward.',
  'That counts.',
  'Smooth. Next one.',
  'You are moving.',
  'One less thing.',
  'Quietly crushing it.',
  'Yes. Keep rolling.',
  'Good. Breathe. Next.',
  'Step taken.',
  'That is how it adds up.',
  'Nice work.',
  'Lighter already.',
  'Done and dusted.',
  'Keep the chain going.',
]

export function randomPraise(): string {
  return MICRO_PRAISE[Math.floor(Math.random() * MICRO_PRAISE.length)]
}
