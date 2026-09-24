import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'

// vite.config.ts is bundled to ESM before it runs, so a bare require() of a
// CJS file gets rewritten and its own require('fs') fails. createRequire
// gives us the real Node resolver, keeping scripts/build-community.cjs the
// single source of truth for how portal JSX is compiled.
const nodeRequire = createRequire(import.meta.url)

// In production, scripts/swap-index.cjs makes dist/index.html = the static
// home page (public/home/index.html) and moves the React app to /app.html.
// In dev, Vite's SPA fallback was serving the leftover React shell for any
// unknown route — so /community, /shop, /mixology etc. all read as the old
// Lovable pages. This middleware mirrors production: every static path under
// public/ gets served directly, with "/" mapped to /home/.
const STATIC_PAGES = [
  '/home',     '/shop',          '/mixology',          '/extraction',
  '/health',   '/herbal-engine-2', '/community',       '/community/academy',
  '/tymetonics','/members',       '/dinner-experience',  '/mycelium',  '/draw',
  '/onboard',  '/mycel-basket',
  '/privacy',  '/terms',         '/covenant',
  // Product detail pages — one static HTML per hero product under /shop/[slug]/
  '/shop/amanita',      '/shop/adhd-support', '/shop/sleepy-sleepy',
  '/shop/temple-nectar','/shop/lucid',
  '/shop/chaga',        '/shop/wild-cordyceps', '/shop/nervous-system-tonic',
  '/shop/healthy-aging','/shop/shilajit',
  '/moder-jord',
  // Dinner Experience sub-pages
  '/the-house-ethos', '/the-tasting-arc', '/dinner-experience-sample-menu',
  // Consumer-facing quiz landing (IG traffic → reserve extract)
  '/find-your-formula',
  '/find-your-formula-pro',
  // Chapter-selection gateway into the shop (public/explorer/)
  '/explorer',
  // The botanical atlas (public/atlas/). Note public/atlas/ also holds the
  // hero media and the generated data, which Vite serves as static files —
  // only the bare /atlas path needs this entry.
  '/atlas',
];

// Academy P0.5 · the community portal no longer ships raw JSX with
// @babel/standalone — scripts/build-community.cjs compiles each .jsx to a
// sibling .js at build time. In dev those artifacts may be missing or stale,
// so compile on request: /community/spore/app-living.js is served from
// app-living.jsx through the same esbuild transform the build script uses.
const compileJsx = () => ({
  name: 'compile-community-jsx',
  configureServer(server: any) {
    const { compileSource } = nodeRequire('./scripts/build-community.cjs');
    server.middlewares.use((req: any, res: any, next: any) => {
      const pathOnly = (req.url || '').split('?')[0];
      if (!pathOnly.startsWith('/community/') || !pathOnly.endsWith('.js')) return next();
      const jsxPath = path.resolve(__dirname, 'public' + pathOnly.replace(/\.js$/, '.jsx'));
      if (!fs.existsSync(jsxPath)) return next();
      try {
        const code = compileSource(fs.readFileSync(jsxPath, 'utf8'), pathOnly);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(code);
      } catch (e: any) {
        res.statusCode = 500;
        res.end('/* JSX compile error in ' + pathOnly + ': ' + String(e && e.message) + ' */');
      }
    });
  },
});

const serveStaticPages = () => ({
  name: 'serve-static-pages',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      // Strip query string + trailing slash for matching
      const pathOnly = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';

      // Root → home
      if (pathOnly === '/' || pathOnly === '/index.html') {
        return sendFile(res, 'public/home/index.html', next);
      }
      // Any /foo or /foo/ that has a public/foo/index.html
      if (STATIC_PAGES.includes(pathOnly)) {
        return sendFile(res, 'public' + pathOnly + '/index.html', next);
      }
      next();
    });
  },
});
function sendFile(res: any, relPath: string, next: any) {
  try {
    const html = fs.readFileSync(path.resolve(__dirname, relPath), 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (e) {
    next();
  }
}

export default defineConfig({
  // 'mpa' = multi-page-app. Tells Vite NOT to fall back to index.html for
  // unknown routes (that's the SPA default and was loading the React shell
  // when visiting /community, /shop, etc.).
  appType: 'mpa',
  // Pin the dev port. Vite's default is to hop to 5174, 5175… when 5173 is
  // busy, and a Supabase session is stored per ORIGIN — port included. So a
  // silent hop signs you out and makes it look like the token expired, which
  // is what it looked like on 2026-09-25. strictPort fails loudly instead, so
  // you go and close the other server rather than re-doing a magic link.
  server: { port: 5173, strictPort: true },
  plugins: [react(), compileJsx(), serveStaticPages()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:    path.resolve(__dirname, 'index.html'),
        foraging: path.resolve(__dirname, 'foraging.html'),
      },
    },
  },
})