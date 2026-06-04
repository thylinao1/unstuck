import type { Metadata } from 'next'
import { Geist, Newsreader } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Unstuck: one small next step',
  description:
    'Dump everything on your mind and get the single smallest next step you can actually take right now. A calm tool that helps you take action and stay in control of your day.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${newsreader.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
