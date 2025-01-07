export default {
  root: 'src',
  base: './',
  server: {
    port: 3000,
    strictPort: true,
    open: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/pages/index.html',
        settings: 'src/pages/settings.html'
      }
    }
  }
}