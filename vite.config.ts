import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { ServerResponse } from 'http'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, './src/client'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/client/components'),
      '@pages': path.resolve(__dirname, './src/client/pages'),
      '@hooks': path.resolve(__dirname, './src/client/hooks'),
      '@store': path.resolve(__dirname, './src/client/store'),
      '@services': path.resolve(__dirname, './src/client/services'),
      '@layouts': path.resolve(__dirname, './src/client/layouts'),
      '@features': path.resolve(__dirname, './src/client/features'),
      '@assets': path.resolve(__dirname, './src/client/assets'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const r = res as ServerResponse
            if (!r.headersSent) {
              r.writeHead(503, { 'Content-Type': 'application/json' })
              r.end(JSON.stringify({ success: false, message: 'Server is starting up, please retry' }))
            }
          })
        },
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
