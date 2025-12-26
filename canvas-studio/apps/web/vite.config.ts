import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: resolve(rootDir, '../../..'),
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
  server: {
    port: 5173,
  },
});
