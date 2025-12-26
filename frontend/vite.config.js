import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  define: {
    global: 'globalThis', // Fix for simple-peer global undefined
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics', 'firebase/functions'],
          'fabric-vendor': ['fabric'],
          'utils-vendor': ['lodash', 'date-fns']
        }
      }
    }
  }
})
