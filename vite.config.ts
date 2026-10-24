import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        selfDestroying: true,
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'handballsim_official.png', 'icon-192.png', 'icon-512.png', 'maskable-icon-512.png'],
        workbox: {
          globIgnores: ['**/index.html'],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,ico,png,svg,json,woff,woff2}'],
        },
        manifest: {
          id: '/',
          name: 'Handball Manager Sim',
          short_name: 'HandballSim',
          description: 'Step into the shoes of a Handball Manager. Plan strategies, manage squad budgets, upgrade your arena, and compete in domestic and European leagues in this comprehensive simulation.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#090a0f',
          theme_color: '#090a0f',
          categories: ['games', 'sports', 'entertainment'],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/maskable-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
