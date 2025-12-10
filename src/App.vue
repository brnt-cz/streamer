<script setup lang="ts">
import StreamPlayer from './components/StreamPlayer.vue'
import PlaylistManager from './components/PlaylistManager.vue'
import RadioSelector from './components/RadioSelector.vue'
</script>

<template>
  <div class="max-w-[520px] mx-auto px-5 py-6 min-h-screen flex flex-col">
    <header class="mb-8">
      <div class="flex items-center gap-3">
        <div class="logo-icon w-10 h-10 bg-gradient-brand rounded-xl relative overflow-hidden">
          <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/90 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]"></span>
        </div>
        <span class="text-[22px] font-bold text-gradient-white">Streamer</span>
      </div>
    </header>

    <main class="flex flex-col gap-4 flex-1">
      <StreamPlayer />
      <RadioSelector />
      <PlaylistManager />
    </main>

    <footer class="mt-10 text-center py-4 border-t border-border">
      <img src="/brnt-logo-w.png" alt="brnt.cz" class="h-6 opacity-80 mix-blend-screen transition-opacity duration-200 hover:opacity-100 inline-block" />
    </footer>
  </div>
</template>
