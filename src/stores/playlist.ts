import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { readStored, writeStored } from '../utils/storage'

export interface StreamItem {
  id: string
  name: string
  url: string
  bitrate?: string
  logo?: string
  folderId?: string
}

export interface PlaylistFolder {
  id: string
  name: string
}

interface PlaylistData {
  items: StreamItem[]
  folders?: PlaylistFolder[]
}

// klíč v localStorage : starší cookie, ze které se jednorázově migruje
const STORAGE_PLAYLIST = 'streamer_playlist'
const STORAGE_LAST_STREAM = 'streamer_last_stream'
const STORAGE_FOLDER_COLLAPSED = 'streamer_folder_collapsed'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString() + Math.random().toString(36).substring(2, 9)
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function extractBitrateFromUrl(url: string): string | undefined {
  // Match common bitrate patterns in URLs like: -128.mp3, /128/, _128k, color128.mp3, express128mp3
  const patterns = [
    /[-_.](\d{2,3})\.(?:mp3|aac|m3u8)/i,  // -128.mp3, _192.aac
    /[-_?](\d{2,3})k?(?:bps)?[-_.]/i,      // -128kbps-, _64k_
    /\/(\d{2,3})\//,                       // /128/
    /(\d{2,3})(?:kbps|k)/i,                // 128kbps, 128k
    /[a-z](\d{2,3})\.(?:mp3|aac|m3u8)/i,  // color128.mp3, express128.mp3
    /[a-z](\d{2,3})(?:mp3|aac)/i          // express128mp3 (no dot)
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const bitrate = parseInt(match[1])
      if (bitrate >= 32 && bitrate <= 320) {
        return match[1]
      }
    }
  }
  return undefined
}

interface LoadedPlaylistData {
  items: StreamItem[]
  folders: PlaylistFolder[]
}

function loadPlaylist(): LoadedPlaylistData {
  const defaultItems: StreamItem[] = [
    {
      id: '1',
      name: 'Radio 1',
      url: 'https://icecast6.play.cz/radio1-128.mp3',
      bitrate: '128'
    }
  ]

  try {
    const stored = readStored(STORAGE_PLAYLIST, STORAGE_PLAYLIST)
    if (stored) {
      const data = JSON.parse(stored) as PlaylistData
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // Add bitrate if missing
        const items = data.items.map(item => ({
          ...item,
          bitrate: item.bitrate || extractBitrateFromUrl(item.url)
        }))
        const folders = Array.isArray(data.folders) ? data.folders : []
        return { items, folders }
      }
    }
  } catch (e) {
    console.warn('Failed to load playlist:', e)
  }

  return { items: defaultItems, folders: [] }
}

function loadCollapsedState(): Record<string, boolean> {
  try {
    const stored = readStored(STORAGE_FOLDER_COLLAPSED, STORAGE_FOLDER_COLLAPSED)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load folder collapsed state:', e)
  }
  return {}
}

function loadLastStream(items: StreamItem[]): string | null {
  try {
    const lastStreamId = readStored(STORAGE_LAST_STREAM, STORAGE_LAST_STREAM)
    if (lastStreamId && items.some(item => item.id === lastStreamId)) {
      return lastStreamId
    }
  } catch (e) {
    console.warn('Failed to load last stream:', e)
  }
  return items[0]?.id || null
}

function savePlaylist(items: StreamItem[], folders: PlaylistFolder[]): boolean {
  return writeStored(STORAGE_PLAYLIST, JSON.stringify({ items, folders }))
}

function saveCollapsedState(collapsedState: Record<string, boolean>): boolean {
  return writeStored(STORAGE_FOLDER_COLLAPSED, JSON.stringify(collapsedState))
}

function saveLastStream(id: string | null): boolean {
  if (!id) return true
  return writeStored(STORAGE_LAST_STREAM, id)
}

export const usePlaylistStore = defineStore('playlist', () => {
  const loadedData = loadPlaylist()
  const items = ref<StreamItem[]>(loadedData.items)
  const folders = ref<PlaylistFolder[]>(loadedData.folders)
  const folderCollapsedState = ref<Record<string, boolean>>(loadCollapsedState())
  const currentId = ref<string | null>(loadLastStream(items.value))
  // true, když se playlist nepodařilo uložit — UI to musí ukázat, jinak
  // uživatel o změny přijde a nedozví se to
  const storageFailed = ref(false)

  const currentStream = computed(() => {
    return items.value.find(item => item.id === currentId.value) || null
  })

  // Get items that are not in any folder
  const rootItems = computed(() => {
    return items.value.filter(item => !item.folderId)
  })

  // Get items for a specific folder
  function getItemsByFolder(folderId: string): StreamItem[] {
    return items.value.filter(item => item.folderId === folderId)
  }

  watch([items, folders], () => {
    storageFailed.value = !savePlaylist(items.value, folders.value)
  }, { deep: true })
  watch(folderCollapsedState, () => saveCollapsedState(folderCollapsedState.value), { deep: true })
  watch(currentId, (id) => saveLastStream(id))

  function addStream(name: string, url: string, bitrate?: string, logo?: string): string {
    const id = generateId()
    items.value.push({ id, name, url, bitrate, logo })
    return id
  }

  function removeStream(id: string) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      if (currentId.value === id) {
        currentId.value = items.value[0]?.id || null
      }
    }
  }

  function selectStream(id: string) {
    currentId.value = id
  }

  function updateStream(id: string, name: string, url: string, bitrate?: string, logo?: string) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.name = name
      item.url = url
      item.bitrate = bitrate
      item.logo = logo
    }
  }

  function moveStream(fromId: string, toId: string) {
    const fromIndex = items.value.findIndex(item => item.id === fromId)
    const toIndex = items.value.findIndex(item => item.id === toId)
    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = items.value.splice(fromIndex, 1)
      items.value.splice(toIndex, 0, moved)
    }
  }

  // Folder management
  function addFolder(name: string): string {
    const id = generateId()
    folders.value.push({ id, name })
    return id
  }

  function removeFolder(folderId: string) {
    const index = folders.value.findIndex(f => f.id === folderId)
    if (index !== -1) {
      // Move all items from this folder to root
      items.value.forEach(item => {
        if (item.folderId === folderId) {
          item.folderId = undefined
        }
      })
      folders.value.splice(index, 1)
      delete folderCollapsedState.value[folderId]
    }
  }

  function renameFolder(folderId: string, newName: string) {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      folder.name = newName
    }
  }

  function moveStreamToFolder(streamId: string, folderId: string | undefined) {
    const item = items.value.find(i => i.id === streamId)
    if (item) {
      item.folderId = folderId
    }
  }

  function toggleFolderCollapsed(folderId: string) {
    folderCollapsedState.value[folderId] = !folderCollapsedState.value[folderId]
  }

  function isFolderCollapsed(folderId: string): boolean {
    return folderCollapsedState.value[folderId] ?? false
  }

  function moveFolder(fromId: string, toId: string) {
    const fromIndex = folders.value.findIndex(f => f.id === fromId)
    const toIndex = folders.value.findIndex(f => f.id === toId)
    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = folders.value.splice(fromIndex, 1)
      folders.value.splice(toIndex, 0, moved)
    }
  }

  function exportPlaylist(): string {
    return JSON.stringify({ items: items.value, folders: folders.value }, null, 2)
  }

  function importPlaylist(jsonString: string): boolean {
    try {
      const data: unknown = JSON.parse(jsonString)
      if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as PlaylistData).items)) {
        const rawItems = (data as PlaylistData).items
        // Validate items and URL format
        const validItems = rawItems.filter((item): item is StreamItem =>
          item !== null &&
          typeof item === 'object' &&
          typeof item.name === 'string' &&
          typeof item.url === 'string' &&
          isValidUrl(item.url)
        ).map((item, index) => ({
          id: item.id || generateId() + index,
          name: item.name,
          url: item.url,
          bitrate: item.bitrate || extractBitrateFromUrl(item.url),
          logo: item.logo,
          folderId: item.folderId
        }))

        // Import folders if present
        const rawFolders = (data as PlaylistData).folders
        const validFolders: PlaylistFolder[] = Array.isArray(rawFolders)
          ? rawFolders.filter((f): f is PlaylistFolder =>
              f !== null &&
              typeof f === 'object' &&
              typeof f.id === 'string' &&
              typeof f.name === 'string'
            )
          : []

        if (validItems.length > 0) {
          items.value = validItems
          folders.value = validFolders
          currentId.value = validItems[0].id
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  function downloadPlaylist(): void {
    try {
      const json = exportPlaylist()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'playlist.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Download failed - silently ignore (user can try again)
    }
  }

  return {
    items,
    folders,
    folderCollapsedState,
    storageFailed,
    currentId,
    currentStream,
    rootItems,
    getItemsByFolder,
    addStream,
    removeStream,
    selectStream,
    updateStream,
    moveStream,
    addFolder,
    removeFolder,
    renameFolder,
    moveStreamToFolder,
    toggleFolderCollapsed,
    isFolderCollapsed,
    moveFolder,
    exportPlaylist,
    importPlaylist,
    downloadPlaylist
  }
})
