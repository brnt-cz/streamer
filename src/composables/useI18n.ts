import { computed } from 'vue'
import { useLanguageStore } from '../stores/language'
import { translations, type CategoryKey } from '../i18n/translations'

export function useI18n() {
  const languageStore = useLanguageStore()

  const t = computed(() => {
    const lang = languageStore.currentLanguage
    return translations[lang]
  })

  function getCategoryLabel(cat: string): string {
    const lang = languageStore.currentLanguage
    const categories = translations[lang].categories
    return categories[cat as CategoryKey] || cat
  }

  return {
    t,
    getCategoryLabel,
    currentLanguage: computed(() => languageStore.currentLanguage),
    setLanguage: languageStore.setLanguage
  }
}
