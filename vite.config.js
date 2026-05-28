import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração otimizada para React + Vite (o próprio Vite cuidará da divisão dos arquivos automaticamente)
export default defineConfig({
  plugins: [react()],
})