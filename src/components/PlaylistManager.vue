<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlaylistStore } from '../stores/playlist'
import { useI18n } from '../composables/useI18n'

const store = usePlaylistStore()
const { t } = useI18n()

// Constants
const ERROR_DISMISS_MS = 3000

const showAddForm = ref(false)
const editingId = ref<string | null>(null)
const newName = ref('')
const newUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const deleteConfirmId = ref<string | null>(null)

// URL validation helper
function isValidStreamUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Form validation
const isFormValid = computed(() => {
  const name = newName.value.trim()
  const url = newUrl.value.trim()
  return name.length > 0 && url.length > 0 && isValidStreamUrl(url)
})

function openAddForm(): void {
  showAddForm.value = true
  newName.value = ''
  newUrl.value = ''
  editingId.value = null
}

function startEdit(id: string, name: string, url: string): void {
  editingId.value = id
  newName.value = name
  newUrl.value = url
  showAddForm.value = true
}

function saveStream(): void {
  if (!isFormValid.value) return

  if (editingId.value) {
    store.updateStream(editingId.value, newName.value.trim(), newUrl.value.trim())
  } else {
    const id = store.addStream(newName.value.trim(), newUrl.value.trim())
    store.selectStream(id)
  }

  closeForm()
}

function closeForm(): void {
  showAddForm.value = false
  editingId.value = null
  newName.value = ''
  newUrl.value = ''
}

function selectAndPlay(id: string) {
  store.selectStream(id)
}

function onDragStart(e: DragEvent, id: string) {
  draggedId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function onDragOver(e: DragEvent, id: string) {
  e.preventDefault()
  if (draggedId.value && draggedId.value !== id) {
    dragOverId.value = id
  }
}

function onDragLeave() {
  dragOverId.value = null
}

function onDrop(e: DragEvent, targetId: string) {
  e.preventDefault()
  if (draggedId.value && draggedId.value !== targetId) {
    store.moveStream(draggedId.value, targetId)
  }
  draggedId.value = null
  dragOverId.value = null
}

function onDragEnd() {
  draggedId.value = null
  dragOverId.value = null
}

function triggerImport() {
  fileInput.value?.click()
}

function confirmDelete(id: string): void {
  deleteConfirmId.value = id
}

function cancelDelete(): void {
  deleteConfirmId.value = null
}

function executeDelete(): void {
  if (deleteConfirmId.value) {
    store.removeStream(deleteConfirmId.value)
    deleteConfirmId.value = null
  }
}

function showError(message: string): void {
  importError.value = message
  setTimeout(() => {
    importError.value = null
  }, ERROR_DISMISS_MS)
}

async function handleFileImport(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file || !target) return

  importError.value = null

  try {
    const content = await file.text()
    const success = store.importPlaylist(content)
    if (!success) {
      showError('Invalid playlist file')
    }
  } catch {
    showError('Failed to read file')
  }

  // Reset input
  target.value = ''
}
</script>

<template>
  <div class="bg-gradient-surface border border-border-light rounded-[20px] p-5">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4 px-1">
      <h2 class="text-[15px] font-semibold text-white/90">{{ t.yourStations }}</h2>
      <button
        @click="openAddForm"
        class="flex items-center gap-1.5 bg-white/[0.06] text-white/70 border border-border-light px-3.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-border-lighter hover:text-text"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        {{ t.add }}
      </button>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="showAddForm" class="bg-black/30 border border-border-light rounded-2xl mb-4 overflow-hidden">
      <div class="flex justify-between items-center px-4 py-3.5 border-b border-border">
        <span class="text-sm font-semibold text-white/90">{{ editingId ? t.editStation : t.newStation }}</span>
        <button
          @click="closeForm"
          class="bg-transparent border-none p-1 cursor-pointer text-text-muted transition-colors duration-200 hover:text-white/80"
        >
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="p-4">
        <div class="mb-3.5">
          <label class="block text-xs font-medium text-white/50 mb-1.5">{{ t.name }}</label>
          <input
            v-model="newName"
            type="text"
            :placeholder="t.namePlaceholder"
            class="w-full py-3 px-3.5 bg-white/[0.04] border border-border-light rounded-[10px] text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-[rgba(240,47,0,0.5)] focus:bg-white/[0.06]"
          />
        </div>
        <div class="mb-3.5">
          <label class="block text-xs font-medium text-white/50 mb-1.5">{{ t.streamUrl }}</label>
          <input
            v-model="newUrl"
            type="url"
            :placeholder="t.urlPlaceholder"
            class="w-full py-3 px-3.5 bg-white/[0.04] border border-border-light rounded-[10px] text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-[rgba(240,47,0,0.5)] focus:bg-white/[0.06]"
          />
        </div>
        <button
          @click="saveStream"
          class="w-full py-3 bg-gradient-brand-simple border-none rounded-[10px] text-sm font-semibold text-white cursor-pointer transition-all duration-200 mt-1 hover:opacity-90 hover:-translate-y-px"
        >
          {{ editingId ? t.saveChanges : t.addStation }}
        </button>
      </div>
    </div>

    <!-- Stream List -->
    <ul class="list-none p-0 m-0">
      <li
        v-for="item in store.items"
        :key="item.id"
        draggable="true"
        @click="selectAndPlay(item.id)"
        @dragstart="onDragStart($event, item.id)"
        @dragover="onDragOver($event, item.id)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, item.id)"
        @dragend="onDragEnd"
        class="group flex items-center p-3 bg-white/[0.02] border border-transparent rounded-xl mb-1.5 cursor-pointer transition-all duration-200 hover:bg-white/[0.04]"
        :class="{
          '!bg-[rgba(240,47,0,0.1)] !border-[rgba(240,47,0,0.2)]': item.id === store.currentId,
          'opacity-50': draggedId === item.id,
          '!border-[rgba(240,47,0,0.5)] !bg-[rgba(240,47,0,0.05)]': dragOverId === item.id
        }"
      >
        <!-- Drag Handle -->
        <div
          @mousedown.stop
          class="flex items-center justify-center w-5 h-5 mr-2 cursor-grab active:cursor-grabbing text-white/20 transition-colors duration-200 shrink-0 group-hover:text-white/50"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M8 6h2M8 12h2M8 18h2M14 6h2M14 12h2M14 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Indicator -->
        <div class="mr-3">
          <div
            class="w-2 h-2 rounded-full transition-all duration-200"
            :class="item.id === store.currentId ? 'bg-[#F02F00] shadow-[0_0_12px_rgba(240,47,0,0.5)]' : 'bg-white/15'"
          ></div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-white/90 whitespace-nowrap overflow-hidden text-ellipsis">{{ item.name }}</span>
          <span class="block text-[11px] text-white/30 whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">{{ item.url }}</span>
        </div>

        <!-- End Section -->
        <div class="relative ml-2 min-w-[70px] flex justify-end">
          <span
            v-if="item.bitrate"
            class="hidden lg:inline py-0.5 px-2 bg-white/[0.08] rounded-md text-[11px] font-medium text-white/50 transition-opacity duration-150 group-hover:opacity-0 group-hover:pointer-events-none"
          >{{ item.bitrate }}k</span>
          <div class="flex gap-1 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:opacity-0 transition-opacity duration-150 lg:group-hover:opacity-100">
            <button
              @click.stop="startEdit(item.id, item.name, item.url)"
              :title="t.edit"
              class="bg-white/[0.06] border-none cursor-pointer p-2 rounded-lg text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white/90"
            >
              <svg class="w-4 h-4 block" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              @click.stop="confirmDelete(item.id)"
              :title="t.delete"
              class="bg-white/[0.06] border-none cursor-pointer p-2 rounded-lg text-white/50 transition-all duration-200 hover:bg-error/15 hover:text-red-400"
            >
              <svg class="w-4 h-4 block" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Empty State -->
    <div v-if="store.items.length === 0" class="text-center py-10 px-5">
      <div class="mb-3">
        <svg class="w-10 h-10 text-white/15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="block text-sm text-text-muted mb-4">{{ t.noStations }}</span>
      <button
        @click="openAddForm"
        class="bg-gradient-brand-simple border-none py-2.5 px-5 rounded-[10px] text-[13px] font-medium text-white cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
      >{{ t.addFirstStation }}</button>
    </div>

    <!-- Playlist Actions -->
    <div class="flex justify-center gap-4 mt-4 pt-4 border-t border-border">
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileImport"
      />
      <button
        @click="store.downloadPlaylist"
        :title="t.export"
        class="flex items-center gap-1.5 bg-transparent border-none text-text-muted text-xs cursor-pointer py-1.5 px-2.5 rounded-md transition-all duration-200 hover:text-white/80 hover:bg-white/5"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ t.export }}
      </button>
      <button
        @click="triggerImport"
        :title="t.import"
        class="flex items-center gap-1.5 bg-transparent border-none text-text-muted text-xs cursor-pointer py-1.5 px-2.5 rounded-md transition-all duration-200 hover:text-white/80 hover:bg-white/5"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ t.import }}
      </button>
    </div>

    <!-- Import Error -->
    <div v-if="importError" class="mt-3 py-2.5 px-3.5 bg-error-bg border border-error-border rounded-lg text-error-light text-[13px] text-center">
      {{ importError }}
    </div>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmId"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="cancelDelete"
        ></div>
        <!-- Dialog -->
        <div class="relative bg-[#1a1a1d] border border-border-light rounded-2xl p-5 w-full max-w-[300px] shadow-2xl">
          <h3 class="text-base font-semibold text-white mb-2">{{ t.deleteConfirmTitle }}</h3>
          <p class="text-sm text-white/60 mb-5">{{ t.deleteConfirmMessage }}</p>
          <div class="flex gap-3">
            <button
              @click="cancelDelete"
              class="flex-1 py-2.5 px-4 bg-white/[0.06] border border-border-light rounded-lg text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              {{ t.cancel }}
            </button>
            <button
              @click="executeDelete"
              class="flex-1 py-2.5 px-4 bg-red-600/90 border-none rounded-lg text-sm font-medium text-white transition-all duration-200 hover:bg-red-600"
            >
              {{ t.confirmDelete }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

