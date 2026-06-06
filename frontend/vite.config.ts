import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': `http://localhost:${process.env.API_PORT ?? 3001}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
    testTimeout: 15000,
  },
});
