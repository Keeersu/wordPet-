import { createBrowserRouter, RouteObject, RouterProvider } from "react-router-dom"
import { StrictMode } from "react"
import { type createStore, Provider } from "jotai"
import { createRoutes } from "./routes"
import { GameProvider } from "./store/GameContext"
import { useBackgroundRoomGen } from "./lib/useBackgroundRoomGen"

/**
 * AuthRequiredError (401) is an expected flow-control signal (redirect to login),
 * not a bug. Suppress its error reporting from React 19's onCaughtError and
 * React Router v7's onError so it doesn't pollute console/stderr.
 *
 * See: https://react.dev/reference/react-dom/client/createRoot#parameters (onCaughtError)
 * See: React Router v7 RouterProvider onError prop
 */
const isAuthRequiredError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AuthRequiredError'

/** React 19 createRoot option — controls Error Boundary error reporting */
export const onCaughtError: (error: unknown, errorInfo: React.ErrorInfo) => void = (error, errorInfo) => {
  if (isAuthRequiredError(error)) return
  console.error(error, errorInfo)
}

/** React Router v7 RouterProvider prop — controls React Router's error boundary reporting */
const onRouterError: (error: unknown, info: { location: unknown }) => void = (error) => {
  if (isAuthRequiredError(error)) return
  console.error('React Router caught the following error during render', error)
}

type Store = ReturnType<typeof createStore>

export function createApp(store: Store) {
  const routes = createRoutes(store)
  const router = createBrowserRouter(routes)

  // Error handling is done at route level via RouteErrorBoundary (see routes.ts errorElement)
  // This handles AuthRequiredError (401 -> login redirect) and ForbiddenError (403 -> Access Denied)
  function BackgroundTasks() {
    useBackgroundRoomGen()
    return null
  }

  return function App() {
    return (
      <StrictMode>
        <Provider store={store}>
          <GameProvider>
            <BackgroundTasks />
            <RouterProvider router={router} onError={onRouterError} />
          </GameProvider>
        </Provider>
      </StrictMode>
    )
  }
}
