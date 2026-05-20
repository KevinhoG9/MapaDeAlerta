import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
   base: "/MapaDeAlerta",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // GLB + SVG + CSV suportados
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.svg', '**/*.csv'],

  build: {
    // Aumenta o limite de chunk pra não warnings com Three.js
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        // Separa Three.js em chunk próprio — carrega mais rápido
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'mapbox-vendor': ['mapbox-gl'],
        },
      },
    },
  },

  // Otimiza deps pesadas no dev
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'mapbox-gl'],
    exclude: [],
  },
})

