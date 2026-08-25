import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'
import { registerSW } from 'virtual:pwa-register'

// Nová verze se vezme sama při dalším načtení, ať uživateli nezůstane
// viset stará aplikace
registerSW({ immediate: true })

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
