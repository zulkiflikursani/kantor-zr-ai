import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Disajikan oleh server.cjs di http://127.0.0.1:7868/3d/.
export default defineConfig({
  base: '/3d/',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
})
