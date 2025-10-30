import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // For Cloudflare Pages (much faster than GitHub Pages!)
  site: 'https://pdfmastertool.pages.dev',
  base: '/',
  
  // Uncomment for GitHub Pages:
  // site: 'https://mumtazlodhra11.github.io',
  // base: '/PDFMasterTool',
  
  integrations: [
    react(),
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  // Performance optimizations
  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'pdf-lib': ['pdf-lib'],
            'react-vendor': ['react', 'react-dom'],
            'ai-utils': ['tesseract.js'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'pdf-lib'],
    },
    ssr: {
      noExternal: ['pdf-lib'],
    },
  },

  // Server configuration
  server: {
    port: 9001,
    host: true,
  },

  // Preview configuration
  preview: {
    port: 9001,
    host: true,
  },

  // Compression
  compressHTML: true,
});
