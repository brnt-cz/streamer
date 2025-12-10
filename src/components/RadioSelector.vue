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
  <div class="radio-selector">
    <button class="open-btn" @click="openSelector">
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="8" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M14 11h4M14 14h4M14 17h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M6 6l4-3M18 6l-4-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Browse Radios
    </button>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isOpen" class="modal-overlay" @click.self="closeSelector">
          <div class="modal">
            <div class="modal-header">
              <h2>Select Radio</h2>
              <button class="close-btn" @click="closeSelector">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <div class="filters">
              <div class="search-box">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <input
                  v-model="search"
                  type="text"
                  placeholder="Search radios..."
                  class="search-input"
                />
              </div>

              <div class="filter-row">
                <select v-model="selectedCategory" class="category-select">
                  <option value="">All categories</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ getCategoryLabel(cat) }}
                  </option>
                </select>

                <div class="format-selector">
                  <button
                    v-for="format in availableFormats"
                    :key="format"
                    :class="['format-btn', { active: selectedFormat === format }]"
                    @click="selectedFormat = format"
                  >
                    {{ format.toUpperCase() }}
                  </button>
                </div>

                <div class="bitrate-selector" v-if="selectedRadio && availableBitrates.length > 1">
                  <button
                    v-for="bitrate in availableBitrates"
                    :key="bitrate"
                    :class="['bitrate-btn', { active: selectedBitrate === bitrate }]"
                    @click="selectedBitrate = bitrate"
                  >
                    {{ bitrate }}k
                  </button>
                </div>
              </div>
            </div>

            <div class="radio-list-container">
              <ul v-if="filteredRadios.length > 0" class="radio-list">
                <li
                  v-for="radio in filteredRadios"
                  :key="radio.id"
                  :class="['radio-item', { selected: selectedRadio?.id === radio.id }]"
                  @click="selectRadio(radio)"
                >
                  <img :src="radio.logo" :alt="radio.name" class="radio-logo" />
                  <div class="radio-info">
                    <span class="radio-name">{{ radio.name }}</span>
                    <span v-if="radio.categories.length" class="radio-cats">
                      {{ radio.categories.map(getCategoryLabel).join(', ') }}
                    </span>
                  </div>
                  <div v-if="selectedRadio?.id === radio.id" class="check-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </li>
              </ul>

              <div v-else class="empty-state">
                <span>No radios found</span>
              </div>
            </div>

            <div v-if="addError" class="add-error">
              {{ addError }}
            </div>

            <div class="modal-footer">
              <div v-if="selectedRadio" class="selected-preview">
                <img :src="selectedRadio.logo" :alt="selectedRadio.name" class="preview-logo" />
                <div class="preview-info">
                  <span class="preview-name">{{ selectedRadio.name }}</span>
                  <span class="preview-format">{{ selectedFormat.toUpperCase() }} {{ selectedBitrate }}kbps</span>
                </div>
              </div>
              <button
                class="add-btn"
                :disabled="!selectedRadio || isAdding"
                @click="addToPlaylist"
              >
                <span v-if="isAdding" class="btn-spinner"></span>
                {{ isAdding ? 'Adding...' : 'Add to Playlist' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.open-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 14px 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.open-btn svg {
  width: 20px;
  height: 20px;
}

.open-btn:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fafafa;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #fafafa;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s;
  border-radius: 8px;
}

.close-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.filters {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.search-box {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.3);
}

.search-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 14px;
  color: #fafafa;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.search-input:focus {
  outline: none;
  border-color: rgba(240, 47, 0, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.filter-row {
  display: flex;
  gap: 12px;
}

.category-select {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  font-size: 13px;
  color: #fafafa;
  cursor: pointer;
}

.category-select:focus {
  outline: none;
  border-color: rgba(240, 47, 0, 0.5);
}

.category-select option {
  background: #18181b;
  color: #fafafa;
}

.format-selector {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
}

.format-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.format-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.format-btn.active {
  background: linear-gradient(135deg, #F02F00 0%, #d42800 100%);
  color: white;
}

.bitrate-selector {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
}

.bitrate-btn {
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.bitrate-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.bitrate-btn.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.radio-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  min-height: 200px;
  max-height: 350px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.radio-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.radio-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.radio-item.selected {
  background: rgba(240, 47, 0, 0.1);
  border: 1px solid rgba(240, 47, 0, 0.25);
}

.radio-logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.05);
}

.radio-info {
  flex: 1;
  min-width: 0;
}

.radio-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.radio-cats {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-icon {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #F02F00 0%, #d42800 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.check-icon svg {
  width: 14px;
  height: 14px;
  color: white;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.selected-preview {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.preview-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.preview-info {
  min-width: 0;
}

.preview-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-format {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.add-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #F02F00 0%, #d42800 100%);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.add-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.add-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.add-error {
  margin: 0 24px 12px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 13px;
  text-align: center;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}
</style>
