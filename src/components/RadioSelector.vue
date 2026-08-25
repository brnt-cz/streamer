<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRadios, type Radio, type StreamFormat } from '../stores/radios'
import { usePlaylistStore } from '../stores/playlist'
import { useI18n } from '../composables/useI18n'
import StationName from './StationName.vue'

const { categories, formats, getAvailableFormats, getAvailableBitrates, getStreamUrl, filterRadios } = useRadios()
const store = usePlaylistStore()
const { t, getCategoryLabel } = useI18n()

const isOpen = ref(false)
const search = ref('')
const debouncedSearch = ref('')
const selectedCategory = ref('')
const selectedFormat = ref<StreamFormat | ''>('')
const selectedBitrate = ref('128')
const selectedRadio = ref<Radio | null>(null)
const isAdding = ref(false)
const addError = ref<string | null>(null)

// Debounce search input
const SEARCH_DEBOUNCE_MS = 300
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (newValue) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    debouncedSearch.value = newValue
    searchDebounceTimer = null
  }, SEARCH_DEBOUNCE_MS)
})

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})

const filteredRadios = computed(() => filterRadios(debouncedSearch.value, selectedCategory.value || undefined, selectedFormat.value || undefined))

// Only show formats that have at least one radio (considering search and category)
const availableFormats = computed(() => {
  return formats.filter(format =>
    filterRadios(debouncedSearch.value, selectedCategory.value || undefined, format).length > 0
  )
})

const availableBitrates = computed(() => {
  if (!selectedRadio.value) return ['128']
  // If "all formats", use first available format of selected radio
  const format = selectedFormat.value || getAvailableFormats(selectedRadio.value.id)[0]
  if (!format) return ['128']
  const bitrates = getAvailableBitrates(selectedRadio.value.id, format)
  return bitrates.length > 0 ? bitrates : ['128']
})

watch(selectedFormat, () => {
  // Reset selected radio if it doesn't have the new format (skip if "all formats")
  if (selectedRadio.value && selectedFormat.value) {
    const radioFormats = getAvailableFormats(selectedRadio.value.id)
    if (!radioFormats.includes(selectedFormat.value)) {
      selectedRadio.value = null
    }
  }
  // Update bitrate
  const bitrates = availableBitrates.value
  if (!bitrates.includes(selectedBitrate.value)) {
    selectedBitrate.value = bitrates[0] || '128'
  }
})

// Reset format if it becomes unavailable (e.g. after category change)
// Skip if "all formats" is selected (empty string)
watch(availableFormats, (newFormats) => {
  if (selectedFormat.value && !newFormats.includes(selectedFormat.value) && newFormats.length > 0) {
    selectedFormat.value = newFormats[0]
  }
})

function openSelector() {
  isOpen.value = true
}

function closeSelector() {
  isOpen.value = false
  search.value = ''
  selectedCategory.value = ''
  selectedRadio.value = null
  addError.value = null
}

function selectRadio(radio: Radio) {
  selectedRadio.value = radio
  addError.value = null

  // Auto-select best available format and bitrate
  const radioFormats = getAvailableFormats(radio.id)
  if (radioFormats.length > 0) {
    selectedFormat.value = radioFormats[0]
    const bitrates = getAvailableBitrates(radio.id, radioFormats[0])
    if (bitrates.length > 0) {
      selectedBitrate.value = bitrates[0]
    }
  }
}

function addToPlaylist() {
  if (!selectedRadio.value || isAdding.value) return

  isAdding.value = true
  addError.value = null

  try {
    // If "all formats", use first available format
    const format = selectedFormat.value || getAvailableFormats(selectedRadio.value.id)[0]
    if (!format) {
      addError.value = t.value.streamNotAvailable
      return
    }

    const streamUrl = getStreamUrl(
      selectedRadio.value.id,
      format,
      selectedBitrate.value
    )

    if (streamUrl) {
      const id = store.addStream(selectedRadio.value.name, streamUrl, selectedBitrate.value, selectedRadio.value.logo)
      store.selectStream(id)
      closeSelector()
    } else {
      addError.value = t.value.streamNotAvailable
    }
  } catch {
    addError.value = t.value.failedToGetStream
  } finally {
    isAdding.value = false
  }
}

// Expose modal state for parent component
defineExpose({
  isOpen
})
</script>

<template>
  <div>
    <!-- Open Button -->
    <button
      @click="openSelector"
      class="flex items-center gap-2 w-full py-2.5 px-4 bg-gradient-brand-simple border-none rounded-xl text-white text-sm font-medium cursor-pointer transition-all duration-200 shadow-brand hover:opacity-90"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="8" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M14 11h4M14 14h4M14 17h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M6 6l4-3M18 6l-4-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      {{ t.browseRadios }}
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-modal p-5" @click.self="closeSelector">
          <div class="modal w-full max-w-120 max-h-modal bg-surface border border-white/10 rounded-modal flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="flex justify-between items-center py-5 px-6 border-b border-border">
              <h2 class="text-lg font-semibold text-text m-0">{{ t.selectRadio }}</h2>
              <button
                @click="closeSelector"
                class="bg-transparent border-none p-2 cursor-pointer text-text-muted transition-colors duration-200 rounded-lg hover:text-white/90 hover:bg-white/5"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- Filters -->
            <div class="py-4 px-6 border-b border-border">
              <!-- Search -->
              <div class="relative mb-3">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <input
                  v-model="search"
                  type="text"
                  :placeholder="t.searchRadios"
                  class="w-full py-3 pl-10.5 pr-3.5 bg-white/4 border border-border-light rounded-xl text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-brand/50 focus:bg-white/6"
                />
              </div>

              <!-- Filter Row -->
              <div class="flex gap-3">
                <select
                  v-model="selectedCategory"
                  class="select-custom flex-1 py-2.5 pl-3.5 pr-9 bg-white/4 border border-border-light rounded-input text-tiny text-text cursor-pointer focus:outline-none focus:border-brand/50"
                >
                  <option value="" class="bg-surface text-text">{{ t.allCategories }}</option>
                  <option v-for="cat in categories" :key="cat" :value="cat" class="bg-surface text-text">
                    {{ getCategoryLabel(cat) }}
                  </option>
                </select>

                <!-- Format Selector -->
                <select
                  v-model="selectedFormat"
                  class="select-custom py-2.5 pl-3.5 pr-9 bg-white/4 border border-border-light rounded-input text-tiny text-text cursor-pointer focus:outline-none focus:border-brand/50"
                >
                  <option value="" class="bg-surface text-text">{{ t.allFormats }}</option>
                  <option v-for="format in availableFormats" :key="format" :value="format" class="bg-surface text-text">
                    {{ format.toUpperCase() }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Radio List -->
            <div class="flex-1 overflow-y-auto py-2 px-4 min-h-50 max-h-87.5 scrollbar-thin">
              <ul v-if="filteredRadios.length > 0" class="list-none p-0 m-0">
                <li
                  v-for="radio in filteredRadios"
                  :key="radio.id"
                  @click="selectRadio(radio)"
                  class="flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 hover:bg-white/4"
                  :class="{ 'bg-brand/10 border border-brand/25': selectedRadio?.id === radio.id }"
                >
                  <img :src="radio.logo" :alt="radio.name" class="w-12 h-12 rounded-input object-cover bg-white/10" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm font-medium text-white/90 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis"><StationName :name="radio.name" /></span>
                    <span v-if="radio.categories.length" class="block text-xs text-white/35 whitespace-nowrap overflow-hidden text-ellipsis">
                      {{ radio.categories.map(getCategoryLabel).join(', ') }}
                    </span>
                  </div>
                  <div v-if="selectedRadio?.id === radio.id" class="w-6 h-6 bg-gradient-brand-simple rounded-full flex items-center justify-center shrink-0">
                    <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </li>
              </ul>

              <div v-else class="flex flex-col items-center justify-center gap-3 py-10 px-5 text-text-muted text-sm">
                <span>{{ t.noRadiosFound }}</span>
              </div>
            </div>

            <!-- Error -->
            <div v-if="addError" class="mx-6 mb-3 py-2.5 px-3.5 bg-error-bg border border-error-border rounded-input text-error-light text-tiny text-center">
              {{ addError }}
            </div>

            <!-- Modal Footer -->
            <div class="flex flex-col gap-3 py-4 px-6 border-t border-border bg-black/20">
              <div v-if="selectedRadio" class="flex items-center gap-3">
                <img :src="selectedRadio.logo" :alt="selectedRadio.name" class="w-10 h-10 rounded-lg object-cover bg-white/10 shrink-0" />
                <div class="flex-1 min-w-0">
                  <span class="block text-sm font-medium text-white/90 whitespace-nowrap overflow-hidden text-ellipsis"><StationName :name="selectedRadio.name" /></span>
                  <span class="block text-xs text-text-muted">{{ (selectedFormat || getAvailableFormats(selectedRadio.id)[0] || '').toUpperCase() }} {{ selectedBitrate }}kbps</span>
                </div>
                <!-- Bitrate Selector -->
                <div v-if="availableBitrates.length > 1" class="flex gap-1 p-1 bg-white/4 rounded-input shrink-0">
                  <button
                    v-for="bitrate in availableBitrates"
                    :key="bitrate"
                    @click="selectedBitrate = bitrate"
                    class="py-1.5 px-2.5 bg-transparent border-none rounded-pill text-2xs font-semibold cursor-pointer transition-all duration-200"
                    :class="selectedBitrate === bitrate ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'"
                  >
                    {{ bitrate }}k
                  </button>
                </div>
              </div>
              <button
                :disabled="!selectedRadio || isAdding"
                @click="addToPlaylist"
                class="w-full py-3 px-6 bg-gradient-brand-simple border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 whitespace-nowrap hover:opacity-90 hover:-translate-y-px disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span v-if="isAdding" class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5"></span>
                {{ isAdding ? t.adding : t.addToPlaylist }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.select-custom {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
</style>
