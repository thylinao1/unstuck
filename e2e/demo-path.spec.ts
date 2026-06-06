import { test, expect } from '@playwright/test'

// The demo path: brain dump -> AI/fallback triage -> one focus card at a time
// (with a reason it fits) -> complete -> momentum -> done. Plus the edge cases a
// judge will try: whitespace, reload, crisis content. Runs against a local build
// by default so it never bills production (see playwright.config.ts).

// Start every test from a clean session so a prior run can't bleed in.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('landing: hero renders and Begin is disabled until you type', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const begin = page.getByRole('button', { name: /begin/i })
  await expect(begin).toBeDisabled()
  await page.getByLabel('Brain dump', { exact: true }).fill('book the dentist\nreply to the landlord about the leak')
  await expect(begin).toBeEnabled()
})

test('whitespace-only input cannot be submitted', async ({ page }) => {
  await page.getByLabel('Brain dump', { exact: true }).fill('     ')
  await expect(page.getByRole('button', { name: /begin/i })).toBeDisabled()
})

test('dump -> one card with a reason -> complete advances momentum -> head cleared', async ({ page }) => {
  await page.getByLabel('Brain dump', { exact: true }).fill('book the dentist\nreply to the landlord about the leak')
  await page.getByRole('button', { name: /begin/i }).click()

  // Exactly one action surfaces at a time, with a "Why this?" reason.
  await expect(page.getByText('From your dump')).toBeVisible()
  await expect(page.getByText('Why this?')).toBeVisible()
  await expect(page.getByText(/\d+ of \d+/)).toContainText('0 of')

  // Work through every card to the done state.
  for (let i = 0; i < 12; i++) {
    const done = page.getByRole('button', { name: 'Done', exact: true })
    if (!(await done.isVisible().catch(() => false))) break
    await done.click()
  }
  await expect(page.getByRole('button', { name: 'Begin again' })).toBeVisible()
})

test('the effort slider operates and organized mode lists every task', async ({ page }) => {
  await page.getByLabel('Brain dump', { exact: true }).fill('clean the kitchen\nstart the essay due friday\ngo for a run')
  await page.getByRole('button', { name: /begin/i }).click()
  await expect(page.getByText('From your dump')).toBeVisible()

  // The effort slider is an accessible range; sliding it never blanks the card.
  const slider = page.getByRole('slider', { name: /effort/i })
  await expect(slider).toBeVisible()
  await slider.focus()
  await slider.press('End') // most effort
  await expect(page.locator('article h2')).toBeVisible()
  await slider.press('Home') // least effort
  await expect(page.locator('article h2')).toBeVisible()

  // Organized mode shows the whole list; ticking one off advances momentum.
  await page.getByRole('tab', { name: 'Organized' }).click()
  const checks = page.getByRole('checkbox')
  await expect(checks.first()).toBeVisible()
  await expect(page.getByText(/\d+ of \d+/)).toContainText('0 of')
  await checks.first().click()
  await expect(page.getByText(/\d+ of \d+/)).toContainText('1 of')

  // Back in Unstuck mode a card is still surfaced.
  await page.getByRole('tab', { name: 'Unstuck' }).click()
  await expect(page.locator('article h2')).toBeVisible()
})

test('a returning visitor lands on the hero, not mid-flow, and can resume', async ({ page }) => {
  await page.getByLabel('Brain dump', { exact: true }).fill('clean the kitchen\nfigure out the trip budget')
  await page.getByRole('button', { name: /begin/i }).click()
  await expect(page.getByText('From your dump')).toBeVisible()

  // Reloading shows the hero (the whole pitch), with resume offered, NOT a stale card.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const resume = page.getByRole('button', { name: /resume where/i })
  await expect(resume).toBeVisible()
  await resume.click()
  await expect(page.getByText('From your dump')).toBeVisible()
})

test('a dump with crisis content offers support instead of a task', async ({ page }) => {
  await page
    .getByLabel('Brain dump', { exact: true })
    .fill("i can't do this anymore and i don't want to be alive\nemail the landlord about the leak")
  await page.getByRole('button', { name: /begin/i }).click()

  await expect(page.getByRole('heading', { name: 'First, this.' })).toBeVisible()
  await expect(page.getByText('988')).toBeVisible()
  await expect(page.getByText('911')).toBeVisible()
  // The crisis is not rendered as a focus card with a momentum meter.
  await expect(page.getByText('From your dump')).toHaveCount(0)
})

test('a due reminder surfaces as a gentle banner and can be dismissed', async ({ page }) => {
  const msg = 'A gentle nudge. The smallest step still counts.'
  await page.evaluate(
    (m) => localStorage.setItem('unstuck:nudge:v1', JSON.stringify({ at: Date.now() - 1000, message: m })),
    msg,
  )
  await page.reload()
  await expect(page.getByText(msg)).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss reminder' }).click()
  await expect(page.getByText(msg)).toHaveCount(0)
})

// The completion celebration must NOT depend on CSS animation: it broke before
// because reduced motion (and an unmounted CSS spark) left it invisible. It is
// now a canvas drawn on the main thread, so it must fire even with reduced motion
// on. We also assert the beat holds the current card before the next slides in.
test.describe('completion celebration', () => {
  test.use({ reducedMotion: 'reduce' })

  test('confetti canvas fires under reduced motion, and a beat holds the card', async ({ page }) => {
    await page
      .getByLabel('Brain dump', { exact: true })
      .fill('clean the kitchen\nstart the essay due friday\ngo for a run')
    await page.getByRole('button', { name: /begin/i }).click()
    await expect(page.getByText('From your dump')).toBeVisible()

    // Beat: completing a mid-step holds the same card (aria-busy) for a moment
    // and does not advance momentum immediately, so the praise cannot collide.
    const momentum = page.getByText(/\d+ of \d+/)
    await expect(momentum).toContainText('0 of')
    await page.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(page.locator('article[aria-busy="true"]')).toBeVisible()
    await expect(momentum).toContainText('0 of') // still held during the beat

    // Run to the head-cleared screen.
    for (let i = 0; i < 12; i++) {
      const done = page.getByRole('button', { name: 'Done', exact: true })
      if (!(await done.isVisible().catch(() => false))) break
      await done.click()
    }
    await expect(page.getByRole('button', { name: 'Begin again' })).toBeVisible()

    // The celebration canvas is present even though Reduce Motion is on. This is
    // the regression that used to fail silently on real Safari.
    await expect(page.locator('canvas')).toBeAttached({ timeout: 5000 })
  })
})
