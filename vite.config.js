const path = require('path');
const { defineConfig } = require('vitest/config');
const { default: eslint } = require('vite-plugin-eslint');
const dts = require('vite-plugin-dts');
const pkg = require('./package.json');
const fs = require('fs/promises');

const main = path.resolve(__dirname, 'src/index.ts');

module.exports = defineConfig({
  plugins: [
    eslint(),
    dts({
      rollupTypes: true,
      async afterBuild() {
        const filePath = path.join(__dirname, './lib/index.d.ts');
        await fs.writeFile(filePath.replace('.d.ts', '.d.mts'), await fs.readFile(filePath, 'utf-8'), 'utf-8');
      },
    }),
  ],
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
