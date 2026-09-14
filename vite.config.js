import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Where the dev server sends /backend.
 *
 * Local by default, so fixes can be tested before they are deployed. The two
 * targets are shaped differently and the proxy has to account for it: the
 * server on this machine serves the API at its root (`/category`), while the
 * deployed one sits behind a path (`rockdiet.app/backend/category`). Only the
 * local one needs the prefix stripped.
 *
 *   npm run dev                                    → http://127.0.0.1:4000
 *   API_TARGET=https://rockdiet.app npm run dev    → the live server
 */
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:4000'
const TARGET_IS_LOCAL = !/^https?:\/\/(?!127\.0\.0\.1|localhost)/.test(API_TARGET)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Talk to the API from a local page.
      //
      // The browser can't call the deployed API directly from localhost: it
      // only allows the https://rockdiet.app origin, so every request would
      // fail CORS. Going through the dev server instead makes them
      // same-origin as far as the browser is concerned, and the proxy hop
      // happens server-side where CORS does not apply.
      //
      // Point VITE_API_URL at /backend/ (see .env.development) so requests
      // land here.
      '/backend': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        ...(TARGET_IS_LOCAL && {
          rewrite: (path) => path.replace(/^\/backend/, ''),
        }),
        configure: (proxy) => {
          // Strip the browser's Origin so the API treats this as a
          // server-to-server call and allows it, rather than checking
          // http://localhost:5173 against its allow-list and refusing.
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})
