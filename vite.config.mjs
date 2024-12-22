import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.ELECTRON ? './' : '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: process.env.PORT || 3000,
    strictPort: false
  }
});