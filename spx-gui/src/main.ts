import { createApp } from 'vue'
import VueKonva from 'vue-konva'
import { VueQueryPlugin } from '@tanstack/vue-query'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh'

import { initI18n } from './i18n'
import App from './App.vue'
import { initRouter } from './router'
import { initStore, useUserStore } from './stores'
import { client } from './apis/common'
import { CustomTransformer } from './components/editor/preview/stage-viewer/custom-transformer'

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

const initApiClient = async () => {
  const userStore = useUserStore()
  client.setAuthProvider(userStore.getFreshAccessToken)
}

async function initApp() {
  const app = createApp(App)

  initStore(app)
  initApiClient()
  await initRouter(app)
  await initI18n(app)

  app.use(VueKonva as any, {
    customNodes: { CustomTransformer }
  })

  app.use(VueQueryPlugin)

  app.mount('#app')
}

initApp()
