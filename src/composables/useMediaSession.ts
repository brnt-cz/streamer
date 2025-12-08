import { watch, type Ref } from 'vue'

interface MediaSessionOptions {
  isPlaying: Ref<boolean>
  streamName: Ref<string | undefined>
  onPlay: () => void
  onPause: () => void
}

export function useMediaSession(options: MediaSessionOptions) {
  const { isPlaying, streamName, onPlay, onPause } = options

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

  // Update metadata when stream changes
  watch(streamName, (name) => {
    if (name) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: name,
        artist: 'Streamer',
        album: 'Internet Radio'
      })
    }
  }, { immediate: true })
}