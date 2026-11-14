import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative, so the same build works at andreboufama.com and at aboufama.github.io/website/
  // (the page has no routes: everything is fetched relative to the one index.html).
  base: './',
})
