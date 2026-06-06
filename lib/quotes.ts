// "Quote of the day" for the footer: calming, perspective-giving lines from
// novels, poets, and philosophers, the kind that help you breathe and feel a
// little kinder toward yourself. Drawn from public-domain and widely circulated
// sources, attributed to the author. Quiet Luxury voice: no em or en dashes in
// the text (the component adds the quotation marks). This is a plain list, so it
// is easy to keep adding to, or to move behind an API later without touching the
// component. One is chosen per calendar day (see quoteForToday).
export interface Quote {
  text: string
  author: string
}

export const QUOTES: readonly Quote[] = [
  { text: 'It is never too late to be what you might have been.', author: 'George Eliot' },
  { text: 'I am no bird, and no net ensnares me.', author: 'Charlotte Brontë, Jane Eyre' },
  { text: 'I am not afraid of storms, for I am learning how to sail my ship.', author: 'Louisa May Alcott, Little Women' },
  { text: 'Tomorrow is always fresh, with no mistakes in it yet.', author: 'L. M. Montgomery, Anne of Green Gables' },
  { text: 'We are all in the gutter, but some of us are looking at the stars.', author: 'Oscar Wilde' },
  { text: 'Finish each day and be done with it. You have done what you could.', author: 'Ralph Waldo Emerson' },
  { text: 'Go confidently in the direction of your dreams. Live the life you have imagined.', author: 'Henry David Thoreau' },
  { text: 'Very little is needed to make a happy life. It is all within yourself, in your way of thinking.', author: 'Marcus Aurelius' },
  { text: 'You have power over your mind, not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
  { text: 'When I let go of what I am, I become what I might be.', author: 'Lao Tzu' },
  { text: 'Our greatest glory is not in never falling, but in rising every time we fall.', author: 'Confucius' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Reflect upon your present blessings, of which every person has many.', author: 'Charles Dickens' },
  { text: 'Let us be grateful to the people who make us happy. They are the charming gardeners who make our souls blossom.', author: 'Marcel Proust' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'Keep your face always toward the sunshine, and shadows will fall behind you.', author: 'Walt Whitman' },
  { text: 'Not until we are lost do we begin to understand ourselves.', author: 'Henry David Thoreau' },
  { text: 'Far away there in the sunshine are my highest aspirations. I may not reach them, but I can look up and see their beauty.', author: 'Louisa May Alcott' },
  { text: 'Why, sometimes I have believed as many as six impossible things before breakfast.', author: 'Lewis Carroll, Through the Looking-Glass' },
  { text: 'The happiness of your life depends upon the quality of your thoughts.', author: 'Marcus Aurelius' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
  { text: 'Write it on your heart that every day is the best day in the year.', author: 'Ralph Waldo Emerson' },
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
  { text: 'No one can make you feel inferior without your consent.', author: 'Eleanor Roosevelt' },
  { text: 'Begin, be bold, and venture to be wise.', author: 'Horace' },
  { text: 'The world is full of suffering. It is also full of the overcoming of it.', author: 'Helen Keller' },
  { text: 'What we think, we become.', author: 'Buddha' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'There is nothing either good or bad, but thinking makes it so.', author: 'William Shakespeare, Hamlet' },
  { text: 'This above all: to thine own self be true.', author: 'William Shakespeare, Hamlet' },
  { text: 'The mystery of human existence lies not in just staying alive, but in finding something to live for.', author: 'Fyodor Dostoevsky' },
  { text: 'If you want to be happy, be.', author: 'Leo Tolstoy' },
  { text: 'Everyone thinks of changing the world, but no one thinks of changing himself.', author: 'Leo Tolstoy' },
  { text: 'Gratitude is the fairest blossom which springs from the soul.', author: 'Henry Ward Beecher' },
  { text: 'Hope is the thing with feathers that perches in the soul.', author: 'Emily Dickinson' },
  { text: 'I dwell in possibility.', author: 'Emily Dickinson' },
  { text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Brontë, Wuthering Heights' },
  { text: 'There is no charm equal to tenderness of heart.', author: 'Jane Austen, Emma' },
  { text: 'To love oneself is the beginning of a lifelong romance.', author: 'Oscar Wilde' },
  { text: 'Adopt the pace of nature: her secret is patience.', author: 'Ralph Waldo Emerson' },
  { text: 'The wound is the place where the light enters you.', author: 'Rumi' },
  { text: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.', author: 'Rumi' },
  { text: 'What you seek is seeking you.', author: 'Rumi' },
  { text: 'The best way out is always through.', author: 'Robert Frost' },
  { text: 'Nothing is worth more than this day.', author: 'Johann Wolfgang von Goethe' },
]

// One quote per calendar day, stable all day and rolling over at local midnight.
export function quoteForToday(date: Date = new Date()): Quote {
  const dayIndex = Math.floor(
    (date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000,
  )
  return QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length]
}
