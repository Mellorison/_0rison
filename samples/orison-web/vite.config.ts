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
  },
  publicDir: 'public',
  base: process.env.NODE_ENV === 'production' ? '/_0rison/' : '/',
});
