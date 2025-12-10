<script setup lang="ts">
import { ref } from 'vue'
import { usePlaylistStore } from '../stores/playlist'

const store = usePlaylistStore()

const showAddForm = ref(false)
const editingId = ref<string | null>(null)
const newName = ref('')
const newUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function openAddForm() {
  showAddForm.value = true
  newName.value = ''
  newUrl.value = ''
  editingId.value = null
}

function startEdit(id: string, name: string, url: string) {
  editingId.value = id
  newName.value = name
  newUrl.value = url
  showAddForm.value = true
}

function saveStream() {
  if (!newName.value.trim() || !newUrl.value.trim()) return

  if (editingId.value) {
    store.updateStream(editingId.value, newName.value.trim(), newUrl.value.trim())
  } else {
    const id = store.addStream(newName.value.trim(), newUrl.value.trim())
    store.selectStream(id)
  }

  closeForm()
}

function closeForm() {
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

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  importError.value = null

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const success = store.importPlaylist(content)
    if (!success) {
      importError.value = 'Invalid playlist file'
      setTimeout(() => importError.value = null, 3000)
    }
  }
  reader.onerror = () => {
    importError.value = 'Failed to read file'
    setTimeout(() => importError.value = null, 3000)
  }
  reader.readAsText(file)

  // Reset input
  target.value = ''
}
</script>

<template>
  <div class="playlist">
    <div class="header">
      <h2>Your Stations</h2>
      <button class="add-btn" @click="openAddForm">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Add
      </button>
    </div>

    <div class="form" v-if="showAddForm">
      <div class="form-header">
        <span>{{ editingId ? 'Edit Station' : 'New Station' }}</span>
        <button class="close-btn" @click="closeForm">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="form-body">
        <div class="input-group">
          <label>Name</label>
          <input
            v-model="newName"
            type="text"
            placeholder="My Radio Station"
            class="input"
          />
        </div>
        <div class="input-group">
          <label>Stream URL</label>
          <input
            v-model="newUrl"
            type="url"
            placeholder="https://..."
            class="input"
          />
        </div>
        <button class="save-btn" @click="saveStream">
          {{ editingId ? 'Save Changes' : 'Add Station' }}
        </button>
      </div>
    </div>

    <ul class="stream-list">
      <li
        v-for="item in store.items"
        :key="item.id"
        :class="['stream-item', { active: item.id === store.currentId, dragging: draggedId === item.id, 'drag-over': dragOverId === item.id }]"
        draggable="true"
        @click="selectAndPlay(item.id)"
        @dragstart="onDragStart($event, item.id)"
        @dragover="onDragOver($event, item.id)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, item.id)"
        @dragend="onDragEnd"
      >
        <div class="drag-handle" @mousedown.stop>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M8 6h2M8 12h2M8 18h2M14 6h2M14 12h2M14 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="stream-indicator">
          <div class="indicator-dot" :class="{ active: item.id === store.currentId }"></div>
        </div>
        <div class="stream-info">
          <span class="stream-name">{{ item.name }}</span>
          <span class="stream-url">{{ item.url }}</span>
        </div>
        <div class="stream-end">
          <span v-if="item.bitrate" class="bitrate-badge">{{ item.bitrate }}k</span>
          <div class="stream-actions">
          <button
            class="action-btn"
            @click.stop="startEdit(item.id, item.name, item.url)"
            title="Edit"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="action-btn delete"
            @click.stop="store.removeStream(item.id)"
            title="Delete"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          </div>
        </div>
      </li>
    </ul>

    <div class="empty" v-if="store.items.length === 0">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span>No stations yet</span>
      <button class="add-first-btn" @click="openAddForm">Add your first station</button>
    </div>

    <div class="playlist-actions">
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden-input"
        @change="handleFileImport"
      />
      <button class="action-link" @click="store.downloadPlaylist" title="Export playlist">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Export
      </button>
      <button class="action-link" @click="triggerImport" title="Import playlist">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Import
      </button>
    </div>

    <div class="import-error" v-if="importError">
      {{ importError }}
    </div>
  </div>
</template>

<style scoped>
.playlist {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn svg {
  width: 14px;
  height: 14px;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fafafa;
}

.form {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.form-header span {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s;
}

.close-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.form-body {
  padding: 16px;
}

.input-group {
  margin-bottom: 14px;
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  font-size: 14px;
  color: #fafafa;
  transition: all 0.2s;
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.input:focus {
  outline: none;
  border-color: rgba(240, 47, 0, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #F02F00 0%, #d42800 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.save-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.stream-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stream-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  border-radius: 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.stream-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.stream-item.active {
  background: rgba(240, 47, 0, 0.1);
  border-color: rgba(240, 47, 0, 0.2);
}

.stream-item.dragging {
  opacity: 0.5;
}

.stream-item.drag-over {
  border-color: rgba(240, 47, 0, 0.5);
  background: rgba(240, 47, 0, 0.05);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  cursor: grab;
  color: rgba(255, 255, 255, 0.2);
  transition: color 0.2s;
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle svg {
  width: 16px;
  height: 16px;
}

.stream-item:hover .drag-handle {
  color: rgba(255, 255, 255, 0.5);
}

.stream-indicator {
  margin-right: 12px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  transition: all 0.2s;
}

.indicator-dot.active {
  background: #F02F00;
  box-shadow: 0 0 12px rgba(240, 47, 0, 0.5);
}

.stream-info {
  flex: 1;
  min-width: 0;
}

.stream-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stream-url {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.stream-end {
  position: relative;
  margin-left: 8px;
  min-width: 70px;
  display: flex;
  justify-content: flex-end;
}

.bitrate-badge {
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  transition: opacity 0.15s;
}

.stream-item:hover .bitrate-badge {
  opacity: 0;
  pointer-events: none;
}

.stream-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.stream-item:hover .stream-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.action-btn svg {
  width: 16px;
  height: 16px;
  display: block;
}

.empty {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  margin-bottom: 12px;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.15);
}

.empty span {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 16px;
}

.add-first-btn {
  background: linear-gradient(135deg, #F02F00 0%, #d42800 100%);
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.add-first-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.playlist-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.hidden-input {
  display: none;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-link:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.action-link svg {
  width: 16px;
  height: 16px;
}

.import-error {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 13px;
  text-align: center;
}
</style>
