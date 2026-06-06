'use client'

// The completion celebration, drawn on a canvas via canvas-confetti.
//
// Why a canvas and not CSS sparks: the old spark burst was pure CSS keyframes.
// The reduced-motion media query set `animation: none` on them and their base
// style was `opacity: 0`, so they were invisible whenever Reduce Motion was on.
// Worse, the final step's burst was unmounted the instant the screen switched to
// the done view, and the done screen never had any confetti at all. A <canvas>
// driven by requestAnimationFrame has none of those failure modes.
//
// Why our OWN canvas with useWorker:false: canvas-confetti's default global
// instance renders inside a blob-URL Web Worker. The production CSP is
// `default-src 'self'` with no worker-src, which can block a blob worker and
// silently kill the celebration. A self-managed, main-thread canvas depends on
// no CSP directive, so it fires on the live site and on real Safari. The library
// is loaded with a dynamic import so it stays off the initial landing bundle.

import type { CreateTypes, GlobalOptions, Options } from 'canvas-confetti'

type ConfettiFactory = (canvas: HTMLCanvasElement, options?: GlobalOptions) => CreateTypes

let factoryPromise: Promise<ConfettiFactory | null> | null = null
let fire: CreateTypes | null = null

function loadFactory(): Promise<ConfettiFactory | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }
  if (!factoryPromise) {
    factoryPromise = import('canvas-confetti')
      .then((mod) => {
        const create = (mod.default as unknown as { create?: ConfettiFactory }).create
        return typeof create === 'function' ? create : null
      })
      .catch(() => null) // offline or blocked: the done screen still reads as a win
  }
  return factoryPromise
}

// A single full-viewport canvas, created once and reused. Main thread, no worker.
async function getFire(): Promise<CreateTypes | null> {
  if (fire) return fire
  const create = await loadFactory()
  if (!create) return null
  if (!fire) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100'
    document.body.appendChild(canvas)
    fire = create(canvas, { resize: true, useWorker: false })
  }
  return fire
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Warm clay-to-gold, tuned to the app's accent rather than a default rainbow.
const WARM = ['#c2603a', '#a44e2e', '#d98b4a', '#e3b94f', '#f2d9a0']

// The big one: clearing the whole head. An opening pop that always shows (even
// under Reduce Motion), then, when motion is allowed, a steady stream from both
// lower corners for a beat so it reads as real fireworks, not a single puff.
export async function celebrateDone(): Promise<void> {
  const confetti = await getFire()
  if (!confetti) return
  const reduced = prefersReducedMotion()

  const opening: Options = {
    colors: WARM,
    particleCount: reduced ? 90 : 170,
    spread: reduced ? 90 : 130,
    startVelocity: reduced ? 32 : 50,
    scalar: 1.1,
    ticks: reduced ? 160 : 240,
    origin: { x: 0.5, y: 0.55 },
    disableForReducedMotion: false,
  }
  confetti(opening)

  if (reduced) return // one calm, clearly visible burst is enough here

  const end = Date.now() + 1900
  const stream = () => {
    confetti({
      colors: WARM,
      particleCount: 8,
      angle: 60,
      spread: 70,
      startVelocity: 58,
      scalar: 1.05,
      origin: { x: 0, y: 0.68 },
      disableForReducedMotion: false,
    })
    confetti({
      colors: WARM,
      particleCount: 8,
      angle: 120,
      spread: 70,
      startVelocity: 58,
      scalar: 1.05,
      origin: { x: 1, y: 0.68 },
      disableForReducedMotion: false,
    })
    if (Date.now() < end) requestAnimationFrame(stream)
  }
  requestAnimationFrame(stream)
}

// The small one: a single completed step. A quick warm pop near the card center,
// held alongside the praise line during the beat before the next card arrives.
export async function celebrateStep(): Promise<void> {
  const confetti = await getFire()
  if (!confetti) return
  const reduced = prefersReducedMotion()

  confetti({
    colors: WARM,
    particleCount: reduced ? 40 : 70,
    spread: reduced ? 70 : 95,
    startVelocity: reduced ? 26 : 40,
    scalar: 0.95,
    ticks: reduced ? 130 : 180,
    gravity: 1.15,
    origin: { x: 0.5, y: 0.48 },
    disableForReducedMotion: false,
  })
}
