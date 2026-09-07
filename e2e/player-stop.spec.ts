import { test, expect } from '@playwright/test'

// U živého vysílání se nedá navázat tam, kde se přestalo - zdroj se zahazuje.
// Tlačítko to tedy musí říkat jako STOP, ne jako pauza.
test('player button stops the stream instead of pausing it', async ({ page }) => {
  await page.goto('/')

  const button = page.getByRole('button', { name: 'Play' }).first()
  await expect(button).toBeVisible()

  await button.click()

  // once playing, the label must read Stop
  const stop = page.getByRole('button', { name: 'Stop' }).first()
  await expect(stop).toBeVisible({ timeout: 15000 })

  // the icon is a single square, not two bars
  const squares = await stop.locator('svg rect').count()
  expect(squares).toBe(1)
  const width = await stop.locator('svg rect').getAttribute('width')
  expect(width).toBe('12')

  // and it really is a stop: the source is dropped
  await stop.click()
  await page.waitForTimeout(800)
  const src = await page.locator('audio').getAttribute('src')
  expect(src).toBeNull()

  await expect(page.getByRole('button', { name: 'Play' }).first()).toBeVisible()
})
