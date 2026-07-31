import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'react-vendor'
            }
            if (id.includes('recharts')) {
              return 'charts-vendor'
            }
            if (id.includes('leaflet')) {
              return 'map-vendor'
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-icons')) {
              return 'ui-vendor'
            }
            if (id.includes('socket.io-client') || id.includes('axios') || id.includes('zustand')) {
              return 'state-vendor'
            }
          }
        },
      },
    },
  },
})