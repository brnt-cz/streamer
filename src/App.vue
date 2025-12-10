<script setup lang="ts">
import { ref } from 'vue'
import StreamPlayer from './components/StreamPlayer.vue'
import PlaylistManager from './components/PlaylistManager.vue'
import RadioSelector from './components/RadioSelector.vue'

const isPlaylistOpen = ref(false)

function togglePlaylist() {
  isPlaylistOpen.value = !isPlaylistOpen.value
}

function closePlaylist() {
  isPlaylistOpen.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="px-5 py-7 lg:px-10 lg:mr-[380px]">
      <div class="flex justify-center items-center gap-3">
        <div class="w-10 h-10 bg-gradient-brand rounded-xl relative overflow-hidden">
          <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/90 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"></span>
        </div>
        <span class="text-[22px] font-bold text-gradient-white">Streamer</span>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="flex-1 flex relative justify-center lg:mr-[380px]">
      <!-- Main Content - centered vertically when content fits -->
      <main class="flex flex-col gap-4 px-5 lg:px-10 max-w-[520px] lg:max-w-[560px] w-full lg:mx-auto">
        <StreamPlayer />
        <RadioSelector />
      </main>

      <!-- Playlist Panel - Desktop: fixed right, Mobile: offcanvas -->
      <aside
        class="playlist-panel fixed top-0 h-screen bg-background border-l border-border overflow-y-auto z-50
               w-[85%] max-w-[380px] transition-transform duration-300 ease-out
               lg:right-0 lg:w-[380px] lg:translate-x-0 lg:pt-24 lg:px-6 lg:pb-6
               right-0 translate-x-full p-5 pt-16"
        :class="{ '!translate-x-0': isPlaylistOpen }"
      >
        <!-- Close button (mobile only) -->
        <button
          @click="closePlaylist"
          class="absolute top-4 right-4 w-9 h-9 flex items-center justify-center
                 bg-surface-lighter border border-border-light rounded-[10px]
                 text-text-muted hover:bg-white/10 hover:text-text transition-all
                 lg:hidden"
        >
          <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <PlaylistManager />
      </aside>

      <!-- Mobile overlay -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
               lg:hidden"
        :class="isPlaylistOpen ? 'opacity-100 visible' : 'opacity-0 invisible'"
        @click="closePlaylist"
      ></div>

      <!-- Mobile toggle tab -->
      <button
        @click="togglePlaylist"
        class="fixed right-0 top-24 z-30
               bg-gradient-brand-simple rounded-l-xl px-2 py-4
               text-white flex flex-col items-center gap-2
               shadow-[-4px_0_20px_rgba(0,0,0,0.3)] transition-all duration-300
               hover:pr-3 lg:hidden"
        :class="{ 'translate-x-[60px]': isPlaylistOpen }"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span class="text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">Playlist</span>
      </button>
    </div>

    <!-- Footer -->
    <footer class="mt-10 text-center py-4 border-t border-border px-5 lg:px-10 lg:mr-[380px]">
      <img src="/brnt-logo-w.png" alt="brnt.cz" class="h-6 opacity-80 mix-blend-screen transition-opacity duration-200 hover:opacity-100 inline-block" />
    </footer>
  </div>
</template>
