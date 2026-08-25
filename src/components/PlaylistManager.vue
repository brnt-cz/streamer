<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlaylistStore, type PlaylistFolder } from '../stores/playlist'
import { useI18n } from '../composables/useI18n'
import StationName from './StationName.vue'

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
const draggedType = ref<'stream' | 'folder' | null>(null)
const dragOverId = ref<string | null>(null)
const dragOverType = ref<'stream' | 'folder' | 'folder-drop-zone' | null>(null)
const deleteConfirmId = ref<string | null>(null)

// Folder state
const showFolderForm = ref(false)
const editingFolderId = ref<string | null>(null)
const newFolderName = ref('')
const deleteFolderConfirmId = ref<string | null>(null)

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

const isFolderFormValid = computed(() => {
  return newFolderName.value.trim().length > 0
})

// Check if folder contains the currently playing station
function folderHasActiveStream(folderId: string): boolean {
  if (!store.currentId) return false
  return store.getItemsByFolder(folderId).some(item => item.id === store.currentId)
}

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

// Folder form functions
function openFolderForm(): void {
  showFolderForm.value = true
  newFolderName.value = ''
  editingFolderId.value = null
}

function startEditFolder(folder: PlaylistFolder): void {
  editingFolderId.value = folder.id
  newFolderName.value = folder.name
  showFolderForm.value = true
}

function saveFolder(): void {
  if (!isFolderFormValid.value) return

  if (editingFolderId.value) {
    store.renameFolder(editingFolderId.value, newFolderName.value.trim())
  } else {
    store.addFolder(newFolderName.value.trim())
  }

  closeFolderForm()
}

function closeFolderForm(): void {
  showFolderForm.value = false
  editingFolderId.value = null
  newFolderName.value = ''
}

function confirmDeleteFolder(id: string): void {
  deleteFolderConfirmId.value = id
}

function cancelDeleteFolder(): void {
  deleteFolderConfirmId.value = null
}

function executeDeleteFolder(): void {
  if (deleteFolderConfirmId.value) {
    store.removeFolder(deleteFolderConfirmId.value)
    deleteFolderConfirmId.value = null
  }
}

// Drag & Drop for streams
function onDragStart(e: DragEvent, id: string, type: 'stream' | 'folder') {
  draggedId.value = id
  draggedType.value = type
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.setData('application/x-type', type)
  }
}

function onDragOver(e: DragEvent, id: string, type: 'stream' | 'folder' | 'folder-drop-zone') {
  e.preventDefault()
  if (draggedId.value && draggedId.value !== id) {
    dragOverId.value = id
    dragOverType.value = type
  }
}

function onDragLeave() {
  dragOverId.value = null
  dragOverType.value = null
}

function onDrop(e: DragEvent, targetId: string, targetType: 'stream' | 'folder' | 'folder-drop-zone') {
  e.preventDefault()

  if (!draggedId.value) return

  // Stream dropped on folder header or drop zone -> move stream to folder
  if (draggedType.value === 'stream' && (targetType === 'folder-drop-zone' || targetType === 'folder')) {
    store.moveStreamToFolder(draggedId.value, targetId)
  }
  // Stream dropped on another stream -> reorder
  else if (draggedType.value === 'stream' && targetType === 'stream') {
    store.moveStream(draggedId.value, targetId)
  }
  // Folder dropped on folder -> reorder folders
  else if (draggedType.value === 'folder' && targetType === 'folder') {
    store.moveFolder(draggedId.value, targetId)
  }

  draggedId.value = null
  draggedType.value = null
  dragOverId.value = null
  dragOverType.value = null
}

function onDropToRoot(e: DragEvent) {
  e.preventDefault()

  if (draggedId.value && draggedType.value === 'stream') {
    store.moveStreamToFolder(draggedId.value, undefined)
  }

  draggedId.value = null
  draggedType.value = null
  dragOverId.value = null
  dragOverType.value = null
}

function onDragEnd() {
  draggedId.value = null
  draggedType.value = null
  dragOverId.value = null
  dragOverType.value = null
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

// Expose modal states for parent component
defineExpose({
  showAddForm,
  showFolderForm,
  deleteConfirmId,
  deleteFolderConfirmId,
  draggedId
})
</script>

<template>
  <div class="bg-gradient-surface border border-border-light rounded-modal p-5">
    <!-- Header -->
    <div class="mb-4 px-1">
      <h2 class="text-md font-semibold text-white/90 mb-3">{{ t.yourStations }}</h2>
      <div class="flex gap-2">
        <button
          @click="openFolderForm"
          class="flex items-center gap-2 bg-white/6 text-white/70 border border-border-light px-3.5 py-2.5 rounded-input text-tiny font-medium cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-border-lighter hover:text-text whitespace-nowrap"
          :title="t.createFolder"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11v6M9 14h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ t.createFolder }}</span>
        </button>
        <button
          @click="openAddForm"
          class="flex items-center gap-2 bg-white/6 text-white/70 border border-border-light px-3.5 py-2.5 rounded-input text-tiny font-medium cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-border-lighter hover:text-text whitespace-nowrap"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ t.add }}
        </button>
      </div>
    </div>

    <!-- Folder Form -->
    <div v-if="showFolderForm" class="bg-black/30 border border-border-light rounded-2xl mb-4 overflow-hidden">
      <div class="flex justify-between items-center px-4 py-3.5 border-b border-border">
        <span class="text-sm font-semibold text-white/90">{{ editingFolderId ? t.renameFolder : t.newFolder }}</span>
        <button
          @click="closeFolderForm"
          class="bg-transparent border-none p-1 cursor-pointer text-text-muted transition-colors duration-200 hover:text-white/80"
        >
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="p-4">
        <div class="mb-3.5">
          <label class="block text-xs font-medium text-white/50 mb-1.5">{{ t.folderName }}</label>
          <input
            v-model="newFolderName"
            type="text"
            :placeholder="t.folderNamePlaceholder"
            class="w-full py-3 px-3.5 bg-white/4 border border-border-light rounded-input text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-brand/50 focus:bg-white/6"
            @keyup.enter="saveFolder"
          />
        </div>
        <button
          @click="saveFolder"
          :disabled="!isFolderFormValid"
          class="w-full py-3 bg-gradient-brand-simple border-none rounded-input text-sm font-semibold text-white cursor-pointer transition-all duration-200 mt-1 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {{ editingFolderId ? t.saveChanges : t.createFolder }}
        </button>
      </div>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="showAddForm" class="bg-black/30 border border-border-light rounded-2xl mb-4 overflow-hidden">
      <div class="flex justify-between items-center px-4 py-3.5 border-b border-border">
        <span class="text-sm font-semibold text-white/90">{{ editingId ? t.editStation : t.newStation }}</span>
        <button
          @click="closeForm"
          class="bg-transparent border-none p-1 cursor-pointer text-text-muted transition-colors duration-200 hover:text-white/80"
        >
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
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
            class="w-full py-3 px-3.5 bg-white/4 border border-border-light rounded-input text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-brand/50 focus:bg-white/6"
          />
        </div>
        <div class="mb-3.5">
          <label class="block text-xs font-medium text-white/50 mb-1.5">{{ t.streamUrl }}</label>
          <input
            v-model="newUrl"
            type="url"
            :placeholder="t.urlPlaceholder"
            class="w-full py-3 px-3.5 bg-white/4 border border-border-light rounded-input text-sm text-text transition-all duration-200 placeholder:text-text-subtle focus:outline-none focus:border-brand/50 focus:bg-white/6"
          />
        </div>
        <button
          @click="saveStream"
          class="w-full py-3 bg-gradient-brand-simple border-none rounded-input text-sm font-semibold text-white cursor-pointer transition-all duration-200 mt-1 hover:opacity-90 hover:-translate-y-px"
        >
          {{ editingId ? t.saveChanges : t.addStation }}
        </button>
      </div>
    </div>

    <!-- Stream List with Folders -->
    <ul class="list-none p-0 m-0">
      <!-- Folders -->
      <li
        v-for="folder in store.folders"
        :key="folder.id"
        class="mb-2"
      >
        <!-- Folder Header -->
        <div
          draggable="true"
          @click="store.toggleFolderCollapsed(folder.id)"
          @dragstart="onDragStart($event, folder.id, 'folder')"
          @dragover="onDragOver($event, folder.id, 'folder')"
          @dragleave="onDragLeave"
          @drop="onDrop($event, folder.id, 'folder')"
          @dragend="onDragEnd"
          class="group flex items-center p-2.5 bg-white/4 border border-border-light rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/6"
          :class="{
            'opacity-50': draggedId === folder.id && draggedType === 'folder',
            'border-brand/50! bg-brand/5!': dragOverId === folder.id && dragOverType === 'folder' && (draggedType === 'folder' || draggedType === 'stream'),
            'bg-brand/10! border-brand/20!': store.isFolderCollapsed(folder.id) && folderHasActiveStream(folder.id)
          }"
        >
          <!-- Drag Handle -->
          <div
            @mousedown.stop
            @click.stop
            class="flex items-center justify-center w-5 h-5 mr-2 cursor-grab active:cursor-grabbing text-white/20 transition-colors duration-200 shrink-0 group-hover:text-white/50"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M8 6h2M8 12h2M8 18h2M14 6h2M14 12h2M14 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Collapse Toggle -->
          <button
            @click.stop="store.toggleFolderCollapsed(folder.id)"
            class="flex items-center justify-center w-6 h-6 mr-2 bg-transparent border-none cursor-pointer text-white/40 transition-all duration-200 hover:text-white/70"
          >
            <svg
              class="w-4 h-4 transition-transform duration-200"
              :class="{ '-rotate-90': store.isFolderCollapsed(folder.id) }"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Folder Icon -->
          <div class="mr-2.5 text-white/50">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Folder Name -->
          <span class="flex-1 text-sm font-medium text-white/80">{{ folder.name }}</span>

          <!-- Actions -->
          <div class="flex gap-1 lg:opacity-0 transition-opacity duration-150 lg:group-hover:opacity-100">
            <button
              @click.stop="startEditFolder(folder)"
              :title="t.renameFolder"
              class="bg-white/6 border-none cursor-pointer p-1.5 rounded-lg text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white/90"
            >
              <svg class="w-3.5 h-3.5 block" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              @click.stop="confirmDeleteFolder(folder.id)"
              :title="t.deleteFolder"
              class="bg-white/6 border-none cursor-pointer p-1.5 rounded-lg text-white/50 transition-all duration-200 hover:bg-error/15 hover:text-red-400"
            >
              <svg class="w-3.5 h-3.5 block" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Folder Content (collapsible) -->
        <div
          v-show="!store.isFolderCollapsed(folder.id)"
          class="ml-4 mt-1 pl-4 border-l-2 border-border-light"
        >
          <!-- Drop zone for folder -->
          <div
            @dragover.prevent="onDragOver($event, folder.id, 'folder-drop-zone')"
            @dragleave="onDragLeave"
            @drop="onDrop($event, folder.id, 'folder-drop-zone')"
            class="min-h-10 rounded-lg transition-all duration-200 mb-1"
            :class="{
              'bg-brand/10 border-2 border-dashed border-brand/30': dragOverId === folder.id && dragOverType === 'folder-drop-zone' && draggedType === 'stream',
              'border-2 border-dashed border-transparent': !(dragOverId === folder.id && dragOverType === 'folder-drop-zone')
            }"
          >
            <!-- Items in folder -->
            <template v-if="store.getItemsByFolder(folder.id).length > 0">
              <div
                v-for="item in store.getItemsByFolder(folder.id)"
                :key="item.id"
                draggable="true"
                @click="selectAndPlay(item.id)"
                @dragstart="onDragStart($event, item.id, 'stream')"
                @dragover="onDragOver($event, item.id, 'stream')"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item.id, 'stream')"
                @dragend="onDragEnd"
                class="group flex items-center p-2.5 bg-white/2 border border-transparent rounded-xl mb-1 cursor-pointer transition-all duration-200 hover:bg-white/4"
                :class="{
                  'bg-brand/10! border-brand/20!': item.id === store.currentId,
                  'opacity-50': draggedId === item.id,
                  'border-brand/50! bg-brand/5!': dragOverId === item.id && dragOverType === 'stream'
                }"
              >
                <!-- Drag Handle -->
                <div
                  @mousedown.stop
                  class="flex items-center justify-center w-4 h-4 mr-2 cursor-grab active:cursor-grabbing text-white/20 transition-colors duration-200 shrink-0 group-hover:text-white/50"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M8 6h2M8 12h2M8 18h2M14 6h2M14 12h2M14 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>

                <!-- Indicator -->
                <div class="mr-2.5">
                  <div
                    class="w-1.5 h-1.5 rounded-full transition-all duration-200"
                    :class="item.id === store.currentId ? 'bg-primary shadow-brand-glow' : 'bg-white/15'"
                  ></div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <span class="block text-tiny font-medium text-white/90 whitespace-nowrap overflow-hidden text-ellipsis"><StationName :name="item.name" /></span>
                </div>

                <!-- Actions -->
                <div class="flex gap-1 lg:opacity-0 transition-opacity duration-150 lg:group-hover:opacity-100">
                  <button
                    @click.stop="startEdit(item.id, item.name, item.url)"
                    :title="t.edit"
                    class="bg-white/6 border-none cursor-pointer p-1.5 rounded-lg text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white/90"
                  >
                    <svg class="w-3.5 h-3.5 block" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button
                    @click.stop="confirmDelete(item.id)"
                    :title="t.delete"
                    class="bg-white/6 border-none cursor-pointer p-1.5 rounded-lg text-white/50 transition-all duration-200 hover:bg-error/15 hover:text-red-400"
                  >
                    <svg class="w-3.5 h-3.5 block" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </template>

            <!-- Empty folder message -->
            <div
              v-else
              class="py-3 px-4 text-center text-xs text-white/30"
            >
              {{ draggedType === 'stream' ? t.dragHereToAdd : t.emptyFolder }}
            </div>
          </div>
        </div>
      </li>

      <!-- Root level items (not in any folder) -->
      <li
        v-for="item in store.rootItems"
        :key="item.id"
        draggable="true"
        @click="selectAndPlay(item.id)"
        @dragstart="onDragStart($event, item.id, 'stream')"
        @dragover="onDragOver($event, item.id, 'stream')"
        @dragleave="onDragLeave"
        @drop="onDrop($event, item.id, 'stream')"
        @dragend="onDragEnd"
        class="group flex items-center p-3 bg-white/2 border border-transparent rounded-xl mb-1.5 cursor-pointer transition-all duration-200 hover:bg-white/4"
        :class="{
          'bg-brand/10! border-brand/20!': item.id === store.currentId,
          'opacity-50': draggedId === item.id,
          'border-brand/50! bg-brand/5!': dragOverId === item.id && dragOverType === 'stream'
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
            :class="item.id === store.currentId ? 'bg-primary shadow-brand-glow' : 'bg-white/15'"
          ></div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-white/90 whitespace-nowrap overflow-hidden text-ellipsis"><StationName :name="item.name" /></span>
          <span class="block text-2xs text-white/30 whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">{{ item.url }}</span>
        </div>

        <!-- End Section -->
        <div class="relative ml-2 min-w-17.5 flex justify-end">
          <span
            v-if="item.bitrate"
            class="hidden lg:inline py-0.5 px-2 bg-white/8 rounded-md text-2xs font-medium text-white/50 transition-opacity duration-150 group-hover:opacity-0 group-hover:pointer-events-none"
          >{{ item.bitrate }}k</span>
          <div class="flex gap-1 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:opacity-0 transition-opacity duration-150 lg:group-hover:opacity-100">
            <button
              @click.stop="startEdit(item.id, item.name, item.url)"
              :title="t.edit"
              class="bg-white/6 border-none cursor-pointer p-2 rounded-lg text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white/90"
            >
              <svg class="w-4 h-4 block" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              @click.stop="confirmDelete(item.id)"
              :title="t.delete"
              class="bg-white/6 border-none cursor-pointer p-2 rounded-lg text-white/50 transition-all duration-200 hover:bg-error/15 hover:text-red-400"
            >
              <svg class="w-4 h-4 block" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Drop zone to move items back to root -->
    <div
      v-if="draggedType === 'stream' && store.folders.length > 0"
      @dragover.prevent="dragOverType = 'stream'"
      @dragleave="dragOverType = null"
      @drop="onDropToRoot"
      class="mt-2 py-4 border-2 border-dashed border-white/10 rounded-xl text-center text-xs text-white/30 transition-all duration-200"
      :class="{
        'border-brand/30! bg-brand/5! text-white/50!': dragOverType === 'stream' && !dragOverId
      }"
    >
      {{ t.dragHereToAdd }}
    </div>

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
        class="bg-gradient-brand-simple border-none py-2.5 px-5 rounded-input text-tiny font-medium text-white cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
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
    <div v-if="importError" class="mt-3 py-2.5 px-3.5 bg-error-bg border border-error-border rounded-lg text-error-light text-tiny text-center">
      {{ importError }}
    </div>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmId"
        class="fixed inset-0 z-100 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="cancelDelete"
        ></div>
        <!-- Dialog -->
        <div class="relative bg-surface-dialog border border-border-light rounded-2xl p-5 w-full max-w-75 shadow-2xl">
          <h3 class="text-base font-semibold text-white mb-2">{{ t.deleteConfirmTitle }}</h3>
          <p class="text-sm text-white/60 mb-5">{{ t.deleteConfirmMessage }}</p>
          <div class="flex gap-3">
            <button
              @click="cancelDelete"
              class="flex-1 py-2.5 px-4 bg-white/6 border border-border-light rounded-lg text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
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

    <!-- Delete Folder Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteFolderConfirmId"
        class="fixed inset-0 z-100 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="cancelDeleteFolder"
        ></div>
        <!-- Dialog -->
        <div class="relative bg-surface-dialog border border-border-light rounded-2xl p-5 w-full max-w-75 shadow-2xl">
          <h3 class="text-base font-semibold text-white mb-2">{{ t.deleteFolderConfirmTitle }}</h3>
          <p class="text-sm text-white/60 mb-5">{{ t.deleteFolderConfirmMessage }}</p>
          <div class="flex gap-3">
            <button
              @click="cancelDeleteFolder"
              class="flex-1 py-2.5 px-4 bg-white/6 border border-border-light rounded-lg text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              {{ t.cancel }}
            </button>
            <button
              @click="executeDeleteFolder"
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
