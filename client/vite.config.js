import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // In development, /api calls are forwarded to the Express server
  server: {
    // Keep the original Host header so the API same-origin check passes
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: false } },
  },
});
