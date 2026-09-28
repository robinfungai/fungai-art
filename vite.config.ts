import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'

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
  // The standard formula analysis (public/formula-analysis/), opened from
  // Mixology, Find your formula and the formula book.
  '/formula-analysis',
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

// /api/* is served by Netlify Functions in production. In dev there is no
// function runtime on :5173, so the formula analysis is wired straight to
// its handler here — the engine part works locally; MYCO's reading needs
// ANTHROPIC_API_KEY in the environment and otherwise says it is off.
//
// 2026-09-28: the formula endpoint and the pro-access check run here too,
// so both quizzes compose on localhost. Without SUPABASE_SERVICE_ROLE_KEY
// the formula is not stored (persisted:false) and MYCO falls back to the
// deterministic engine without ANTHROPIC_API_KEY. FYF_DEV_PRACTITIONER
// lets the pro page through without a service key — set only in THIS
// process, which Netlify never runs (src/server/practitioner.mjs).
const devFunctions = () => ({
  name: 'dev-netlify-functions',
  configureServer(server: any) {
    process.env.FYF_DEV_PRACTITIONER = '1';
    const ROUTES: Record<string, string> = {
      '/api/formula-analysis': './netlify/functions/formula-analysis.mjs',
      '/api/fyf/compose':      './netlify/functions/fyf-compose.mjs',
      '/api/pro-access':       './netlify/functions/pro-access.mjs',
    };
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const pathOnly = (req.url || '').split('?')[0];
      const file = ROUTES[pathOnly];
      if (!file) return next();
      try {
        const chunks: Buffer[] = [];
        for await (const ch of req) chunks.push(ch as Buffer);
        const url = pathToFileURL(path.resolve(__dirname, file)).href;
        const mod = await import(/* @vite-ignore */ url);
        const bodyText = Buffer.concat(chunks).toString('utf8');
        // Two function styles live in netlify/functions: the classic
        // `handler(event)` returning { statusCode, body }, and the newer
        // `export default (Request) => Response`.
        if (typeof mod.handler !== 'function' && typeof mod.default === 'function') {
          const headers = new Headers();
          Object.entries(req.headers || {}).forEach(([k, v]) => { if (typeof v === 'string') headers.set(k, v); });
          const request = new Request('http://localhost:5173' + req.url, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : bodyText,
          });
          const response: Response = await mod.default(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(await response.text());
          return;
        }
        const out = await mod.handler({
          httpMethod: req.method,
          headers: req.headers,
          body: bodyText,
        });
        res.statusCode = out.statusCode || 200;
        Object.entries(out.headers || {}).forEach(([k, v]) => res.setHeader(k, v as string));
        res.end(out.body || '');
      } catch (e: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'dev function failed: ' + String(e && e.message) }));
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
        // /foo → /foo/, as Netlify does. Served without the slash, the
        // page's relative scripts (spore/app-living.js, vendor/react…)
        // resolve against / and 404, and /community renders black.
        const [urlPath, query] = (req.url || '').split('?');
        if (!urlPath.endsWith('/')) {
          res.statusCode = 301;
          res.setHeader('Location', urlPath + '/' + (query ? '?' + query : ''));
          return res.end();
        }
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
  plugins: [react(), compileJsx(), devFunctions(), serveStaticPages()],
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