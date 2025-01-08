export default {
  root: 'src',
  base: './',
  server: {
    port: 3000,
    strictPort: true,
    open: true
  },
  plugins: [{
    name: 'configure-response-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/') {
          res.writeHead(302, { Location: '/pages/index.html' });
          res.end();
        } else {
          next();
        }
      });
    }
  }],
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