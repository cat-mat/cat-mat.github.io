import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/cat-mat.github.io-1/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'What Even With My Hot Self?!',
        short_name: 'Hot Self',
        description: 'A body, mind, and emotional changes tracker for women in perimenopause and beyond',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        swSrc: 'public/sw.js',
        swDest: 'sw.js'
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  define: {
    'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(process.env.VITE_GOOGLE_CLIENT_ID),
    'process.env.VITE_ENVIRONMENT': JSON.stringify(process.env.VITE_ENVIRONMENT || 'development'),
    'process.env.VITE_MOCK_GOOGLE_DRIVE': JSON.stringify(process.env.VITE_MOCK_GOOGLE_DRIVE || 'false'),
    'process.env.VITE_CLAUDE_API_KEY': JSON.stringify(process.env.VITE_CLAUDE_API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.VITE_ENVIRONMENT === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          google: ['googleapis'],
          utils: ['date-fns', 'date-fns-tz', 'simple-statistics']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}) 