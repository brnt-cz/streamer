import { test, expect } from '@playwright/test'

test.describe('Radio Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear cookies to start fresh
    await page.context().clearCookies()
    await page.reload()
  })

  // Scenario 1: Play radio from catalog
  test('should select and play a radio from catalog', async ({ page }) => {
    // Given I am on the main page
    await expect(page.getByText('Streamer')).toBeVisible()

    // When I click the "Browse Radios" button
    await page.getByRole('button', { name: 'Browse Radios' }).click()

    // And I see the radio selection modal
    await expect(page.getByRole('heading', { name: 'Select Radio' })).toBeVisible()

    // And I search for a specific radio
    await page.getByPlaceholder('Search radios...').fill('Beat')
    await page.waitForTimeout(300)

    // And I select "Beat" from the list (first listitem in modal)
    await page.getByRole('listitem').filter({ hasText: 'Beat' }).first().click()

    // Then the "Add to Playlist" button becomes enabled
    await expect(page.getByRole('button', { name: 'Add to Playlist' })).toBeEnabled()

    // When I click "Add to Playlist"
    await page.getByRole('button', { name: 'Add to Playlist' }).click()

    // Then the modal closes
    await expect(page.getByRole('heading', { name: 'Select Radio' })).not.toBeVisible()

    // And the station appears in the playlist
    await expect(page.getByRole('listitem').filter({ hasText: 'Beat' })).toBeVisible()
  })

  // Scenario 2: Filter radios by category
  test('should filter radios by category', async ({ page }) => {
    // Given I am in the radio selection modal
    await page.getByRole('button', { name: 'Browse Radios' }).click()
    await expect(page.getByRole('heading', { name: 'Select Radio' })).toBeVisible()

    // Get initial count of radios in modal list
    const modalList = page.locator('.modal ul')
    const initialCount = await modalList.getByRole('listitem').count()

    // When I select "Jazz" category
    await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('jazz')
    await page.waitForTimeout(300)

    // Then fewer radios are displayed
    const filteredCount = await modalList.getByRole('listitem').count()
    expect(filteredCount).toBeLessThan(initialCount)
    expect(filteredCount).toBeGreaterThan(0)
  })

  // Scenario 3: Search radio by name
  test('should search radios by name', async ({ page }) => {
    // Given I am in the radio selection modal
    await page.getByRole('button', { name: 'Browse Radios' }).click()
    await expect(page.getByRole('heading', { name: 'Select Radio' })).toBeVisible()

    // When I type "Impuls" into the search field
    await page.getByPlaceholder('Search radios...').fill('Impuls')

    // Then the radio list filters in real-time
    await page.waitForTimeout(300) // Wait for filter to apply

    // And only radios containing "Impuls" in their name are displayed
    const modalList = page.locator('.modal ul')
    const radioItems = modalList.getByRole('listitem')
    const count = await radioItems.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const item = radioItems.nth(i)
      const text = await item.textContent()
      expect(text?.toLowerCase()).toContain('impuls')
    }
  })

  // Scenario 8: Select stream format
  test('should select format for stream', async ({ page }) => {
    // Given I am in the radio selection modal
    await page.getByRole('button', { name: 'Browse Radios' }).click()
    await expect(page.getByRole('heading', { name: 'Select Radio' })).toBeVisible()

    // First search for a radio to avoid scrolling issues
    await page.getByPlaceholder('Search radios...').fill('Radio 1')
    await page.waitForTimeout(300)

    // And I select a radio station
    const modalList = page.locator('.modal ul')
    await modalList.getByRole('listitem').first().click()

    // When I look for the format dropdown, it should be visible
    const formatDropdown = page.getByRole('combobox', { name: 'Filter by format' })
    await expect(formatDropdown).toBeVisible()

    // The Add to Playlist button should be enabled
    await expect(page.getByRole('button', { name: 'Add to Playlist' })).toBeEnabled()
  })

  // Test closing the modal
  test('should close the modal with X button', async ({ page }) => {
    // When I open the modal
    await page.getByRole('button', { name: 'Browse Radios' }).click()
    await expect(page.getByRole('heading', { name: 'Select Radio' })).toBeVisible()

    // And I click the close button (button next to the heading)
    await page.locator('.modal button').filter({ has: page.locator('svg path[d*="M18 6L6 18"]') }).click()

    // Then the modal closes
    await expect(page.getByRole('heading', { name: 'Select Radio' })).not.toBeVisible()
  })
})
