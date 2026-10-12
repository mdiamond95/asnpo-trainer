import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { parse } from 'yaml';
import { fileURLToPath } from 'node:url';

// Lets the app `import unit from '../content/unit-01.yaml'`.
function yamlContent(): Plugin {
  return {
    name: 'yaml-content',
    transform(code, id) {
      if (!id.endsWith('.yaml')) return null;
      return { code: `export default ${JSON.stringify(parse(code))};`, map: null };
    },
  };
}

// Two builds from one codebase:
//   default  -> installable PWA for GitHub Pages (served from /asnpo-trainer/)
//   single   -> one self-contained HTML file for a claude.ai preview
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: single ? './' : '/asnpo-trainer/',
    resolve: single
      ? { alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/pwa-stub.ts', import.meta.url)) } }
      : {},
    plugins: [
      yamlContent(),
      react(),
      single
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['apple-touch-icon.png', 'icon.svg'],
            manifest: {
              name: 'Fund Balance: ASNPO Trainer',
              short_name: 'Fund Balance',
              description: 'Daily lessons on capital accounting and consolidation for Canadian not-for-profits under ASNPO.',
              theme_color: '#1f3d36',
              background_color: '#f6f4ee',
              display: 'standalone',
              orientation: 'portrait',
              start_url: '/asnpo-trainer/',
              scope: '/asnpo-trainer/',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
                  handler: 'CacheFirst',
                  options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
                },
              ],
            },
          }),
    ],
    build: single ? { outDir: 'dist-single' } : { outDir: 'dist' },
  };
});
