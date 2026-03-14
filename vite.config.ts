import path from 'path';
import { defineConfig } from 'vitest/config';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

const shouldTestProviders = process.env.MW_TEST_PROVIDERS === 'true';
let tests: string[] = ['src/__test__/standard/**/*.test.ts'];
if (shouldTestProviders) tests = ['src/__test__/providers/**/*.test.ts'];

export default defineConfig((env) => ({
  plugins: [
    env.mode !== 'test' && eslintPlugin(),
    dts({ rollupTypes: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
      formats: ['umd', 'es'],
    },
    outDir: 'lib',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      // Externalize dependencies that should not be bundled
      external: [
        ...Object.keys(pkg.dependencies),
    'puppeteer',
    '@puppeteer/browsers',
    'proxy-agent',
    'node:http',
    'node:https',
    'node:url',
    'node:path',
    'node:fs',
      ],
      output: {
        globals: Object.fromEntries(
          Object.keys(pkg.dependencies).map((v) => [v, v])
        ),
      },
    },
  },
  test: {
    include: tests,
  },
}));
