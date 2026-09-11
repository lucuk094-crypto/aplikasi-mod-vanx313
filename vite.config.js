import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Multi-page setup: every *.html in the repo root becomes a build entry,
// so `npm run build` bundles the whole site (not just index.html).
const root = dirname(fileURLToPath(import.meta.url));
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: Object.fromEntries(
                pages.map((f) => [f.replace(/\.html$/, ''), resolve(root, f)])
            )
        }
    }
});
