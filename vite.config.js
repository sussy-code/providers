const path = require('path');
const { defineConfig } = require('vitest/config');
const { default: eslint } = require('vite-plugin-eslint');
const dts = require('vite-plugin-dts');
const pkg = require('./package.json');

const main = path.resolve(__dirname, 'src/index.ts');

module.exports = defineConfig({
  plugins: [eslint(), dts({})],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: false,
    rollupOptions: {
      external: Object.keys(pkg.dependencies),
      output: {
        globals: Object.fromEntries(Object.keys(pkg.dependencies).map((v) => [v, v])),
      },
    },
    outDir: 'lib',

    lib: {
      entry: main,
      name: 'index',
      fileName: 'index',
      formats: ['umd', 'es'],
    },
  },
});
