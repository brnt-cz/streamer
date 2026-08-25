import type HlsType from 'hls.js'

/**
 * Připojení streamu k <audio>.
 *
 * HLS (.m3u8) umí nativně jen Safari; jinde je potřeba hls.js, jinak stanice
 * nehraje vůbec. Knihovna má ~500 kB, takže se načítá dynamicky až ve chvíli,
 * kdy si uživatel pustí HLS stanici — ostatní ji vůbec nestahují.
 */
export function useAudioSource() {
  let hls: HlsType | null = null
  // Roste s každou změnou zdroje. Když se během načítání hls.js přepne stanice,
  // pozdě dorazivší import se podle něj pozná a zahodí.
  let generation = 0

  function isHlsUrl(url: string): boolean {
    return /\.m3u8(\?|$)/i.test(url)
  }

  /** Zahodí případnou hls.js instanci i s jejími buffery a requesty */
  function detachSource(): void {
    if (!hls) return
    hls.destroy()
    hls = null
  }

  async function attachHls(audio: HTMLAudioElement, url: string, forGeneration: number): Promise<void> {
    const { default: Hls } = await import('hls.js')
    if (forGeneration !== generation) return

    // Pořadí je schválně takhle: na `canPlayType` se u HLS spolehnout nedá,
    // Chrome na 'application/vnd.apple.mpegurl' odpoví "maybe", ale přehrát to
    // neumí. Tam, kde jsou Media Source Extensions, jede hls.js; nativní cesta
    // zbývá pro Safari/iOS, kde MSE nejsou.
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(url)
      hls.attachMedia(audio)
      return
    }

    audio.src = url
    audio.load()
  }

  /** Nastaví zdroj streamu; u HLS si podle potřeby dotáhne hls.js */
  function attachSource(audio: HTMLAudioElement, url: string): void {
    detachSource()
    generation++

    if (isHlsUrl(url)) {
      void attachHls(audio, url, generation)
      return
    }

    audio.src = url
    audio.load()
  }

  /** Uvolní zdroj úplně (kvůli mobilním datům) */
  function clearSource(audio: HTMLAudioElement): void {
    detachSource()
    generation++
    audio.removeAttribute('src')
    audio.load()
  }

  return { attachSource, detachSource, clearSource, isHlsUrl }
}
