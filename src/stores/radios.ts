import { ref, computed } from 'vue'
import radiosData from '../data/radios.json'
import radiosInternationalData from '../data/radios-international.json'

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
  /** ISO 3166-1 alpha-2 */
  country: string
  streams: RadioStreams
}

export interface StreamInfo {
  url: string
  name: string
  format: string
  bitrate: string
}

export type StreamFormat = 'mp3' | 'aac' | 'wma' | 'hls'
export type StreamBitrate = '32' | '48' | '64' | '96' | '128' | '192' | '256' | '320'

const FORMATS: StreamFormat[] = ['mp3', 'aac', 'hls', 'wma']
const BITRATES: StreamBitrate[] = ['320', '256', '192', '128', '96', '64', '48', '32']

// Validate and cast JSON data to Radio type
function validateRadios(data: unknown): Radio[] {
  if (!Array.isArray(data)) return []
  return data.filter((item): item is Radio =>
    item !== null &&
    typeof item === 'object' &&
    typeof (item as Radio).id === 'string' &&
    typeof (item as Radio).name === 'string' &&
    typeof (item as Radio).logo === 'string' &&
    typeof (item as Radio).country === 'string' &&
    Array.isArray((item as Radio).categories) &&
    typeof (item as Radio).streams === 'object'
  )
}

const czechRadios = validateRadios(radiosData)
const internationalRadios = validateRadios(radiosInternationalData)
const radios = ref<Radio[]>([...czechRadios, ...internationalRadios])

// Helper to find radio by ID
function findRadioById(radioId: string): Radio | undefined {
  return radios.value.find(r => r.id === radioId)
}

// Helper to sort bitrates in descending order
function sortBitratesDescending(bitrates: string[]): string[] {
  return bitrates.sort((a, b) => parseInt(b) - parseInt(a))
}

export function useRadios() {
  // Země seřazené podle počtu stanic, ať jsou nahoře ty užitečné
  const countries = computed(() => {
    const counts = new Map<string, number>()
    radios.value.forEach(radio => {
      counts.set(radio.country, (counts.get(radio.country) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([code, count]) => ({ code, count }))
  })

  const categories = computed(() => {
    const cats = new Set<string>()
    radios.value.forEach(radio => {
      radio.categories.forEach(cat => cats.add(cat))
    })
    return Array.from(cats).sort()
  })

  function getAvailableFormats(radioId: string): StreamFormat[] {
    const radio = findRadioById(radioId)
    if (!radio?.streams) return []
    return Object.keys(radio.streams) as StreamFormat[]
  }

  function getAvailableBitrates(radioId: string, format: StreamFormat): string[] {
    const radio = findRadioById(radioId)
    if (!radio?.streams?.[format]) return []
    return sortBitratesDescending(Object.keys(radio.streams[format]))
  }

  function getStreamUrl(radioId: string, format: StreamFormat, bitrate: string): string | null {
    const radio = findRadioById(radioId)
    if (!radio?.streams?.[format]) return null
    return radio.streams[format][bitrate] || null
  }

  function getBestStream(radioId: string): StreamInfo | null {
    const radio = findRadioById(radioId)
    if (!radio?.streams) return null

    // Prefer mp3 > aac > wma
    for (const format of FORMATS) {
      if (radio.streams[format]) {
        const bitrates = sortBitratesDescending(Object.keys(radio.streams[format]))
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

  function filterRadios(search: string, category?: string, format?: StreamFormat, country?: string): Radio[] {
    let filtered = radios.value

    if (country) {
      filtered = filtered.filter(r => r.country === country)
    }

    if (category) {
      filtered = filtered.filter(r => r.categories.includes(category))
    }

    if (format) {
      filtered = filtered.filter(r => r.streams && r.streams[format])
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
    countries,
    formats: FORMATS,
    bitrates: BITRATES,
    getAvailableFormats,
    getAvailableBitrates,
    getStreamUrl,
    getBestStream,
    filterRadios
  }
}
