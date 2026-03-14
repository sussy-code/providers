import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Providers',
      fileName: 'index',
      formats: ['es', 'cjs', 'umd']
    },
    outDir: 'lib',
    emptyOutDir: true,
    rollupOptions: {
      external: ['puppeteer'],
      output: {
        globals: {
          puppeteer: 'puppeteer'
        }
      }
    }
  },
  plugins: [dts()],
});
