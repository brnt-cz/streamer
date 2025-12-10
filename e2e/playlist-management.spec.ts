import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Playlist Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.context().clearCookies()
    await page.reload()
  })

  // Scenario 4: Add custom station to playlist
  test('should add a custom station manually', async ({ page }) => {
    // Given I am on the main page
    await expect(page.getByRole('heading', { name: 'Your Stations' })).toBeVisible()

    // When I click the "Add" button
    await page.getByRole('button', { name: 'Add' }).click()

    // Then the add form appears
    await expect(page.getByPlaceholder('My Radio Station')).toBeVisible()

    // When I fill in the station name
    await page.getByPlaceholder('My Radio Station').fill('My Test Radio')

    // And I fill in the stream URL
    await page.getByPlaceholder('https://...').fill('https://example.com/stream.mp3')

    // And I click "Add Station"
    await page.getByRole('button', { name: 'Add Station' }).click()

    // Then the station appears in the playlist
    await expect(page.getByRole('listitem').filter({ hasText: 'My Test Radio' })).toBeVisible()

    // And the form closes
    await expect(page.getByPlaceholder('My Radio Station')).not.toBeVisible()
  })

  // Scenario 5: Edit existing station in playlist
  test('should edit an existing station', async ({ page }) => {
    // Given I have a station in my playlist - add one first
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Old Name')
    await page.getByPlaceholder('https://...').fill('https://example.com/old.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // Wait for the station to appear
    await expect(page.getByRole('listitem').filter({ hasText: 'Old Name' })).toBeVisible()

    // When I hover over the station and click edit
    const stationItem = page.getByRole('listitem').filter({ hasText: 'Old Name' })
    await stationItem.hover()
    await stationItem.getByRole('button', { name: 'Edit' }).click()

    // Then the edit form appears with current values
    await expect(page.getByPlaceholder('My Radio Station')).toHaveValue('Old Name')

    // When I change the name
    await page.getByPlaceholder('My Radio Station').fill('New Name')

    // And click "Save Changes"
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Then the station is renamed
    await expect(page.getByRole('listitem').filter({ hasText: 'New Name' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Old Name' })).not.toBeVisible()
  })

  // Scenario 7: Export playlist
  test('should export playlist to JSON file', async ({ page }) => {
    // Given I have at least one station in my playlist
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Export Test Radio')
    await page.getByPlaceholder('https://...').fill('https://example.com/export.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Export Test Radio' })).toBeVisible()

    // When I click the export button
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()

    // Then a file is downloaded
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('playlist.json')

    // And the file contains the station data
    const filePath = await download.path()
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const playlist = JSON.parse(content)
      // Playlist has { items: [...] } structure
      expect(playlist.items).toBeDefined()
      expect(Array.isArray(playlist.items)).toBe(true)
      expect(playlist.items.some((s: { name: string }) => s.name === 'Export Test Radio')).toBe(true)
    }
  })

  // Scenario 7: Import playlist
  test('should import playlist from JSON file', async ({ page }) => {
    // Given I have an empty or existing playlist
    // Import expects { items: [...] } format
    const testPlaylist = {
      items: [
        { id: '1001', name: 'Imported Radio 1', url: 'https://example.com/import1.mp3' },
        { id: '1002', name: 'Imported Radio 2', url: 'https://example.com/import2.mp3' },
      ]
    }

    // Create a temporary file for import
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    const importFilePath = path.join(tempDir, 'test-import.json')
    fs.writeFileSync(importFilePath, JSON.stringify(testPlaylist))

    // When I click the import button and select a file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Import' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(importFilePath)

    // Then the stations from the file are loaded
    await expect(page.getByRole('listitem').filter({ hasText: 'Imported Radio 1' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Imported Radio 2' })).toBeVisible()

    // Cleanup
    fs.unlinkSync(importFilePath)
  })

  // Scenario 9: Switch between stations
  test('should switch between stations in playlist', async ({ page }) => {
    // Given I have multiple stations in my playlist
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Station A')
    await page.getByPlaceholder('https://...').fill('https://icecast6.play.cz/radio1-128.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Station B')
    await page.getByPlaceholder('https://...').fill('https://icecast6.play.cz/cro1-128.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // When I click on Station A in the playlist
    await page.getByRole('listitem').filter({ hasText: 'Station A' }).click()

    // Then Station A should be selected - check Now Playing section
    await expect(page.getByText('Now Playing')).toBeVisible()
    await expect(page.getByText('Station A').first()).toBeVisible()

    // When I click on Station B
    await page.getByRole('listitem').filter({ hasText: 'Station B' }).click()

    // Then Station B should be selected
    await expect(page.getByText('Station B').first()).toBeVisible()
  })

  // Test delete station
  test('should delete a station from playlist', async ({ page }) => {
    // Given I have a station in my playlist
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('My Radio Station').fill('To Delete')
    await page.getByPlaceholder('https://...').fill('https://example.com/delete.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'To Delete' })).toBeVisible()

    // When I hover over the station and click delete
    const stationItem = page.getByRole('listitem').filter({ hasText: 'To Delete' })
    await stationItem.hover()
    await stationItem.getByRole('button', { name: 'Delete' }).click()

    // Then the station is removed from the playlist
    await expect(page.getByRole('listitem').filter({ hasText: 'To Delete' })).not.toBeVisible()
  })
})
