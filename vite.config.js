import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Otimiza chunks para mobile (carregamento mais rápido)
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
    // Aumenta limite de aviso de chunk
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: true, // Permite acesso pelo IP local (testar no celular físico)
    port: 5173,
  },
})
