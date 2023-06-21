const path = require('path');
const { defineConfig } = require('vitest/config');
const { default: eslint } = require('vite-plugin-eslint');
const dts = require('vite-plugin-dts');

const main = path.resolve(__dirname, 'src/index.ts');

module.exports = defineConfig({
  plugins: [
    eslint(),
    dts({
      include: [main],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: false,
    outDir: 'lib',

    lib: {
      entry: main,
      name: 'providers',
      fileName: 'providers',
    },
  },
  test: {
    globals: true,
  },
});
