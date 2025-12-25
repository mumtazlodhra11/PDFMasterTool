import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // For Cloudflare Pages (much faster than GitHub Pages!)
  site: 'https://pdfelitetools.com',
  base: '/',
  
  // Uncomment for GitHub Pages:
  // site: 'https://mumtazlodhra11.github.io',
  // base: '/PDFMasterTool',
  
  // CRITICAL: Prevent redirect issues for SEO
  // 'ignore' means URLs work with or without trailing slash (no redirect)
  trailingSlash: 'ignore',
  
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
    // Optimize assets
    assets: '_assets',
  },

  vite: {
    define: {
      // Only set production mode in build, not in dev
      // In dev mode, Astro will automatically set these correctly
    },
    build: {
      cssCodeSplit: true,
      cssMinify: true, // Enable CSS minification
      minify: 'terser', // Better minification with drop_console support
      target: 'esnext', // Use modern JS for smaller bundles
      modulePreload: { polyfill: false }, // Disable module preload polyfill
      terserOptions: {
        compress: {
          drop_console: true, // Remove all console.log in production
          drop_debugger: true,
          passes: 3, // More passes for better minification
          unsafe: true, // Enable unsafe optimizations
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_methods: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
          dead_code: true, // Remove dead code
          unused: true, // Remove unused code
        },
        mangle: {
          toplevel: true, // Mangle top-level names
          properties: false, // Don't mangle properties (safer)
        },
        format: {
          comments: false, // Remove comments
          ascii_only: false, // Allow non-ASCII characters
        },
      },
      rollupOptions: {
        output: {
          // ULTRA-OPTIMIZED: Split vendor chunks more granularly to reduce bundle size
          manualChunks: (id) => {
            // CRITICAL: Keep tesseract.js completely separate and lazy-loaded
            if (id.includes('tesseract')) {
              return 'tesseract-lazy';
            }
            
            // Split vendor chunks more granularly to prevent large bundles
            if (id.includes('node_modules')) {
              // Core React - separate chunk (small, frequently used)
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'react-core';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              
              // PDF libraries - separate chunks (large, lazy-loaded)
              if (id.includes('pdf-lib')) return 'pdf-lib';
              if (id.includes('pdfjs-dist')) return 'pdfjs';
              if (id.includes('jspdf')) return 'jspdf';
              
              // Office document libraries - separate chunks
              if (id.includes('mammoth')) return 'mammoth';
              if (id.includes('xlsx')) return 'xlsx';
              
              // Animation library - separate chunk
              if (id.includes('framer-motion')) return 'framer-motion';
              
              // AWS SDK - separate chunk (large, only for backend tools)
              if (id.includes('@aws-sdk')) return 'aws-sdk';
              
              // OpenAI - separate chunk (large, only for AI tools)
              if (id.includes('openai')) return 'openai';
              
              // File handling libraries - separate chunk
              if (id.includes('file-saver') || id.includes('blob-util') || id.includes('jszip')) {
                return 'file-utils';
              }
              
              // Other vendor libraries - split into smaller chunks
              // Group by common prefixes to reduce duplication
              if (id.includes('@types/')) {
                return 'types'; // TypeScript types (dev only, should be tree-shaken)
              }
              
              // Default vendor chunk for everything else
              return 'vendor';
            }
            
            // Don't split source files - let Astro handle it
            return null;
          },
          // Prevent code duplication - smaller chunks for better caching
          experimentalMinChunkSize: 15000, // Smaller chunks for better code splitting
          // Optimize chunk names for better caching
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: 'entry-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
        // Aggressive tree shaking to remove duplicates
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          preset: 'recommended',
        },
      },
      chunkSizeWarningLimit: 500, // Warn if chunk > 500KB (reduced from 1MB)
      // Reduce sourcemap size in production
      sourcemap: false, // Disable sourcemaps for smaller bundle
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'pdf-lib'],
      exclude: ['@astrojs/react', 'tesseract.js'], // Exclude tesseract.js from pre-bundling (WebAssembly)
      // Deduplicate dependencies
      dedupe: ['react', 'react-dom'],
    },
    ssr: {
      noExternal: ['pdf-lib'],
      // Exclude tesseract.js from SSR - it uses WebAssembly and Node.js modules
      external: ['tesseract.js'],
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
