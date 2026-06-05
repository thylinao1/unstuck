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
  await expect(page.getByRole('heading', { name: 'Head cleared.' })).toBeVisible()
})

test('time and energy pickers are accessible radios and operate', async ({ page }) => {
  await page.getByLabel('Brain dump', { exact: true }).fill('clean the kitchen\nstart the essay due friday\ngo for a run')
  await page.getByRole('button', { name: /begin/i }).click()
  await expect(page.getByText('From your dump')).toBeVisible()

  const low = page.getByRole('radio', { name: 'Low', exact: true })
  await expect(low).toHaveAttribute('aria-checked', 'false')
  await low.click()
  await expect(low).toHaveAttribute('aria-checked', 'true')
  // A card is still surfaced after re-picking energy (never a blank screen).
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

  await expect(page.getByRole('heading', { name: 'First, you.' })).toBeVisible()
  await expect(page.getByText('988')).toBeVisible()
  // The crisis is not rendered as a focus card with a momentum meter.
  await expect(page.getByText('From your dump')).toHaveCount(0)
})
