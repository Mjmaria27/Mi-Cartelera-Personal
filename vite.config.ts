
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración para GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/Mi-Cartelera-Personal/',
})
