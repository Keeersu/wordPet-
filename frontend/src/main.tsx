import { prepareParaflow } from '@paraflow-ai/frontend-libs'
import IS_FAST_PROTOTYPE_MODE from '@/IS_FAST_PROTOTYPE_MODE.json'
import { createRoutes } from './routes'
import { createStore } from 'jotai'
import { createApp, onCaughtError } from './App'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { resetQueryClient } from './queryClient'
import './styles/index.css'

async function init() {
  const store = createStore()
  store.set(resetQueryClient)

  await prepareParaflow({
    store,
    routes: createRoutes(store),
  })

  if (IS_FAST_PROTOTYPE_MODE) {
    const { initBrowserPrototype } = await import('./prototype/browserPrototype')
    await initBrowserPrototype()
  }

  const App = createApp(store)
  createRoot(document.getElementById('bundler-root')!, { onCaughtError }).render(
    createElement(App),
  )
}
void init()
