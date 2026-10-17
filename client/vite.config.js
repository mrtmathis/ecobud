import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// After the build, lists every script and style in the service worker so all pages open offline,
// and names its cache after this list so each new version replaces the old files
function precacheBuild() {
  let files = [];
  let outDir = 'dist';
  return {
    name: 'ecobud-precache',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    generateBundle(options, bundle) {
      files = Object.keys(bundle)
        .filter((file) => /.(js|css)$/.test(file))
        .map((file) => `/${file}`)
        .sort();
    },
    closeBundle() {
      const swPath = path.resolve(outDir, 'sw.js');
      const version = createHash('sha256').update(files.join()).digest('hex').slice(0, 12);
      const sw = fs
        .readFileSync(swPath, 'utf8')
        .replace("const CACHE = 'ecobud-dev';", `const CACHE = 'ecobud-${version}';`)
        .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(files)};`);
      fs.writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  plugins: [react(), precacheBuild()],
  // In development, /api calls are forwarded to the Express server
  server: {
    // Keep the original Host header so the API same-origin check passes
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: false } },
  },
});
