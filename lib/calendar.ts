'use client'

import type { TriageItem } from './types'

// Build an iCalendar (.ics) file in the browser and hand it to the OS, so a
// scheduled item lands in the user's calendar with no backend and no login.
// On iPhone Safari, opening the file offers "Add to Calendar"; on desktop it
// downloads and opens in the default calendar app. Times are written as floating
// local times (no zone), so 3 PM stays 3 PM wherever the user is.

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIcsLocal(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  )
}

function toIcsStampUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function parseable(iso: string | undefined): iso is string {
  return Boolean(iso) && !Number.isNaN(Date.parse(iso as string))
}

export function canAddToCalendar(item: TriageItem): boolean {
  return parseable(item.eventStart)
}

// A friendly local rendering of the event time for the card, e.g. "Mon 9 Jun, 3:00 PM".
export function formatEventTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function buildIcs(item: TriageItem): string | null {
  if (!parseable(item.eventStart)) return null
  const start = new Date(item.eventStart)
  const end = parseable(item.eventEnd)
    ? new Date(item.eventEnd)
    : new Date(start.getTime() + 60 * 60 * 1000) // default to one hour
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unstuck//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${item.id}-${toIcsLocal(start)}@unstuck`,
    `DTSTAMP:${toIcsStampUtc(new Date())}`,
    `DTSTART:${toIcsLocal(start)}`,
    `DTEND:${toIcsLocal(end)}`,
    `SUMMARY:${escapeText(item.eventTitle || item.title)}`,
    `DESCRIPTION:${escapeText(item.nextAction)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// Trigger the OS add-to-calendar flow. A data: URI is the most reliable way to
// get iOS Safari to offer "Add to Calendar"; desktop browsers download the file.
export function addToCalendar(item: TriageItem): void {
  const ics = buildIcs(item)
  if (!ics || typeof document === 'undefined') return
  const href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  const name = (item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'event') + '.ics'
  const a = document.createElement('a')
  a.href = href
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
