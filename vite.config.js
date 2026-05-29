import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',  // ← atualiza sozinho sempre
      workbox: {
        skipWaiting: true,          // ← não espera fechar o app
        clientsClaim: true,         // ← assume controle imediato
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})