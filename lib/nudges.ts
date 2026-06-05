'use client'

// A gentle, opt-in nudge. No backend, no accounts: the schedule lives in
// localStorage. Honest scope: while the tab is open a browser notification
// fires at the chosen time; whenever you reopen the app, a due reminder shows
// as a soft in-app line. True background notifications (app fully closed) would
// need a service worker and push infrastructure, which this does not have.
//
// Grounded in implementation intentions: a timely, specific cue to take the
// next small step raises follow-through far more than a vague intention. Kept
// gentle on purpose, never nagging.

const KEY = 'unstuck:nudge:v1'

export interface Nudge {
  at: number
  message: string
}

const MESSAGES = [
  'Still on your mind? One small step is enough.',
  'How is it going? Ready for the next small thing?',
  'No rush. One small step, whenever you are.',
  'A gentle nudge. The smallest step still counts.',
  'Checking in. Want to clear one more thing?',
]

export function randomNudgeMessage(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
}

export type NudgeOption = 'hour' | 'evening' | 'tomorrow'

export function nudgeTime(option: NudgeOption): number {
  const now = new Date()
  if (option === 'hour') return now.getTime() + 60 * 60 * 1000
  const d = new Date(now)
  if (option === 'evening') {
    d.setHours(19, 0, 0, 0)
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1)
    return d.getTime()
  }
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.getTime()
}

export async function requestNudgePermission(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'default') return
  try {
    await Notification.requestPermission()
  } catch {
    // denied or unavailable; the on-reopen in-app line still works.
  }
}

export function scheduleNudge(nudge: Nudge): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(nudge))
  } catch {
    // non-fatal
  }
}

export function loadNudge(): Nudge | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Nudge>) : null
    return parsed && typeof parsed.at === 'number' && typeof parsed.message === 'string'
      ? { at: parsed.at, message: parsed.message }
      : null
  } catch {
    return null
  }
}

export function clearNudge(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function fireNotification(message: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification('Unstuck', { body: message })
  } catch {
    // ignore
  }
}
