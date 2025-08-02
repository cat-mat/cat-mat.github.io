import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // VitePWA plugin temporarily disabled to fix service worker issues
    // VitePWA({
    //   registerType: 'manual',
    //   injectRegister: false,
    //   devOptions: {
    //     enabled: false
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/apis\.google\.com\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'google-apis-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 31536000 // 1 year
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   manifest: {
    //     name: 'What Even With My Hot Self?!',
    //     short_name: 'Hot Self',
    //     description: 'Track your perimenopause journey with personalized insights',
    //     theme_color: '#f093fb',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔥</text></svg>',
    //         sizes: 'any',
    //         type: 'image/svg+xml',
    //         purpose: 'any'
    //       }
    //     ]
    //   }
    // })
  ],
  define: {
    'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(process.env.VITE_GOOGLE_CLIENT_ID),
    'process.env.VITE_ENVIRONMENT': JSON.stringify(process.env.VITE_ENVIRONMENT || 'development'),
    'process.env.VITE_MOCK_GOOGLE_DRIVE': JSON.stringify(process.env.VITE_MOCK_GOOGLE_DRIVE || 'false')
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.VITE_ENVIRONMENT === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.VITE_ENVIRONMENT === 'production',
        drop_debugger: process.env.VITE_ENVIRONMENT === 'production'
      }
    },
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
    open: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },
  preview: {
    port: 4173,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  }
}) 