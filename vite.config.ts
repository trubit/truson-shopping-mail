import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
