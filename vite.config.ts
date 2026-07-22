import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

function normalizeBase(value: string | undefined) {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}/`;
}

const base = normalizeBase(process.env.OPENVOX_BASE);

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@tonejs/midi')) return 'midi-engine';
          if (id.includes('node_modules')) return 'framework';
          return undefined;
        }
      }
    },
    emptyOutDir: true,
    target: ['es2020', 'safari16.4'],
    sourcemap: false,
    cssCodeSplit: true
  }
});
