import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// In production, scripts/swap-index.cjs makes dist/index.html = the static
// home page (public/home/index.html) and moves the React app to /app.html.
// In dev, Vite's SPA fallback was serving the leftover React shell for any
// unknown route — so /community, /shop, /mixology etc. all read as the old
// Lovable pages. This middleware mirrors production: every static path under
// public/ gets served directly, with "/" mapped to /home/.
const STATIC_PAGES = [
  '/home',     '/shop',          '/mixology',          '/extraction',
  '/health',   '/herbal-engine-2', '/community',       '/community/academy',
  '/tymetonics','/members',       '/mycelium-trance',  '/draw',
  '/patron',   '/onboard',       '/sporing',           '/basket',
  '/privacy',  '/terms',
];
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
  plugins: [react(), serveStaticPages()],
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