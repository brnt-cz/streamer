<script setup lang="ts">
import StreamPlayer from './components/StreamPlayer.vue'
import PlaylistManager from './components/PlaylistManager.vue'
import RadioSelector from './components/RadioSelector.vue'
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="logo">
        <div class="logo-icon"></div>
        <span>Streamer</span>
      </div>
    </header>

    <main class="app-main">
      <StreamPlayer />
      <RadioSelector />
      <PlaylistManager />
    </main>

    <footer class="app-footer">
      <span>Built with Vue 3</span>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #09090b;
  min-height: 100vh;
  color: #fafafa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  max-width: 520px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #F02F00 0%, #ff4d2a 50%, #d42800 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.logo-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.logo span {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.app-footer {
  margin-top: 40px;
  text-align: center;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.app-footer span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
