import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    rollupOptions: {
      external: [
        'puppeteer',
        '@puppeteer/browsers',
        'http',
        'https',
        'url',
        'fs',
        'path',
        'child_process',
        'stream',
        'events',
        'net',
        'tls'
      ],
    },
  },

  optimizeDeps: {
    exclude: ['puppeteer', '@puppeteer/browsers'],
  },

  ssr: {
    external: ['puppeteer', '@puppeteer/browsers'],
  },
});
