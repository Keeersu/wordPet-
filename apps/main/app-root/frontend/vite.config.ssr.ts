import { defineConfig, mergeConfig } from 'vite'
import baseConfigFn from './vite.config'
import * as path from 'path'

/**
 * SSR/prerender is disabled for this project.
 * This config is kept only to avoid breaking references.
 */
export default defineConfig((env) => {
  const baseConfig = baseConfigFn(env)

  return mergeConfig(baseConfig, {
    build: {
      outDir: path.resolve(__dirname, '../dist/ssr'),
      ssr: false,
      rollupOptions: {
        input: path.resolve(__dirname, 'scripts/ssr-entry.tsx'),
        output: {
          entryFileNames: 'ssr-entry.js',
        },
      },
      // Minification not needed for SSR bundle
      minify: false,
      // Generate sourcemaps for debugging
      sourcemap: true,
    },
    // SSR doesn't need dev server config
    server: undefined,
  })
})
