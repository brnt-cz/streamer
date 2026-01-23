import { watch, type Ref } from 'vue'

interface MediaSessionOptions {
  isPlaying: Ref<boolean>
  streamName: Ref<string | undefined>
  artwork: Ref<string | null>
  onPlay: () => void
  onPause: () => void
}

export function useMediaSession(options: MediaSessionOptions) {
  const { isPlaying, streamName, artwork, onPlay, onPause } = options

  if (!('mediaSession' in navigator)) {
    return
  }

  // Set up action handlers
  navigator.mediaSession.setActionHandler('play', onPlay)
  navigator.mediaSession.setActionHandler('pause', onPause)

  // Update playback state
  watch(isPlaying, (playing) => {
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, { immediate: true })

  // Update metadata when stream or artwork changes
  watch([streamName, artwork], ([name, logo]) => {
    if (name) {
      const artworkArray: MediaImage[] = []
      if (logo) {
        // Convert relative path to absolute URL
        const artworkUrl = logo.startsWith('/') ? window.location.origin + logo : logo
        artworkArray.push({
          src: artworkUrl,
          sizes: '100x100',
          type: 'image/png'
        })
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: name,
        artist: 'Streamer',
        album: 'Internet Radio',
        artwork: artworkArray
      })
    }
  }, { immediate: true })
}