import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export default {
  root: here,
  publicDir: resolve(here, "public"),
  resolve: {
    alias: [
      { find: /^three$/, replacement: resolve(here, "node_modules/three/build/three.module.js") },
      { find: /^three\/addons/, replacement: resolve(here, "node_modules/three/examples/jsm") },
    ],
  },
  server: { host: "127.0.0.1", port: 5181 },
  preview: { host: "127.0.0.1", port: 4181 },
  build: { rollupOptions: { input: { main: resolve(here, "index.html"), model: resolve(here, "model-check.html") } } },
};
