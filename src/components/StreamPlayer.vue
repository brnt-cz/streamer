<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { usePlaylistStore } from '../stores/playlist'
import { useMediaSession } from '../composables/useMediaSession'
import { useI18n } from '../composables/useI18n'
import { useRadios } from '../stores/radios'
import StationName from './StationName.vue'

const store = usePlaylistStore()
const { t } = useI18n()
const { radios } = useRadios()
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const volume = ref(80)
const error = ref<string | null>(null)

// Flag to ignore pause events during stream loading
const isLoadingStream = ref(false)

// Sleep Timer
const sleepTimerMinutes = ref(0) // 0 = off, otherwise minutes until stop
const sleepTimerRemaining = ref(0) // Seconds remaining
const showSleepTimerMenu = ref(false)
let sleepTimerInterval: ReturnType<typeof setInterval> | null = null

const sleepTimerOptions = [
  { value: 0, label: 'sleepTimerOff' },
  { value: 15, label: 'sleepTimer15' },
  { value: 30, label: 'sleepTimer30' },
  { value: 45, label: 'sleepTimer45' },
  { value: 60, label: 'sleepTimer60' },
  { value: 90, label: 'sleepTimer90' },
  { value: 120, label: 'sleepTimer120' }
] as const

function setSleepTimer(minutes: number): void {
  sleepTimerMinutes.value = minutes
  sleepTimerRemaining.value = minutes * 60
  showSleepTimerMenu.value = false

  if (sleepTimerInterval) {
    clearInterval(sleepTimerInterval)
    sleepTimerInterval = null
  }

  if (minutes > 0) {
    sleepTimerInterval = setInterval(() => {
      if (sleepTimerRemaining.value > 0) {
        sleepTimerRemaining.value--
        if (sleepTimerRemaining.value <= 0) {
          // Time's up - stop playback
          if (isPlaying.value) {
            isPlaying.value = false
            stopAudio()
          }
          sleepTimerMinutes.value = 0
          if (sleepTimerInterval) {
            clearInterval(sleepTimerInterval)
            sleepTimerInterval = null
          }
        }
      }
    }, 1000)
  }
}

const formattedSleepTime = computed(() => {
  if (sleepTimerRemaining.value <= 0) return ''
  const minutes = Math.floor(sleepTimerRemaining.value / 60)
  const seconds = sleepTimerRemaining.value % 60
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

function closeSleepTimerMenu(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.sleep-timer-container')) {
    showSleepTimerMenu.value = false
  }
}

// Track pending canplay listener for cleanup
let pendingCanplayHandler: (() => void) | null = null

// Throttle helper for volume updates
const VOLUME_THROTTLE_MS = 50
let volumeThrottleTimer: ReturnType<typeof setTimeout> | null = null

function throttledUpdateVolume(): void {
  if (volumeThrottleTimer) return
  volumeThrottleTimer = setTimeout(() => {
    if (audioRef.value) {
      audioRef.value.volume = volume.value / 100
    }
    volumeThrottleTimer = null
  }, VOLUME_THROTTLE_MS)
}

// Helper: Stop audio and clear source (to save mobile data)
function stopAudio(): void {
  if (!audioRef.value) return
  audioRef.value.pause()
  audioRef.value.removeAttribute('src')
  audioRef.value.load()
}

// Helper: Clean up any pending canplay listener
function cleanupCanplayListener(): void {
  if (pendingCanplayHandler && audioRef.value) {
    audioRef.value.removeEventListener('canplay', pendingCanplayHandler)
    pendingCanplayHandler = null
  }
}

// Helper: Play audio when ready with proper cleanup
function playWhenReady(audio: HTMLAudioElement, onError?: (e: Error) => void): void {
  cleanupCanplayListener()

  const handler = () => {
    audio.play().catch((e: Error) => {
      if (onError) onError(e)
      isPlaying.value = false
    })
    isLoadingStream.value = false
    audio.removeEventListener('canplay', handler)
    pendingCanplayHandler = null
  }

  pendingCanplayHandler = handler
  audio.addEventListener('canplay', handler)
}

function togglePlay(): void {
  if (!audioRef.value) return

  if (isPlaying.value) {
    isPlaying.value = false
    stopAudio()
  } else {
    if (store.currentStream) {
      const audio = audioRef.value
      isLoadingStream.value = true
      audio.src = store.currentStream.url
      audio.load()
      playWhenReady(audio, (e) => {
        error.value = t.value.streamError + ': ' + e.message
      })
    }
  }
}

function handlePlay(): void {
  isPlaying.value = true
  error.value = null
  startKeepAlive()
}

function handlePause(): void {
  // Ignore pause events during stream loading (load() triggers pause)
  if (!isLoadingStream.value) {
    isPlaying.value = false
    stopKeepAlive()
  }
}

function handleError(): void {
  error.value = t.value.streamLoadError
  isPlaying.value = false
}

// Handle stalled stream - try to resume
function handleStalled(): void {
  if (isPlaying.value && audioRef.value && store.currentStream) {
    // Try to resume by reloading the stream
    const audio = audioRef.value
    const currentTime = audio.currentTime
    audio.src = store.currentStream.url
    audio.load()
    audio.currentTime = currentTime
    audio.play().catch(() => {
      // Silent catch - will be handled by error event if persistent
    })
  }
}

// Keep-alive interval to detect silent browser pauses
let keepAliveInterval: ReturnType<typeof setInterval> | null = null

function startKeepAlive(): void {
  if (keepAliveInterval) return
  keepAliveInterval = setInterval(() => {
    if (isPlaying.value && audioRef.value && audioRef.value.paused && !isLoadingStream.value) {
      // Browser silently paused - try to resume
      audioRef.value.play().catch(() => {
        // If can't resume, reload stream
        if (store.currentStream) {
          audioRef.value!.src = store.currentStream.url
          audioRef.value!.load()
          playWhenReady(audioRef.value!, () => {})
        }
      })
    }
  }, 5000) // Check every 5 seconds
}

function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval)
    keepAliveInterval = null
  }
}

watch(() => store.currentStream, (newStream, oldStream) => {
  if (audioRef.value && newStream) {
    const shouldAutoPlay = isPlaying.value || (oldStream && oldStream.id !== newStream.id)
    error.value = null

    // Clean up any pending listener before switching
    cleanupCanplayListener()

    // Stop current playback
    audioRef.value.pause()

    // Set new source and load
    audioRef.value.src = newStream.url
    audioRef.value.load()

    // Auto-play when stream is ready
    if (shouldAutoPlay) {
      playWhenReady(audioRef.value, () => {
        error.value = t.value.streamError
      })
    }
  }
})

watch(volume, throttledUpdateVolume)

// Stream name for media session
const streamName = computed(() => store.currentStream?.name)

// Try to find logo - either from stream or by matching to known radio
const currentLogo = computed(() => {
  if (!store.currentStream) return null
  // Use stored logo if available
  if (store.currentStream.logo) return store.currentStream.logo
  // Try to match by URL - check if stream URL contains radio's stream URL
  const streamUrl = store.currentStream.url.toLowerCase()
  for (const radio of radios.value) {
    for (const format in radio.streams) {
      for (const bitrate in radio.streams[format]) {
        if (streamUrl === radio.streams[format][bitrate].toLowerCase()) {
          return radio.logo
        }
      }
    }
  }
  // Try to match by name
  const streamName = store.currentStream.name.toLowerCase()
  const matchedRadio = radios.value.find(r => r.name.toLowerCase() === streamName)
  if (matchedRadio) return matchedRadio.logo
  return null
})

// Media Session API for browser/OS playback controls
useMediaSession({
  isPlaying,
  streamName,
  artwork: currentLogo,
  onPlay: () => {
    if (audioRef.value && store.currentStream) {
      const audio = audioRef.value
      audio.src = store.currentStream.url
      audio.load()
      playWhenReady(audio, (e) => {
        error.value = t.value.streamError + ': ' + e.message
      })
    }
  },
  onPause: () => {
    stopAudio()
  }
})

// Handle visibility change - resume playback if browser paused it in background
function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible' && isPlaying.value && audioRef.value) {
    // Check if audio was paused by browser
    if (audioRef.value.paused && audioRef.value.src) {
      audioRef.value.play().catch(() => {
        // If play fails, try reloading the stream
        if (store.currentStream) {
          audioRef.value!.src = store.currentStream.url
          audioRef.value!.load()
          playWhenReady(audioRef.value!, () => {
            error.value = t.value.streamError
          })
        }
      })
    }
  }
}

onMounted(() => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value / 100
  }
  // Listen for visibility changes to resume playback
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // Close sleep timer menu when clicking outside
  document.addEventListener('click', closeSleepTimerMenu)
})

onUnmounted(() => {
  cleanupCanplayListener()
  stopKeepAlive()
  if (volumeThrottleTimer) {
    clearTimeout(volumeThrottleTimer)
  }
  if (sleepTimerInterval) {
    clearInterval(sleepTimerInterval)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('click', closeSleepTimerMenu)
  stopAudio()
})
</script>

<template>
  <div class="bg-gradient-surface bg-surface-darker! flex flex-col justify-between min-h-125 border border-border-light rounded-modal p-7 backdrop-blur-glass overflow-visible">
    <audio
      ref="audioRef"
      playsinline
      webkit-playsinline
      x-webkit-airplay="allow"
      @play="handlePlay"
      @pause="handlePause"
      @error="handleError"
      @stalled="handleStalled"
    ></audio>

    <!-- Player Visual -->
    <div class="flex justify-center mb-6 overflow-visible">
      <div
        class="w-30 h-30 relative flex items-center justify-center"
        :class="{ 'cursor-pointer': store.currentStream }"
        @click="store.currentStream && togglePlay()"
      >
        <!-- Pulse Rings (behind the circle) -->
        <div
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
          :class="isPlaying ? 'opacity-100' : 'opacity-0'"
        >
          <div class="absolute w-25 h-25 border border-brand/30 rounded-full animate-pulse-ring"></div>
          <div class="absolute w-25 h-25 border border-brand/30 rounded-full animate-pulse-ring pulse-delay-1s"></div>
        </div>
        <!-- Artwork Inner Circle -->
        <div
          class="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center relative z-2 shadow-brand-lg transition-all duration-300 will-change-transform"
          :class="{ 'scale-105 shadow-brand-xl': isPlaying, 'hover:scale-108 active:scale-95': store.currentStream }"
        >
          <!-- Idle state: radio icon -->
          <svg v-if="!isPlaying" class="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 11h4M14 14h4M14 17h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 6l4-3M18 6l-4-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- Playing state: audio wave animation -->
          <div v-else class="flex items-center justify-center gap-1 h-8">
            <span class="w-1 h-3/5 bg-white rounded-sm animate-wave wave-delay-1"></span>
            <span class="w-1 h-full bg-white rounded-sm animate-wave wave-delay-2"></span>
            <span class="w-1 h-3/4 bg-white rounded-sm animate-wave wave-delay-3"></span>
            <span class="w-1 h-9/10 bg-white rounded-sm animate-wave wave-delay-4"></span>
            <span class="w-1 h-1/2 bg-white rounded-sm animate-wave wave-delay-5"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Info -->
    <div class="flex items-center justify-center gap-4 mb-6">
      <img
        v-if="currentLogo && store.currentStream"
        :src="currentLogo"
        :alt="store.currentStream.name"
        class="w-14 h-14 rounded-xl object-cover bg-white/10 shrink-0"
      />
      <div class="text-center">
        <div v-if="store.currentStream">
          <span class="block text-2xs font-medium text-text-muted uppercase tracking-caps mb-1.5">{{ t.nowPlaying }}</span>
          <span class="text-lg font-semibold text-text"><StationName :name="store.currentStream.name" /></span>
        </div>
        <div v-else>
          <span class="text-lg font-semibold text-text-muted">{{ t.selectStream }}</span>
        </div>
      </div>
    </div>

    <!-- Play Button -->
    <div class="flex justify-center mb-6">
      <button
        @click="togglePlay"
        :disabled="!store.currentStream || isLoadingStream"
        class="w-14 h-14 bg-gradient-brand-simple border-none rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 shadow-brand hover:scale-105 hover:shadow-brand-hover active:scale-98 disabled:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <!-- Loading spinner -->
        <svg v-if="isLoadingStream" class="w-6 h-6 text-white shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <!-- Play icon -->
        <svg v-else-if="!isPlaying" class="w-6 h-6 text-white shrink-0" :class="{ 'text-white/30': !store.currentStream }" viewBox="0 0 24 24" fill="none">
          <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" fill="currentColor"/>
        </svg>
        <!-- Pause icon -->
        <svg v-else class="w-6 h-6 text-white shrink-0" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- Volume Control -->
    <div class="pt-4 border-t border-border">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-white/50 shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" opacity="0.6"/>
          <path v-if="volume > 0" d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
          <path v-if="volume > 50" d="M18.07 5.93a9 9 0 010 12.14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        </svg>
        <div class="flex-1 h-5 relative flex items-center">
          <div class="absolute left-0 right-0 h-1 bg-white/10 rounded-sm overflow-hidden">
            <div class="h-full bg-gradient-slider rounded-sm" :style="{ width: volume + '%' }"></div>
          </div>
          <input
            type="range"
            v-model="volume"
            min="0"
            max="100"
            class="volume-slider"
          />
        </div>
        <span class="text-xs font-medium text-text-muted min-w-6 text-right">{{ volume }}</span>
      </div>
    </div>

    <!-- Sleep Timer -->
    <div class="pt-4 border-t border-border">
      <div class="flex items-center gap-3 sleep-timer-container relative">
        <!-- Timer Icon -->
        <svg class="w-5 h-5 shrink-0" :class="sleepTimerMinutes > 0 ? 'text-primary' : 'text-white/50'" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
          <path d="M12 9v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
          <path d="M9 2h6M12 2v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>

        <!-- Timer Button/Display -->
        <button
          @click.stop="showSleepTimerMenu = !showSleepTimerMenu"
          class="flex-1 flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
        >
          <span class="text-sm text-text-muted">{{ t.sleepTimer }}</span>
          <span v-if="sleepTimerMinutes > 0" class="text-sm font-medium text-primary">
            {{ formattedSleepTime }}
          </span>
          <span v-else class="text-sm text-text-muted">
            {{ t.sleepTimerOff }}
          </span>
        </button>

        <!-- Dropdown Menu -->
        <Transition name="dropdown">
          <div
            v-if="showSleepTimerMenu"
            class="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden z-10"
          >
            <button
              v-for="option in sleepTimerOptions"
              :key="option.value"
              @click.stop="setSleepTimer(option.value)"
              class="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between"
              :class="sleepTimerMinutes === option.value ? 'bg-primary/20 text-primary' : 'text-text hover:bg-white/5'"
            >
              <span>{{ t[option.label] }}</span>
              <svg v-if="sleepTimerMinutes === option.value" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-4 p-3 px-4 bg-error-bg border border-error-border rounded-xl text-error-light text-tiny flex items-center gap-2.5">
      <svg class="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 7v6M12 16v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

