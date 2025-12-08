import { ref, computed } from 'vue'
import radiosData from '../data/radios.json'

export interface RadioStreams {
  [format: string]: {
    [bitrate: string]: string
  }
}

export interface Radio {
  id: string
  name: string
  logo: string
  categories: string[]
  streams: RadioStreams
}

export interface StreamInfo {
  url: string
  name: string
  format: string
  bitrate: string
}

export type StreamFormat = 'mp3' | 'aac' | 'wma'
export type StreamBitrate = '32' | '48' | '64' | '128' | '192' | '256' | '320'

const FORMATS: StreamFormat[] = ['mp3', 'aac', 'wma']
const BITRATES: StreamBitrate[] = ['320', '256', '192', '128', '64', '48', '32']

const radios = ref<Radio[]>(radiosData as unknown as Radio[])

export function useRadios() {
  const categories = computed(() => {
    const cats = new Set<string>()
    radios.value.forEach(radio => {
      radio.categories.forEach(cat => cats.add(cat))
    })
    return Array.from(cats).sort()
  })

  function getAvailableFormats(radioId: string): StreamFormat[] {
    const radio = radios.value.find(r => r.id === radioId)
    if (!radio || !radio.streams) return []
    return Object.keys(radio.streams) as StreamFormat[]
  }

  function getAvailableBitrates(radioId: string, format: StreamFormat): string[] {
    const radio = radios.value.find(r => r.id === radioId)
    if (!radio || !radio.streams || !radio.streams[format]) return []
    return Object.keys(radio.streams[format]).sort((a, b) => parseInt(b) - parseInt(a))
  }

  function getStreamUrl(radioId: string, format: StreamFormat, bitrate: string): string | null {
    const radio = radios.value.find(r => r.id === radioId)
    if (!radio || !radio.streams || !radio.streams[format]) return null
    return radio.streams[format][bitrate] || null
  }

  function getBestStream(radioId: string): StreamInfo | null {
    const radio = radios.value.find(r => r.id === radioId)
    if (!radio || !radio.streams) return null

    // Prefer mp3 > aac > wma
    for (const format of FORMATS) {
      if (radio.streams[format]) {
        const bitrates = Object.keys(radio.streams[format]).sort((a, b) => parseInt(b) - parseInt(a))
        if (bitrates.length > 0) {
          const bestBitrate = bitrates[0]
          return {
            url: radio.streams[format][bestBitrate],
            name: radio.name,
            format,
            bitrate: bestBitrate
          }
        }
      }
    }

    return null
  }

  function filterRadios(search: string, category?: string): Radio[] {
    let filtered = radios.value

    if (category) {
      filtered = filtered.filter(r => r.categories.includes(category))
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.id.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  return {
    radios,
    categories,
    formats: FORMATS,
    bitrates: BITRATES,
    getAvailableFormats,
    getAvailableBitrates,
    getStreamUrl,
    getBestStream,
    filterRadios
  }
}
