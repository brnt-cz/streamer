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
    await page.getByRole('button', { name: 'Add stream' }).click()

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
    await page.getByRole('button', { name: 'Add stream' }).click()
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
    await page.getByRole('button', { name: 'Add stream' }).click()
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
      // Playlist has { items: [...], folders: [...] } structure
      expect(playlist.items).toBeDefined()
      expect(Array.isArray(playlist.items)).toBe(true)
      expect(playlist.items.some((s: { name: string }) => s.name === 'Export Test Radio')).toBe(true)
      // Folders array should exist (even if empty)
      expect(playlist.folders).toBeDefined()
      expect(Array.isArray(playlist.folders)).toBe(true)
    }
  })

  // Scenario 7: Import playlist
  test('should import playlist from JSON file', async ({ page }) => {
    // Given I have an empty or existing playlist
    // Import expects { items: [...], folders: [...] } format
    const testPlaylist = {
      items: [
        { id: '1001', name: 'Imported Radio 1', url: 'https://example.com/import1.mp3' },
        { id: '1002', name: 'Imported Radio 2', url: 'https://example.com/import2.mp3' },
      ],
      folders: []
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

  // Test backward compatibility - import old format without folders
  test('should import playlist from old JSON format without folders', async ({ page }) => {
    // Given an old format playlist without folders array
    const oldFormatPlaylist = {
      items: [
        { id: '2001', name: 'Legacy Radio 1', url: 'https://example.com/legacy1.mp3' },
        { id: '2002', name: 'Legacy Radio 2', url: 'https://example.com/legacy2.mp3' },
      ]
    }

    // Create a temporary file for import
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    const importFilePath = path.join(tempDir, 'test-import-legacy.json')
    fs.writeFileSync(importFilePath, JSON.stringify(oldFormatPlaylist))

    // When I click the import button and select a file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Import' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(importFilePath)

    // Then the stations from the file are loaded
    await expect(page.getByRole('listitem').filter({ hasText: 'Legacy Radio 1' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Legacy Radio 2' })).toBeVisible()

    // Cleanup
    fs.unlinkSync(importFilePath)
  })

  // Scenario 9: Switch between stations
  test('should switch between stations in playlist', async ({ page }) => {
    // Given I have multiple stations in my playlist
    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Station A')
    await page.getByPlaceholder('https://...').fill('https://icecast6.play.cz/radio1-128.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    await page.getByRole('button', { name: 'Add stream' }).click()
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
    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('To Delete')
    await page.getByPlaceholder('https://...').fill('https://example.com/delete.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'To Delete' })).toBeVisible()

    // When I hover over the station and click delete
    const stationItem = page.getByRole('listitem').filter({ hasText: 'To Delete' })
    await stationItem.hover()
    await stationItem.getByRole('button', { name: 'Delete' }).click()

    // And confirm the deletion in the dialog
    await expect(page.getByText('Delete station?')).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).last().click()

    // Then the station is removed from the playlist
    await expect(page.getByRole('listitem').filter({ hasText: 'To Delete' })).not.toBeVisible()
  })
})

test.describe('Folder Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.context().clearCookies()
    await page.reload()
  })

  test('should create a new folder', async ({ page }) => {
    // Given I am on the main page
    await expect(page.getByRole('heading', { name: 'Your Stations' })).toBeVisible()

    // When I click the "Create folder" button
    await page.getByRole('button', { name: /Create folder/i }).click()

    // Then the folder form appears
    await expect(page.getByPlaceholder('My folder')).toBeVisible()

    // When I fill in the folder name
    await page.getByPlaceholder('My folder').fill('Rock Stations')

    // And I click "Create folder"
    await page.getByRole('button', { name: 'Create folder' }).last().click()

    // Then the folder appears in the list
    await expect(page.getByText('Rock Stations')).toBeVisible()

    // And the form closes
    await expect(page.getByPlaceholder('My folder')).not.toBeVisible()
  })

  test('should rename a folder', async ({ page }) => {
    // Given I have a folder
    await page.getByRole('button', { name: /Create folder/i }).click()
    await page.getByPlaceholder('My folder').fill('Old Folder Name')
    await page.getByRole('button', { name: 'Create folder' }).last().click()
    await expect(page.getByText('Old Folder Name')).toBeVisible()

    // When I hover over the folder and click rename
    const folderItem = page.locator('div').filter({ hasText: /^Old Folder Name/ }).first()
    await folderItem.hover()
    await folderItem.getByRole('button', { name: 'Rename folder' }).click()

    // Then the rename form appears with current name
    await expect(page.getByPlaceholder('My folder')).toHaveValue('Old Folder Name')

    // When I change the name
    await page.getByPlaceholder('My folder').fill('New Folder Name')

    // And click "Save Changes"
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Then the folder is renamed
    await expect(page.getByText('New Folder Name')).toBeVisible()
    await expect(page.getByText('Old Folder Name')).not.toBeVisible()
  })

  test('should delete a folder and move stations to root', async ({ page }) => {
    const playlistPanel = page.locator('aside.playlist-panel')

    // Given I have a folder with a station
    await page.getByRole('button', { name: /Create folder/i }).click()
    await page.getByPlaceholder('My folder').fill('Folder To Delete')
    await page.getByRole('button', { name: 'Create folder' }).last().click()
    await expect(playlistPanel.getByText('Folder To Delete')).toBeVisible()

    // Add a station first
    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Station In Folder')
    await page.getByPlaceholder('https://...').fill('https://example.com/folder-station.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()
    await expect(playlistPanel.getByText('Station In Folder')).toBeVisible()

    // Drag the station to the folder
    const stationItem = playlistPanel.getByRole('listitem').filter({ hasText: 'Station In Folder' })
    const folderHeader = playlistPanel.locator('div').filter({ hasText: /^Folder To Delete/ }).first()
    await stationItem.dragTo(folderHeader)

    // Verify station is in folder (station moved from root - URL no longer visible, only shown for root items)
    await expect(playlistPanel.getByText('https://example.com/folder-station.mp3')).not.toBeVisible()

    // When I hover over the folder and click delete
    await folderHeader.hover()
    await folderHeader.getByRole('button', { name: 'Delete folder' }).click()

    // And confirm the deletion in the dialog
    await expect(page.getByText('Delete folder?')).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).last().click()

    // Then the folder is removed
    await expect(playlistPanel.getByText('Folder To Delete')).not.toBeVisible()

    // And the station is still visible at root level (now as a listitem)
    await expect(playlistPanel.getByRole('listitem').filter({ hasText: 'Station In Folder' })).toBeVisible()
  })

  test('should collapse and expand a folder', async ({ page }) => {
    const playlistPanel = page.locator('aside.playlist-panel')

    // Given I have a folder with a station
    await page.getByRole('button', { name: /Create folder/i }).click()
    await page.getByPlaceholder('My folder').fill('Collapsible Folder')
    await page.getByRole('button', { name: 'Create folder' }).last().click()

    // Add a station and drag to folder
    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Nested Station')
    await page.getByPlaceholder('https://...').fill('https://example.com/nested.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    const stationItem = playlistPanel.getByRole('listitem').filter({ hasText: 'Nested Station' })
    const folderHeader = playlistPanel.locator('div').filter({ hasText: /^Collapsible Folder/ }).first()
    await stationItem.dragTo(folderHeader)

    // Station should be visible in expanded folder
    await expect(playlistPanel.getByText('Nested Station')).toBeVisible()

    // When I click the collapse button (chevron)
    await folderHeader.locator('button').first().click()

    // Then the station is hidden
    await expect(playlistPanel.getByText('Nested Station')).not.toBeVisible()

    // When I click expand again
    await folderHeader.locator('button').first().click()

    // Then the station is visible again
    await expect(playlistPanel.getByText('Nested Station')).toBeVisible()
  })

  test('should drag station to folder', async ({ page }) => {
    const playlistPanel = page.locator('aside.playlist-panel')

    // Given I have a folder and a station
    await page.getByRole('button', { name: /Create folder/i }).click()
    await page.getByPlaceholder('My folder').fill('Target Folder')
    await page.getByRole('button', { name: 'Create folder' }).last().click()

    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Draggable Station')
    await page.getByPlaceholder('https://...').fill('https://example.com/drag.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // When I drag the station to the folder
    const stationItem = playlistPanel.getByRole('listitem').filter({ hasText: 'Draggable Station' })
    const folderHeader = playlistPanel.locator('div').filter({ hasText: /^Target Folder/ }).first()
    await stationItem.dragTo(folderHeader)

    // Then the station is moved from root level to inside the folder (URL no longer visible, only shown for root items)
    await expect(playlistPanel.getByText('https://example.com/drag.mp3')).not.toBeVisible()
    // But the station name should still be visible inside the expanded folder
    await expect(playlistPanel.getByText('Draggable Station')).toBeVisible()
  })

  test('should export playlist with folders', async ({ page }) => {
    // Given I have a folder with a station
    await page.getByRole('button', { name: /Create folder/i }).click()
    await page.getByPlaceholder('My folder').fill('Export Folder')
    await page.getByRole('button', { name: 'Create folder' }).last().click()

    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Folder Station')
    await page.getByPlaceholder('https://...').fill('https://example.com/folder-export.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // Drag station to folder
    const stationItem = page.getByRole('listitem').filter({ hasText: 'Folder Station' })
    const folderHeader = page.locator('div').filter({ hasText: /^Export Folder/ }).first()
    await stationItem.dragTo(folderHeader)

    // When I export the playlist
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    const download = await downloadPromise

    // Then the exported file contains folders
    const filePath = await download.path()
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const playlist = JSON.parse(content)

      expect(playlist.folders).toBeDefined()
      expect(playlist.folders.length).toBe(1)
      expect(playlist.folders[0].name).toBe('Export Folder')

      // And the station has folderId
      const station = playlist.items.find((s: { name: string }) => s.name === 'Folder Station')
      expect(station).toBeDefined()
      expect(station.folderId).toBe(playlist.folders[0].id)
    }
  })

  test('should import playlist with folders', async ({ page }) => {
    const playlistPanel = page.locator('aside.playlist-panel')

    // Given a playlist file with folders
    const folderId = 'test-folder-id'
    const testPlaylist = {
      items: [
        { id: '3001', name: 'Root Station', url: 'https://example.com/root.mp3' },
        { id: '3002', name: 'Folder Station', url: 'https://example.com/in-folder.mp3', folderId },
      ],
      folders: [
        { id: folderId, name: 'Imported Folder' }
      ]
    }

    // Create a temporary file for import
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    const importFilePath = path.join(tempDir, 'test-import-folders.json')
    fs.writeFileSync(importFilePath, JSON.stringify(testPlaylist))

    // When I import the playlist
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Import' }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(importFilePath)

    // Then the folder is created
    await expect(playlistPanel.getByText('Imported Folder')).toBeVisible()

    // And root station is visible at root level (as a listitem)
    await expect(playlistPanel.getByRole('listitem').filter({ hasText: 'Root Station' })).toBeVisible()

    // And folder station is inside the folder (visible in expanded folder, URL not visible since it's not a root item)
    await expect(playlistPanel.getByText('Folder Station')).toBeVisible()
    await expect(playlistPanel.getByText('https://example.com/in-folder.mp3')).not.toBeVisible()

    // Cleanup
    fs.unlinkSync(importFilePath)
  })

  test('should highlight collapsed folder when active station is inside', async ({ page }) => {
    const playlistPanel = page.locator('aside.playlist-panel')

    // Given I have a folder with a station
    await page.getByRole('button', { name: /Create folder/i }).click()
    await page.getByPlaceholder('My folder').fill('Active Folder')
    await page.getByRole('button', { name: 'Create folder' }).last().click()

    await page.getByRole('button', { name: 'Add stream' }).click()
    await page.getByPlaceholder('My Radio Station').fill('Active Station')
    await page.getByPlaceholder('https://...').fill('https://icecast6.play.cz/radio1-128.mp3')
    await page.getByRole('button', { name: 'Add Station' }).click()

    // Drag station to folder
    const stationItem = playlistPanel.getByRole('listitem').filter({ hasText: 'Active Station' })
    const folderHeader = playlistPanel.locator('div').filter({ hasText: /^Active Folder/ }).first()
    await stationItem.dragTo(folderHeader)

    // Select the station (click on it inside the folder)
    await playlistPanel.getByText('Active Station').click()

    // Wait for it to be selected
    await expect(page.getByText('Now Playing')).toBeVisible()

    // Collapse the folder
    await folderHeader.locator('button').first().click()

    // Then the folder header should have the active styling (brand color border at 20% opacity)
    await expect(folderHeader).toHaveCSS('border-color', /oklab\(.+ \/ 0\.2\)/)
  })
})
