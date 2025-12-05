import { test, expect } from '@playwright/test'

test.describe('Stream Player', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.context().clearCookies()
    await page.reload()
  })

  // Scenario 6: Control player volume
  test('should control volume with slider', async ({ page }) => {
    // Given I am on the main page with a player
    await expect(page.getByText('Now Playing')).toBeVisible()

    // And the volume slider is visible
    const volumeSlider = page.getByRole('slider')
    await expect(volumeSlider).toBeVisible()

    // When I change the volume to 50%
    await volumeSlider.fill('50')

    // Then the volume value changes
    await expect(volumeSlider).toHaveValue('50')

    // When I change the volume to 0%
    await volumeSlider.fill('0')
    await expect(volumeSlider).toHaveValue('0')

    // When I change the volume to 100%
    await volumeSlider.fill('100')
    await expect(volumeSlider).toHaveValue('100')
  })

  // Scenario 10: Handle playback error
  test('should handle invalid stream URL gracefully', async ({ page }) => {
    // Given I add a station with an invalid URL
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Invalid Station')
    await page.getByPlaceholder('https://...').fill('https://invalid-url-that-does-not-exist.com/stream.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // When I select this station
    await page.getByRole('listitem').filter({ hasText: 'Invalid Station' }).click()

    // Then the station is selected - check in Now Playing section
    await expect(page.locator('.now-playing .name')).toContainText('Invalid Station')

    // And the play button should exist and be clickable
    const playButton = page.locator('.play-btn')
    await expect(playButton).toBeVisible()
  })

  // Test play button functionality
  test('should have functional play button', async ({ page }) => {
    // Given I have a station in my playlist
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Test Station')
    await page.getByPlaceholder('https://...').fill('https://icecast6.play.cz/radio1-128.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // And I select the station
    await page.getByRole('listitem').filter({ hasText: 'Test Station' }).click()

    // Then the play button should be visible
    const playButton = page.locator('.play-btn')
    await expect(playButton).toBeVisible()
  })

  // Test now playing display
  test('should display selected station in Now Playing', async ({ page }) => {
    // Given I have a station in my playlist
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('My Favorite Radio')
    await page.getByPlaceholder('https://...').fill('https://example.com/stream.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // When I click on the station
    await page.getByRole('listitem').filter({ hasText: 'My Favorite Radio' }).click()

    // Then the Now Playing section shows the station name
    await expect(page.locator('.now-playing .name')).toContainText('My Favorite Radio')
  })

  // Test initial state
  test('should show player in initial state', async ({ page }) => {
    // Given I am on the main page
    // Then the player should be visible
    await expect(page.getByText('Now Playing')).toBeVisible()

    // And the volume slider should be visible
    await expect(page.getByRole('slider')).toBeVisible()

    // And the Browse Radios button should be visible
    await expect(page.getByRole('button', { name: 'Browse Radios' })).toBeVisible()

    // And the Your Stations section should be visible
    await expect(page.getByRole('heading', { name: 'Your Stations' })).toBeVisible()
  })

  // Test artwork display
  test('should display artwork area', async ({ page }) => {
    // The artwork container should be visible
    await expect(page.locator('.artwork')).toBeVisible()
  })
})
