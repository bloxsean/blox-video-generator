import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/v2/video/': {
        target: 'https://api.field59.com',
        changeOrigin: true,
        secure: true
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    fs: {
      strict: false
    },
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@mui/material', '@emotion/react', '@emotion/styled']
  },
  clearScreen: false
});