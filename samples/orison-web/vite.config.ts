import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
          'physics-vendor': ['@dimforge/rapier3d-compat'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  publicDir: 'public',
  base: process.env.NODE_ENV === 'production' ? '/_0rison/' : '/',
});
