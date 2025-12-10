<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLanguageStore, type Language } from '../stores/language'

const languageStore = useLanguageStore()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const languages = [
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'cs' as Language, label: 'Čeština', flag: '🇨🇿' }
]

function getCurrentFlag() {
  return languages.find(l => l.code === languageStore.currentLanguage)?.flag || '🇬🇧'
}

function selectLanguage(code: Language) {
  languageStore.setLanguage(code)
  isOpen.value = false
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger Button -->
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-border-light rounded-[12px] text-sm font-medium text-white/70 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-border-lighter hover:text-text"
    >
      <span class="text-base leading-none">{{ getCurrentFlag() }}</span>
      <span class="hidden sm:inline">{{ languageStore.currentLanguage.toUpperCase() }}</span>
      <svg
        class="w-3.5 h-3.5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-1.5 min-w-[140px] bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden z-50"
      >
        <ul class="list-none p-1 m-0">
          <li
            v-for="lang in languages"
            :key="lang.code"
            @click="selectLanguage(lang.code)"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 hover:bg-white/[0.06]"
            :class="{ 'bg-[rgba(240,47,0,0.1)]': languageStore.currentLanguage === lang.code }"
          >
            <span class="text-lg leading-none">{{ lang.flag }}</span>
            <span class="text-sm text-white/80">{{ lang.label }}</span>
            <svg
              v-if="languageStore.currentLanguage === lang.code"
              class="w-4 h-4 ml-auto text-[#F02F00]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
