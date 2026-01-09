import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Language = 'en' | 'cs'

const STORAGE_KEY = 'streamer-language'

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage quota exceeded or access denied (private mode)
  }
}

export const useLanguageStore = defineStore('language', () => {
  const currentLanguage = ref<Language>(loadLanguage())

  function loadLanguage(): Language {
    const saved = safeGetItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'cs') {
      return saved
    }
    return 'en' // Default to English
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang
    safeSetItem(STORAGE_KEY, lang)
  }

  return {
    currentLanguage,
    setLanguage
  }
})
