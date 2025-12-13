// Custom preview server with compression
import { preview } from 'astro/dist/cli/preview/index.js';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 9001;

// Create server with compression
const server = createServer((req, res) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const supportsGzip = acceptEncoding.includes('gzip');
  
  // Handle static files with compression
  if (req.url && req.url.startsWith('/_astro/')) {
    try {
      const filePath = join(__dirname, 'dist', req.url);
      const fileContent = readFileSync(filePath);
      
      // Set appropriate content type
      if (req.url.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (req.url.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      
      // Compress if supported
      if (supportsGzip) {
        const compressed = gzipSync(fileContent);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        res.writeHead(200);
        res.end(compressed);
      } else {
        res.setHeader('Content-Length', fileContent.length);
        res.writeHead(200);
        res.end(fileContent);
      }
    } catch (error) {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }
  
  // For other requests, use Astro preview
  // This is a simplified version - in production, use proper middleware
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('Use: npm run preview (Astro handles compression)');
});

server.listen(PORT, () => {
  console.log(`Preview server with compression running on http://localhost:${PORT}`);
});










