import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  envDir: resolve(__dirname, '../..'),
  plugins: [react()],
  resolve: {
    alias: {
      '@zaradrop/ui': resolve(__dirname, '../../packages/ui/src'),
      '@zaradrop/core': resolve(__dirname, '../../packages/core/src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5176
  },
  preview: {
    host: '0.0.0.0',
    port: 4176
  }
});
