import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface StreamItem {
  id: string
  name: string
  url: string
  bitrate?: string
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

const COOKIE_PLAYLIST = 'streamer_playlist'
const COOKIE_LAST_STREAM = 'streamer_last_stream'
const COOKIE_FOLDER_COLLAPSED = 'streamer_folder_collapsed'
const COOKIE_DAYS = 365

function isSecureContext(): boolean {
  return window.location.protocol === 'https:'
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  const secure = isSecureContext() ? ';Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`
}

function getCookie(name: string): string | null {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  const found = cookies.find(c => c.trim().startsWith(nameEQ))
  return found ? decodeURIComponent(found.trim().substring(nameEQ.length)) : null
}

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

function loadPlaylistFromCookie(): LoadedPlaylistData {
  const defaultItems: StreamItem[] = [
    {
      id: '1',
      name: 'Radio 1',
      url: 'https://icecast6.play.cz/radio1-128.mp3',
      bitrate: '128'
    }
  ]

  try {
    const cookieValue = getCookie(COOKIE_PLAYLIST)
    if (cookieValue) {
      const data = JSON.parse(cookieValue) as PlaylistData
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
    console.warn('Failed to load playlist from cookie:', e)
  }

  return { items: defaultItems, folders: [] }
}

function loadCollapsedStateFromCookie(): Record<string, boolean> {
  try {
    const cookieValue = getCookie(COOKIE_FOLDER_COLLAPSED)
    if (cookieValue) {
      return JSON.parse(cookieValue)
    }
  } catch (e) {
    console.warn('Failed to load folder collapsed state from cookie:', e)
  }
  return {}
}

function loadLastStreamFromCookie(items: StreamItem[]): string | null {
  try {
    const lastStreamId = getCookie(COOKIE_LAST_STREAM)
    if (lastStreamId && items.some(item => item.id === lastStreamId)) {
      return lastStreamId
    }
  } catch (e) {
    console.warn('Failed to load last stream from cookie:', e)
  }
  return items[0]?.id || null
}

function savePlaylistToCookie(items: StreamItem[], folders: PlaylistFolder[]) {
  try {
    setCookie(COOKIE_PLAYLIST, JSON.stringify({ items, folders }), COOKIE_DAYS)
  } catch (e) {
    console.warn('Failed to save playlist to cookie:', e)
  }
}

function saveCollapsedStateToCookie(collapsedState: Record<string, boolean>) {
  try {
    setCookie(COOKIE_FOLDER_COLLAPSED, JSON.stringify(collapsedState), COOKIE_DAYS)
  } catch (e) {
    console.warn('Failed to save folder collapsed state to cookie:', e)
  }
}

function saveLastStreamToCookie(id: string | null) {
  try {
    if (id) {
      setCookie(COOKIE_LAST_STREAM, id, COOKIE_DAYS)
    }
  } catch (e) {
    console.warn('Failed to save last stream to cookie:', e)
  }
}

export const usePlaylistStore = defineStore('playlist', () => {
  const loadedData = loadPlaylistFromCookie()
  const items = ref<StreamItem[]>(loadedData.items)
  const folders = ref<PlaylistFolder[]>(loadedData.folders)
  const folderCollapsedState = ref<Record<string, boolean>>(loadCollapsedStateFromCookie())
  const currentId = ref<string | null>(loadLastStreamFromCookie(items.value))

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

  watch([items, folders], () => savePlaylistToCookie(items.value, folders.value), { deep: true })
  watch(folderCollapsedState, () => saveCollapsedStateToCookie(folderCollapsedState.value), { deep: true })
  watch(currentId, (id) => saveLastStreamToCookie(id))

  function addStream(name: string, url: string, bitrate?: string): string {
    const id = generateId()
    items.value.push({ id, name, url, bitrate })
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

  function updateStream(id: string, name: string, url: string, bitrate?: string) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.name = name
      item.url = url
      item.bitrate = bitrate
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
