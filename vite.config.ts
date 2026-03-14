import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    target: "node18",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "providers",
      formats: ["es"],
      fileName: () => "index.js"
    },
    rollupOptions: {
      external: [
        "puppeteer",
        "@puppeteer/browsers",
        "http",
        "https",
        "url",
        "fs",
        "path",
        "child_process",
        "stream",
        "events",
        "net",
        "tls"
      ]
    }
  },

  optimizeDeps: {
    exclude: ["puppeteer", "@puppeteer/browsers"]
  }
});
