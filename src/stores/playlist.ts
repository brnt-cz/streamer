import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface StreamItem {
  id: string
  name: string
  url: string
}

interface PlaylistData {
  items: StreamItem[]
}

const COOKIE_PLAYLIST = 'streamer_playlist'
const COOKIE_LAST_STREAM = 'streamer_last_stream'
const COOKIE_DAYS = 365

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

function loadPlaylistFromCookie(): StreamItem[] {
  const defaultItems: StreamItem[] = [
    {
      id: '1',
      name: 'Radio 1',
      url: 'https://icecast6.play.cz/radio1-128.mp3'
    }
  ]

  try {
    const cookieValue = getCookie(COOKIE_PLAYLIST)
    if (cookieValue) {
      const data = JSON.parse(cookieValue) as PlaylistData
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        return data.items
      }
    }
  } catch (e) {
    console.warn('Failed to load playlist from cookie:', e)
  }

  return defaultItems
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

function savePlaylistToCookie(items: StreamItem[]) {
  try {
    setCookie(COOKIE_PLAYLIST, JSON.stringify({ items }), COOKIE_DAYS)
  } catch (e) {
    console.warn('Failed to save playlist to cookie:', e)
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
  const items = ref<StreamItem[]>(loadPlaylistFromCookie())
  const currentId = ref<string | null>(loadLastStreamFromCookie(items.value))

  const currentStream = computed(() => {
    return items.value.find(item => item.id === currentId.value) || null
  })

  watch(items, () => savePlaylistToCookie(items.value), { deep: true })
  watch(currentId, (id) => saveLastStreamToCookie(id))

  function addStream(name: string, url: string) {
    const id = Date.now().toString()
    items.value.push({ id, name, url })
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

  function updateStream(id: string, name: string, url: string) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.name = name
      item.url = url
    }
  }

  function exportPlaylist(): string {
    return JSON.stringify({ items: items.value }, null, 2)
  }

  function importPlaylist(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)
      if (data.items && Array.isArray(data.items)) {
        // Validate items
        const validItems = data.items.filter((item: StreamItem) =>
          item && typeof item.name === 'string' && typeof item.url === 'string'
        ).map((item: StreamItem, index: number) => ({
          id: item.id || Date.now().toString() + index,
          name: item.name,
          url: item.url
        }))

        if (validItems.length > 0) {
          items.value = validItems
          currentId.value = validItems[0].id
          return true
        }
      }
      return false
    } catch (e) {
      console.warn('Failed to import playlist:', e)
      return false
    }
  }

  function downloadPlaylist() {
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
  }

  return {
    items,
    currentId,
    currentStream,
    addStream,
    removeStream,
    selectStream,
    updateStream,
    exportPlaylist,
    importPlaylist,
    downloadPlaylist
  }
})
