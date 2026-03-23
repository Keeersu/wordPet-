import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'
import Handlebars from 'handlebars'
import { browserPrototypePlugin } from './vite-plugins/browserPrototypePlugin'
import { tmpdir } from 'os'

function fetchUrl(target: string, maxRedirects = 5): Promise<{ statusCode: number; contentType: string; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const mod = target.startsWith('https') ? https : http
    mod.get(target, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        const redir = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, target).href
        res.resume()
        fetchUrl(redir, maxRedirects - 1).then(resolve, reject)
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => resolve({
        statusCode: res.statusCode || 200,
        contentType: (res.headers['content-type'] as string) || 'image/png',
        body: Buffer.concat(chunks),
      }))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function imageProxyPlugin() {
  return {
    name: 'image-proxy',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/_img_proxy?')) return next()
        const params = new URLSearchParams(req.url.split('?')[1])
        const target = params.get('url')
        if (!target) { res.statusCode = 400; res.end('Missing url param'); return }
        fetchUrl(target)
          .then(({ statusCode, contentType, body }) => {
            if (statusCode >= 400) { res.statusCode = statusCode; res.end(); return }
            res.setHeader('Content-Type', contentType)
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Cache-Control', 'public, max-age=86400')
            res.end(body)
          })
          .catch((e: Error) => {
            console.error('[image-proxy] error:', e.message)
            res.statusCode = 502
            res.end(e.message)
          })
      })
    },
  }
}

function handlebarsPrecompile() {
  return {
    name: 'handlebars-precompile',
    transform(code: string, id: string) {
      if (id.endsWith('.hbs')) {
        const precompiled = Handlebars.precompile(code)
        return {
          code: `export default ${precompiled};`,
          map: null
        }
      }
    }
  }
}

const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT
const sentryRelease = process.env.VITE_SENTRY_RELEASE
const cssCheckOnly = process.env.CSS_CHECK_ONLY

// Read FAST_PROTOTYPE_MODE from JSON file
const prototypeModePath = path.resolve(__dirname, './src/IS_FAST_PROTOTYPE_MODE.json')
const fastPrototypeMode = fs.existsSync(prototypeModePath) && JSON.parse(fs.readFileSync(prototypeModePath, 'utf-8')) === true

export default defineConfig(() => {

  const plugins = [
    react(),
    tailwindcss(),
    handlebarsPrecompile(),
    imageProxyPlugin(),
    browserPrototypePlugin({ fastPrototypeMode }),
  ]

  if (!cssCheckOnly) {
    plugins.push(
      sentryVitePlugin({
        org: sentryOrg,
        project: sentryProject,
        release: { name: sentryRelease },
      })
    )
  }

  return {
    build: {
      outDir: !cssCheckOnly ? path.resolve(__dirname, '../dist/client') : path.resolve(tmpdir(), 'vite-dry-run'),
      sourcemap: true,
      rollupOptions: !cssCheckOnly ? undefined : {
        input: {
          cssOnly: path.resolve(__dirname, 'src/styles/index.css')
        }
      }
    },
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@frontend': path.resolve(__dirname, '../frontend/src'),
        '@backend': path.resolve(__dirname, '../backend/src'),
      },
    },
    server: {
      host: true,
      port: 8000,
      strictPort: true,
      allowedHosts: true,
      // Disable proxy in FAST_PROTOTYPE_MODE (API is handled in-browser)
      proxy: {
        ...(fastPrototypeMode
          ? {}
          : {
            '/api': {
              target: 'http://localhost:8787',
              changeOrigin: true,
            },
            '/proxy': {
              target: 'http://localhost:8787',
              changeOrigin: true,
            },
          }),
        '/modai-api': {
          target: 'https://conan-modai-studio.zhenguanyu.com',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/modai-api/, '/conan-modai-studio/api/web/ai'),
        },
      },
    },
    // PGLite requires exclusion from Vite's dependency optimization
    // because it has special WASM loading logic
    optimizeDeps: {
      exclude: ['@electric-sql/pglite'],
    },
  }
})
