// "Quote of the day" for the footer: light, peaceful lines that create calm and
// a little self-kindness, not ones that frame life as a storm to survive. Every
// line here leans toward gratitude, gentleness, possibility, or being present.
// Drawn from public-domain and widely circulated sources, attributed. Quiet
// Luxury voice: no em or en dashes in the text (the component adds the quotation
// marks). A plain list, easy to extend or move behind an API later. One is
// chosen per calendar day (see quoteForToday).
export interface Quote {
  text: string
  author: string
}

export const QUOTES: readonly Quote[] = [
  { text: 'It is never too late to be what you might have been.', author: 'George Eliot' },
  { text: 'Tomorrow is always fresh, with no mistakes in it yet.', author: 'L. M. Montgomery' },
  { text: 'Finish each day and be done with it. You have done what you could.', author: 'Ralph Waldo Emerson' },
  { text: 'Go confidently in the direction of your dreams. Live the life you have imagined.', author: 'Henry David Thoreau' },
  { text: 'Very little is needed to make a happy life. It is all within yourself, in your way of thinking.', author: 'Marcus Aurelius' },
  { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
  { text: 'When I let go of what I am, I become what I might be.', author: 'Lao Tzu' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Reflect upon your present blessings, of which every person has many.', author: 'Charles Dickens' },
  { text: 'Let us be grateful to the people who make us happy. They are the gardeners who make our souls blossom.', author: 'Marcel Proust' },
  { text: 'Keep your face always toward the sunshine.', author: 'Walt Whitman' },
  { text: 'Far away in the sunshine are my highest aspirations. I may not reach them, but I can look up and see their beauty.', author: 'Louisa May Alcott' },
  { text: 'Sometimes I have believed as many as six impossible things before breakfast.', author: 'Lewis Carroll' },
  { text: 'The happiness of your life depends upon the quality of your thoughts.', author: 'Marcus Aurelius' },
  { text: 'Write it on your heart that every day is the best day in the year.', author: 'Ralph Waldo Emerson' },
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
  { text: 'Begin, be bold, and venture to be wise.', author: 'Horace' },
  { text: 'What we think, we become.', author: 'Buddha' },
  { text: 'This above all: to thine own self be true.', author: 'William Shakespeare' },
  { text: 'If you want to be happy, be.', author: 'Leo Tolstoy' },
  { text: 'Gratitude is the fairest blossom which springs from the soul.', author: 'Henry Ward Beecher' },
  { text: 'Hope is the thing with feathers that perches in the soul.', author: 'Emily Dickinson' },
  { text: 'I dwell in possibility.', author: 'Emily Dickinson' },
  { text: 'There is no charm equal to tenderness of heart.', author: 'Jane Austen' },
  { text: 'To love oneself is the beginning of a lifelong romance.', author: 'Oscar Wilde' },
  { text: 'Adopt the pace of nature: her secret is patience.', author: 'Ralph Waldo Emerson' },
  { text: 'What you seek is seeking you.', author: 'Rumi' },
  { text: 'Nothing is worth more than this day.', author: 'Johann Wolfgang von Goethe' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Wherever you go, go with all your heart.', author: 'Confucius' },
  { text: 'The earth has music for those who listen.', author: 'George Santayana' },
  { text: 'The sun shines not on us but in us.', author: 'John Muir' },
  { text: 'In every walk with nature one receives far more than he seeks.', author: 'John Muir' },
  { text: 'Let yourself be silently drawn by the strange pull of what you really love.', author: 'Rumi' },
  { text: 'The little things are infinitely the most important.', author: 'Arthur Conan Doyle' },
  { text: 'Life is a flower of which love is the honey.', author: 'Victor Hugo' },
  { text: 'How beautiful it is to do nothing, and then rest afterward.', author: 'Spanish proverb' },
  { text: 'Be happy for this moment. This moment is your life.', author: 'Omar Khayyam' },
  { text: 'The greatest wealth is to live content with little.', author: 'Plato' },
  { text: 'Happiness depends upon ourselves.', author: 'Aristotle' },
  { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  { text: 'Within you there is a stillness and a sanctuary you can retreat to any time.', author: 'Hermann Hesse' },
  { text: 'What lies within us is far greater than what lies behind or before us.', author: 'Ralph Waldo Emerson' },
  { text: 'Today I am wise, so I am changing myself.', author: 'Rumi' },
  { text: 'Smile, breathe, and go slowly.', author: 'Thich Nhat Hanh' },
  { text: 'Joy is the simplest form of gratitude.', author: 'Karl Barth' },
]

// One quote per calendar day, stable all day and rolling over at local midnight.
export function quoteForToday(date: Date = new Date()): Quote {
  const dayIndex = Math.floor(
    (date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000,
  )
  return QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length]
}
