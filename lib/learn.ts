// Bite-sized, plain-language notes on why starting small beats procrastination.
// Grounded in real research (task aversiveness, implementation intentions,
// self-compassion, the progress principle) but written like a calm friend, not a
// textbook. Shown behind a small "Why this works" icon. No em-dashes.
export interface LearnNote {
  title: string
  body: string
}

export const LEARN_NOTES: readonly LearnNote[] = [
  {
    title: 'Make the first step almost too small',
    body: 'Putting things off is usually about the task feeling heavy, not about you. Shrink the first move until it feels almost silly to skip. Open the doc. Write one ugly sentence. Momentum takes it from there.',
  },
  {
    title: 'You are not lazy, the task is vague',
    body: 'A blurry "sort out my taxes" is hard to start. A clear "open the bank tab and read the balance" is easy. Naming the exact next move is what stops the stalling.',
  },
  {
    title: 'The dread fades a few seconds in',
    body: 'Most of the bad feeling lives in the anticipation, not the doing. It drops sharply once you actually begin. You only have to get to second one.',
  },
  {
    title: 'Motivation comes after you start',
    body: 'Waiting to feel ready is a trap. Action tends to create the wanting, not the other way around. Move a little first and the motivation usually catches up.',
  },
  {
    title: 'Be kinder to yourself than feels natural',
    body: 'People who forgive themselves for putting something off actually do it less next time. Guilt adds weight. A calm "okay, one small step" gets you moving.',
  },
  {
    title: 'Tiny wins lift the whole day',
    body: 'Finishing one small thing quietly shifts your mood and your sense of progress, and that lift makes the next step easier. It compounds.',
  },
]
