<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePlaylistStore } from '../stores/playlist'

const store = usePlaylistStore()
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const volume = ref(80)
const error = ref<string | null>(null)

function togglePlay() {
  if (!audioRef.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(e => {
      error.value = 'Nepodařilo se přehrát stream: ' + e.message
    })
  }
}

function handlePlay() {
  isPlaying.value = true
  error.value = null
}

function handlePause() {
  isPlaying.value = false
}

function handleError() {
  error.value = 'Chyba při načítání streamu'
  isPlaying.value = false
}

function updateVolume() {
  if (audioRef.value) {
    audioRef.value.volume = volume.value / 100
  }
}

watch(() => store.currentStream, (newStream, oldStream) => {
  if (audioRef.value && newStream) {
    const shouldAutoPlay = isPlaying.value || (oldStream && oldStream.id !== newStream.id)
    error.value = null

    // Stop current playback
    audioRef.value.pause()

    // Set new source and load
    audioRef.value.src = newStream.url
    audioRef.value.load()

    // Auto-play when stream is ready
    if (shouldAutoPlay) {
      const audio = audioRef.value
      const playWhenReady = () => {
        audio.play().catch(() => {
          error.value = 'Nepodařilo se přehrát stream'
        })
        audio.removeEventListener('canplay', playWhenReady)
      }
      audio.addEventListener('canplay', playWhenReady)
    }
  }
})

watch(volume, updateVolume)

onMounted(() => {
  updateVolume()
})

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
  }
})
</script>

<template>
  <div class="player">
    <audio
      ref="audioRef"
      :src="store.currentStream?.url"
      @play="handlePlay"
      @pause="handlePause"
      @error="handleError"
    />

    <div class="player-visual">
      <div
        class="artwork"
        :class="{ playing: isPlaying, clickable: store.currentStream }"
        @click="store.currentStream && togglePlay()"
      >
        <div class="artwork-inner">
          <!-- Idle state: radio icon -->
          <svg v-if="!isPlaying" class="icon-radio" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 11h4M14 14h4M14 17h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 6l4-3M18 6l-4-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- Playing state: audio wave animation -->
          <div v-else class="audio-wave">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
        </div>
        <div class="artwork-ring"></div>
        <div class="artwork-ring delay"></div>
      </div>
    </div>

    <div class="player-info">
      <div class="now-playing" v-if="store.currentStream">
        <span class="label">Now Playing</span>
        <span class="name">{{ store.currentStream.name }}</span>
      </div>
      <div class="no-stream" v-else>
        <span class="name">Select a stream</span>
      </div>
    </div>

    <div class="controls">
      <button
        class="play-btn"
        @click="togglePlay"
        :disabled="!store.currentStream"
        :class="{ playing: isPlaying }"
      >
        <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="none">
          <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" fill="currentColor"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <div class="volume-section">
      <div class="volume-control">
        <svg class="volume-icon" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" opacity="0.6"/>
          <path v-if="volume > 0" d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
          <path v-if="volume > 50" d="M18.07 5.93a9 9 0 010 12.14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        </svg>
        <div class="slider-container">
          <div class="slider-track">
            <div class="slider-fill" :style="{ width: volume + '%' }"></div>
          </div>
          <input
            type="range"
            v-model="volume"
            min="0"
            max="100"
            class="volume-slider"
          />
        </div>
        <span class="volume-value">{{ volume }}</span>
      </div>
    </div>

    <div class="error" v-if="error">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 7v6M12 16v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.player {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(20px);
}

.player-visual {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.artwork {
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artwork-inner {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #F02F00 0%, #ff4d2a 50%, #d42800 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  box-shadow: 0 8px 32px rgba(240, 47, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.artwork.playing .artwork-inner {
  transform: scale(1.05);
  box-shadow: 0 12px 48px rgba(240, 47, 0, 0.4);
}

.artwork.clickable {
  cursor: pointer;
}

.artwork.clickable:hover .artwork-inner {
  transform: scale(1.08);
}

.artwork.clickable:active .artwork-inner {
  transform: scale(0.95);
}

.icon-radio {
  width: 36px;
  height: 36px;
  color: white;
}

.audio-wave {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
}

.audio-wave .bar {
  width: 4px;
  height: 100%;
  background: white;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.audio-wave .bar:nth-child(1) {
  animation-delay: 0s;
  height: 60%;
}

.audio-wave .bar:nth-child(2) {
  animation-delay: 0.15s;
  height: 100%;
}

.audio-wave .bar:nth-child(3) {
  animation-delay: 0.3s;
  height: 75%;
}

.audio-wave .bar:nth-child(4) {
  animation-delay: 0.45s;
  height: 90%;
}

.audio-wave .bar:nth-child(5) {
  animation-delay: 0.6s;
  height: 50%;
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}

.artwork-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border: 1px solid rgba(240, 47, 0, 0.3);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;
}

.artwork.playing .artwork-ring {
  opacity: 1;
  animation: pulse 2s ease-out infinite;
}

.artwork-ring.delay {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.player-info {
  text-align: center;
  margin-bottom: 24px;
}

.now-playing .label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 6px;
}

.now-playing .name,
.no-stream .name {
  font-size: 18px;
  font-weight: 600;
  color: #fafafa;
}

.no-stream .name {
  color: rgba(255, 255, 255, 0.4);
}

.controls {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.play-btn {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #F02F00 0%, #d42800 100%);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(240, 47, 0, 0.3);
}

.play-btn svg {
  width: 24px;
  height: 24px;
  color: white;
  flex-shrink: 0;
}

.play-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 28px rgba(240, 47, 0, 0.4);
}

.play-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.play-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
  cursor: not-allowed;
}

.play-btn:disabled svg {
  color: rgba(255, 255, 255, 0.3);
}

.volume-section {
  padding: 16px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.slider-container {
  flex: 1;
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
}

.slider-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #F02F00 0%, #ff4d2a 100%);
  border-radius: 2px;
}

.volume-slider {
  width: 100%;
  height: 20px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  z-index: 2;
  margin: 0;
}

.volume-slider::-webkit-slider-runnable-track {
  height: 4px;
  background: transparent;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #fafafa;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s;
  margin-top: -5px;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.volume-slider::-moz-range-track {
  height: 4px;
  background: transparent;
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #fafafa;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.volume-value {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  min-width: 24px;
  text-align: right;
}

.error {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
