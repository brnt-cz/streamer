<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { usePlaylistStore } from '../stores/playlist'
import { useMediaSession } from '../composables/useMediaSession'
import { useI18n } from '../composables/useI18n'

const store = usePlaylistStore()
const { t } = useI18n()
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const volume = ref(80)
const error = ref<string | null>(null)

// Flag to ignore pause events during stream loading
const isLoadingStream = ref(false)

function togglePlay() {
  if (!audioRef.value) return

  if (isPlaying.value) {
    // Stop stream completely to save mobile data (FUP protection)
    isPlaying.value = false
    audioRef.value.pause()
    audioRef.value.removeAttribute('src')
    audioRef.value.load() // Reset the audio element
  } else {
    // Restore stream URL and play
    if (store.currentStream) {
      const audio = audioRef.value
      isLoadingStream.value = true
      audio.src = store.currentStream.url
      audio.load()
      // Wait for stream to be ready before playing
      const playWhenReady = () => {
        audio.play().catch(e => {
          error.value = t.value.streamError + ': ' + e.message
          isPlaying.value = false
        })
        isLoadingStream.value = false
        audio.removeEventListener('canplay', playWhenReady)
      }
      audio.addEventListener('canplay', playWhenReady)
    }
  }
}

function handlePlay() {
  isPlaying.value = true
  error.value = null
}

function handlePause() {
  // Ignore pause events during stream loading (load() triggers pause)
  if (!isLoadingStream.value) {
    isPlaying.value = false
  }
}

function handleError() {
  error.value = t.value.streamLoadError
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
          error.value = t.value.streamError
        })
        audio.removeEventListener('canplay', playWhenReady)
      }
      audio.addEventListener('canplay', playWhenReady)
    }
  }
})

watch(volume, updateVolume)

// Stream name for media session
const streamName = computed(() => store.currentStream?.name)

// Media Session API for browser/OS playback controls
useMediaSession({
  isPlaying,
  streamName,
  onPlay: () => {
    if (audioRef.value && store.currentStream) {
      const audio = audioRef.value
      audio.src = store.currentStream.url
      audio.load()
      const playWhenReady = () => {
        audio.play().catch(e => {
          error.value = t.value.streamError + ': ' + e.message
        })
        audio.removeEventListener('canplay', playWhenReady)
      }
      audio.addEventListener('canplay', playWhenReady)
    }
  },
  onPause: () => {
    if (audioRef.value) {
      // Stop stream completely to save mobile data (FUP protection)
      audioRef.value.pause()
      audioRef.value.removeAttribute('src')
      audioRef.value.load()
    }
  }
})

onMounted(() => {
  updateVolume()
})

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.removeAttribute('src')
    audioRef.value.load()
  }
})
</script>

<template>
  <div class="bg-gradient-surface !bg-[#0F0F11] flex flex-col justify-between min-h-[500px] border border-border-light rounded-[20px] p-7 backdrop-blur-glass overflow-visible">
    <audio
      ref="audioRef"
      @play="handlePlay"
      @pause="handlePause"
      @error="handleError"
    ></audio>

    <!-- Player Visual -->
    <div class="flex justify-center mb-6 overflow-visible">
      <div
        class="w-[120px] h-[120px] relative flex items-center justify-center"
        :class="{ 'cursor-pointer': store.currentStream }"
        @click="store.currentStream && togglePlay()"
      >
        <!-- Pulse Rings (behind the circle) -->
        <div
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
          :class="isPlaying ? 'opacity-100' : 'opacity-0'"
        >
          <div class="absolute w-[100px] h-[100px] border border-[rgba(240,47,0,0.3)] rounded-full animate-pulse-ring"></div>
          <div class="absolute w-[100px] h-[100px] border border-[rgba(240,47,0,0.3)] rounded-full animate-pulse-ring pulse-delay-1s"></div>
        </div>
        <!-- Artwork Inner Circle -->
        <div
          class="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center relative z-[2] shadow-brand-lg transition-all duration-300 will-change-transform"
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
            <span class="w-1 h-[60%] bg-white rounded-sm animate-wave wave-delay-1"></span>
            <span class="w-1 h-full bg-white rounded-sm animate-wave wave-delay-2"></span>
            <span class="w-1 h-[75%] bg-white rounded-sm animate-wave wave-delay-3"></span>
            <span class="w-1 h-[90%] bg-white rounded-sm animate-wave wave-delay-4"></span>
            <span class="w-1 h-[50%] bg-white rounded-sm animate-wave wave-delay-5"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Info -->
    <div class="text-center mb-6">
      <div v-if="store.currentStream">
        <span class="block text-[11px] font-medium text-text-muted uppercase tracking-[1.5px] mb-1.5">{{ t.nowPlaying }}</span>
        <span class="text-lg font-semibold text-text">{{ store.currentStream.name }}</span>
      </div>
      <div v-else>
        <span class="text-lg font-semibold text-text-muted">{{ t.selectStream }}</span>
      </div>
    </div>

    <!-- Play Button -->
    <div class="flex justify-center mb-6">
      <button
        @click="togglePlay"
        :disabled="!store.currentStream"
        class="w-14 h-14 bg-gradient-brand-simple border-none rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 shadow-brand hover:scale-105 hover:shadow-[0_6px_28px_rgba(240,47,0,0.4)] active:scale-98 disabled:bg-white/10 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <svg v-if="!isPlaying" class="w-6 h-6 text-white shrink-0" :class="{ 'text-white/30': !store.currentStream }" viewBox="0 0 24 24" fill="none">
          <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" fill="currentColor"/>
        </svg>
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

    <!-- Error Message -->
    <div v-if="error" class="mt-4 p-3 px-4 bg-error-bg border border-error-border rounded-xl text-error-light text-[13px] flex items-center gap-2.5">
      <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 7v6M12 16v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

