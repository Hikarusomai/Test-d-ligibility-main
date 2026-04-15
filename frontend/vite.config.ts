import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
    host: true,
    allowedHosts: [
      'localhost',
      'eligibility_frontend',
      'visa.matchmyschool.com',
    ],
  },
});
