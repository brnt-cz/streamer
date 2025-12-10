import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Language = 'en' | 'cs'

const STORAGE_KEY = 'streamer-language'

export const useLanguageStore = defineStore('language', () => {
  const currentLanguage = ref<Language>(loadLanguage())

  function loadLanguage(): Language {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'cs') {
      return saved
    }
    return 'en' // Default to English
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang
    localStorage.setItem(STORAGE_KEY, lang)
  }

  const isEnglish = computed(() => currentLanguage.value === 'en')
  const isCzech = computed(() => currentLanguage.value === 'cs')

  return {
    currentLanguage,
    setLanguage,
    isEnglish,
    isCzech
  }
})
