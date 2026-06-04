import { test, expect } from '@playwright/test'

// The demo path: brain dump -> AI/fallback triage -> one focus card at a time ->
// complete -> momentum -> done. Plus a few edge cases a judge will try.

test('landing: hero renders and Begin is disabled until you type', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Overwhelm freezes you')
  const begin = page.getByRole('button', { name: /begin/i })
  await expect(begin).toBeDisabled()
  await page.getByLabel('Brain dump').fill('book the dentist\nreply to the landlord about the leak')
  await expect(begin).toBeEnabled()
})

test('whitespace-only input cannot be submitted', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Brain dump').fill('     ')
  await expect(page.getByRole('button', { name: /begin/i })).toBeDisabled()
})

test('dump -> one card -> complete advances momentum -> head cleared', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Brain dump').fill('book the dentist\nreply to the landlord about the leak')
  await page.getByRole('button', { name: /begin/i }).click()

  // Exactly one action surfaces at a time, momentum meter starts at zero.
  await expect(page.getByText('From your dump')).toBeVisible()
  await expect(page.getByText(/\d+ of \d+/)).toContainText('0 of')

  // Work through every card to the done state.
  for (let i = 0; i < 12; i++) {
    const done = page.getByRole('button', { name: 'Done' })
    if (!(await done.isVisible().catch(() => false))) break
    await done.click()
  }
  await expect(page.getByRole('heading', { name: 'Head cleared.' })).toBeVisible()
})

test('session resumes after a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Brain dump').fill('clean the kitchen\nfigure out the trip budget')
  await page.getByRole('button', { name: /begin/i }).click()
  await expect(page.getByText('From your dump')).toBeVisible()
  await page.reload()
  await expect(page.getByText('From your dump')).toBeVisible()
})
