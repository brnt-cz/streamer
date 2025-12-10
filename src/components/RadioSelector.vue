<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRadios, type Radio, type StreamFormat } from '../stores/radios'
import { usePlaylistStore } from '../stores/playlist'

const { categories, formats, getAvailableFormats, getAvailableBitrates, getStreamUrl, filterRadios } = useRadios()
const store = usePlaylistStore()

const isOpen = ref(false)
const search = ref('')
const selectedCategory = ref('')
const selectedFormat = ref<StreamFormat>('mp3')
const selectedBitrate = ref('128')
const selectedRadio = ref<Radio | null>(null)
const isAdding = ref(false)
const addError = ref<string | null>(null)

const filteredRadios = computed(() => filterRadios(search.value, selectedCategory.value || undefined))

const availableFormats = computed(() => {
  if (!selectedRadio.value) return formats
  const radioFormats = getAvailableFormats(selectedRadio.value.id)
  return radioFormats.length > 0 ? radioFormats : formats
})

const availableBitrates = computed(() => {
  if (!selectedRadio.value) return ['128']
  const bitrates = getAvailableBitrates(selectedRadio.value.id, selectedFormat.value)
  return bitrates.length > 0 ? bitrates : ['128']
})

watch(selectedFormat, () => {
  const bitrates = availableBitrates.value
  if (!bitrates.includes(selectedBitrate.value)) {
    selectedBitrate.value = bitrates[0] || '128'
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
    const streamUrl = getStreamUrl(
      selectedRadio.value.id,
      selectedFormat.value,
      selectedBitrate.value
    )

    if (streamUrl) {
      const id = store.addStream(selectedRadio.value.name, streamUrl, selectedBitrate.value)
      store.selectStream(id)
      closeSelector()
    } else {
      addError.value = 'Stream not available in this format'
    }
  } catch (e) {
    addError.value = 'Failed to get stream URL'
  } finally {
    isAdding.value = false
  }
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    pop: 'Pop',
    rock: 'Rock',
    metal: 'Metal',
    jazz: 'Jazz',
    classic: 'Klasika',
    dance: 'Dance',
    country: 'Country',
    oldies: 'Oldies',
    '80s': '80\'s',
    '90s': '90\'s',
    '00s': '00\'s',
    news: 'Zprávy',
    talk: 'Mluvené slovo',
    folk: 'Folk',
    indie: 'Indie',
    hiphop: 'Hip Hop',
    house: 'House',
    funk: 'Funky',
    soul: 'Soul',
    rnb: 'R\'n\'B',
    ethno: 'Ethno',
    alternative: 'Alternative',
    gothic: 'Gothic',
    kids: 'Pro děti',
    bigbit: 'Bigbít',
    dechovka: 'Dechovka',
    softac: 'Soft AC',
    hotac: 'Hot AC',
    allformat: 'All Format',
    Trance: 'Trance'
  }
  return labels[cat] || cat
}
</script>

<template>
  <div>
    <!-- Open Button -->
    <button
      @click="openSelector"
      class="flex items-center gap-2 w-full py-3.5 px-[18px] bg-gradient-surface border border-border-light rounded-[14px] text-white/80 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gradient-surface-hover hover:border-border-lighter hover:text-text"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="8" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M14 11h4M14 14h4M14 17h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M6 6l4-3M18 6l-4-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Browse Radios
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" @click.self="closeSelector">
          <div class="modal w-full max-w-[480px] max-h-[85vh] bg-surface border border-white/10 rounded-[20px] flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="flex justify-between items-center py-5 px-6 border-b border-border">
              <h2 class="text-lg font-semibold text-text m-0">Select Radio</h2>
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
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <input
                  v-model="search"
                  type="text"
                  placeholder="Search radios..."
                  class="w-full py-3 pl-[42px] pr-3.5 bg-white/[0.04] border border-border-light rounded-xl text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-[rgba(240,47,0,0.5)] focus:bg-white/[0.06]"
                />
              </div>

              <!-- Filter Row -->
              <div class="flex gap-3">
                <select
                  v-model="selectedCategory"
                  class="flex-1 py-2.5 px-3.5 bg-white/[0.04] border border-border-light rounded-[10px] text-[13px] text-text cursor-pointer focus:outline-none focus:border-[rgba(240,47,0,0.5)]"
                >
                  <option value="" class="bg-surface text-text">All categories</option>
                  <option v-for="cat in categories" :key="cat" :value="cat" class="bg-surface text-text">
                    {{ getCategoryLabel(cat) }}
                  </option>
                </select>

                <!-- Format Selector -->
                <div class="flex gap-1 p-1 bg-white/[0.04] rounded-[10px]">
                  <button
                    v-for="format in availableFormats"
                    :key="format"
                    @click="selectedFormat = format"
                    class="py-1.5 px-3 bg-transparent border-none rounded-[7px] text-xs font-semibold cursor-pointer transition-all duration-200"
                    :class="selectedFormat === format ? 'bg-gradient-brand-simple text-white' : 'text-white/50 hover:text-white/80'"
                  >
                    {{ format.toUpperCase() }}
                  </button>
                </div>

                <!-- Bitrate Selector -->
                <div v-if="selectedRadio && availableBitrates.length > 1" class="flex gap-1 p-1 bg-white/[0.04] rounded-[10px]">
                  <button
                    v-for="bitrate in availableBitrates"
                    :key="bitrate"
                    @click="selectedBitrate = bitrate"
                    class="py-1.5 px-2.5 bg-transparent border-none rounded-[7px] text-[11px] font-semibold cursor-pointer transition-all duration-200"
                    :class="selectedBitrate === bitrate ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'"
                  >
                    {{ bitrate }}k
                  </button>
                </div>
              </div>
            </div>

            <!-- Radio List -->
            <div class="flex-1 overflow-y-auto py-2 px-4 min-h-[200px] max-h-[350px] scrollbar-thin">
              <ul v-if="filteredRadios.length > 0" class="list-none p-0 m-0">
                <li
                  v-for="radio in filteredRadios"
                  :key="radio.id"
                  @click="selectRadio(radio)"
                  class="flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 hover:bg-white/[0.04]"
                  :class="{ 'bg-[rgba(240,47,0,0.1)] border border-[rgba(240,47,0,0.25)]': selectedRadio?.id === radio.id }"
                >
                  <img :src="radio.logo" :alt="radio.name" class="w-12 h-12 rounded-[10px] object-cover bg-white/5" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm font-medium text-white/90 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{{ radio.name }}</span>
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
                <span>No radios found</span>
              </div>
            </div>

            <!-- Error -->
            <div v-if="addError" class="mx-6 mb-3 py-2.5 px-3.5 bg-error-bg border border-error-border rounded-[10px] text-error-light text-[13px] text-center">
              {{ addError }}
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center gap-4 py-4 px-6 border-t border-border bg-black/20">
              <div v-if="selectedRadio" class="flex-1 flex items-center gap-3 min-w-0">
                <img :src="selectedRadio.logo" :alt="selectedRadio.name" class="w-10 h-10 rounded-lg object-cover" />
                <div class="min-w-0">
                  <span class="block text-sm font-medium text-white/90 whitespace-nowrap overflow-hidden text-ellipsis">{{ selectedRadio.name }}</span>
                  <span class="block text-xs text-text-muted">{{ selectedFormat.toUpperCase() }} {{ selectedBitrate }}kbps</span>
                </div>
              </div>
              <button
                :disabled="!selectedRadio || isAdding"
                @click="addToPlaylist"
                class="py-3 px-6 bg-gradient-brand-simple border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 whitespace-nowrap shrink-0 hover:opacity-90 hover:-translate-y-px disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span v-if="isAdding" class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5"></span>
                {{ isAdding ? 'Adding...' : 'Add to Playlist' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

