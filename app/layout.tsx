import type { Metadata } from 'next'
import { Geist, Great_Vibes, Newsreader } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

// One ornamental script, used only for the occasional pretty word in a hero line
// (the "one" in "start with one"). Self-hosted by next/font, so no extra request
// and no CSP change. Great Vibes ships a single 400 weight.
const greatVibes = Great_Vibes({
  variable: '--font-script',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://unstuck-theta.vercel.app'),
  title: 'Unstuck: one small next step',
  description:
    'Dump everything on your mind and get the single smallest next step you can actually take right now. A calm tool that helps you take action and stay in control of your day.',
  openGraph: {
    title: 'Unstuck: one small next step',
    description:
      'Brain-dump the pile in your head. Get one calm, doable step matched to the time and energy you have right now.',
    url: 'https://unstuck-theta.vercel.app',
    siteName: 'Unstuck',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Unstuck, one calm next step from your brain dump' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unstuck: one small next step',
    description:
      'Brain-dump the pile in your head. Get one calm, doable step matched to the time and energy you have right now.',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${newsreader.variable} ${greatVibes.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
