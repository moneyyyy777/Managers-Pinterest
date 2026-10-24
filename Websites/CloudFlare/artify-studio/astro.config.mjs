// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/christmas/christmas-mugs': '/christmas/laser-cut'
  },
  vite: {
    plugins: [tailwindcss()],
  }
});