import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import http from 'node:http'
import https from 'node:https'
import type { ProxyOptions } from 'vite'

// HTTP primul (mereu disponibil cu `dotnet run`), HTTPS ca fallback
const apiTargets = ['http://localhost:5008', 'https://localhost:7051']

/**
 * Verifică dacă un URL backend răspunde.
 * Timeout scurt (1.5s) — rulează la startup Vite.
 */
function probeUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url + '/health/live', { timeout: 1500, rejectUnauthorized: false }, (res) => {
      res.resume() // consumă body-ul ca să nu blocheze socket-ul
      resolve(res.statusCode !== undefined)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

/**
 * Detectează la startup care backend e disponibil,
 * cu failover la runtime dacă target-ul activ pică.
 */
function createApiProxy(): ProxyOptions {
  let activeTarget = apiTargets[0]

  // Probă asincronă la startup — setează target-ul corect înainte de prima cerere
  ;(async () => {
    for (const url of apiTargets) {
      if (await probeUrl(url)) {
        activeTarget = url
        console.log(`[proxy] Backend detectat pe ${url}`)
        return
      }
    }
    console.warn(`[proxy] Niciun backend disponibil! Se folosește ${activeTarget} implicit.`)
  })()

  return {
    target: activeTarget,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      // Actualizează target-ul intern al proxy-ului la cel detectat
      const syncTarget = () => {
        const opts = proxy as unknown as { options: { target: string } }
        if (opts.options.target !== activeTarget) {
          opts.options.target = activeTarget
        }
      }

      // Înainte de fiecare request, asigură-te că target-ul e sincronizat
      proxy.on('proxyReq', () => syncTarget())

      // La eroare de conexiune — comută la celălalt target
      proxy.on('error', (_err, _req, _res) => {
        const next = apiTargets.find((t) => t !== activeTarget)
        if (next) {
          activeTarget = next
          syncTarget()
          console.log(`[proxy] Backend indisponibil, comut pe ${activeTarget}`)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Permite import @/styles/variables în orice SCSS fără a-l importa manual
        additionalData: `@use "@/styles/variables" as *;`,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': createApiProxy(),
    },
  },
})

