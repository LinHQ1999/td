import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from "path";

export default defineConfig({
  root: "./src/renderer",
  build: {
    outDir: resolve(__dirname, "out", "static")
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
    }
  }
})
