// Forced update to clear GitHub cache
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // <--- DOUBLE CHECK THIS WORD
import path from "path"

export default defineConfig({
  plugins: [react()],
  base: './', 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
  },
})