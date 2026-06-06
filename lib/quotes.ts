// Short, calm lines about starting and beating procrastination, shuffled into
// the footer. Quiet Luxury voice: plain, no hype, no em or en dashes. This is
// just an array, so it is trivial to keep adding to over time (the "database"
// the operator wants can grow here, or later move behind an API without changing
// the component). A handful are classic public lines with an author; the rest
// are house aphorisms in the app's own voice, left unattributed on purpose.
export interface Quote {
  text: string
  author?: string
}

export const QUOTES: readonly Quote[] = [
  { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: 'Do not wait. The time will never be just right.', author: 'Napoleon Hill' },
  { text: 'Start small. Starting is the whole thing.' },
  { text: 'One small step beats a perfect plan.' },
  { text: 'The hardest part is the first minute.' },
  { text: 'Motion creates motivation.' },
  { text: 'You can do almost anything for two minutes.' },
  { text: 'Done is better than perfect.' },
  { text: 'Progress, not pressure.' },
  { text: 'Tiny steps still move you forward.' },
  { text: 'Begin badly. Begin anyway.' },
  { text: 'The pile shrinks one step at a time.' },
  { text: 'Action quiets anxiety.' },
  { text: 'Five minutes now beats an hour someday.' },
  { text: 'Your future self is cheering for this step.' },
  { text: 'Small and steady clears the pile.' },
  { text: 'The first sentence is the hardest. Write it ugly.' },
  { text: 'Lower the bar until it is easy to step over.' },
  { text: 'You are not behind. You are one step away.' },
  { text: 'Start before you feel ready.' },
  { text: 'Momentum loves a small beginning.' },
  { text: 'Do the two minute version first.' },
  { text: 'A messy start beats a tidy delay.' },
  { text: 'Rest is earned by starting, not by waiting.' },
  { text: 'One thing at a time, and this thing first.' },
  { text: 'The step you avoid is usually the small one.' },
  { text: 'Trade the whole mountain for the next stone.' },
  { text: 'Worry shrinks the moment you act.' },
  { text: 'Open the door. The room is less scary inside.' },
  { text: 'Half done today beats perfect never.' },
  { text: 'Pick one. The rest will wait.' },
  { text: 'Courage is just starting before you are sure.' },
  { text: 'The smallest step still counts as a step.' },
  { text: 'Move first, feel ready later.' },
  { text: 'Every finished thing was once just begun.' },
  { text: 'You do not have to finish. You have to begin.' },
  { text: 'Clear one corner and the room feels possible.' },
  { text: 'Start now. Improve later.' },
  { text: 'The list waits. The first step does not.' },
  { text: 'Big things are small things, started.' },
  { text: 'When in doubt, shrink the step.' },
  { text: 'Begin where it is easy.' },
  { text: 'Inch by inch, anything is doable.' },
  { text: 'The work begins the moment you stop bracing for it.' },
  { text: 'A single step is a promise kept.' },
  { text: 'Less deciding, more starting.' },
  { text: 'Take the step that scares you least.' },
  { text: 'Showing up is most of the battle.' },
  { text: 'One brave little step, then another.' },
  { text: 'Quiet the noise. Take one step.' },
  { text: 'Start ugly, finish proud.' },
  { text: 'The river is crossed one stone at a time.' },
  { text: 'You only have to lift the first foot.' },
  { text: 'Forward is forward, however small.' },
  { text: 'The plan can wait. The step cannot.' },
  { text: 'Begin gently. Begin now.' },
  { text: 'Small wins stack into big days.' },
  { text: 'The next small thing is enough.' },
  { text: 'Perfectionism is procrastination in a nicer coat.' },
  { text: 'You cannot edit a blank page, so fill one badly.' },
  { text: 'The mood follows the motion.' },
  { text: 'Doing beats dreading.' },
  { text: 'Two minutes of starting beats a day of stalling.' },
]

export function randomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}
