import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import components from '@/components/ui'
import initSentry from "@/helpers/sentry/sentry.js";

const app = createApp(App)

components.forEach(component => {
    app.component(component.name, component)
})

initSentry(app, router)

app.use(store)
    .use(router)
    .mount('#app')
