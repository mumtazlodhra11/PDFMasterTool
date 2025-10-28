import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://pdfmastertool.com',
  
  integrations: [
    react(),
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Custom URLs for dynamic routes
      customPages: [
        'https://pdfmastertool.com/tools/merge-pdf',
        'https://pdfmastertool.com/tools/split-pdf',
        'https://pdfmastertool.com/tools/compress-pdf',
        // ... all 30 tool pages
      ],
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
