const path = require('path');
const { defineConfig } = require('vitest/config');
const { default: eslint } = require('vite-plugin-eslint');
const dts = require('vite-plugin-dts');

module.exports = defineConfig({
  plugins: [eslint(), dts()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'lib',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'providers',
      fileName: 'providers',
    },
  },
  test: {
    globals: true,
  },
});
