import type { MiddlewareHandler } from 'astro';

// Middleware to handle redirects properly for SEO
// This prevents unnecessary redirects that Google Search Console flags
// 
// CRITICAL: Ensures all URLs use non-www (canonical URL)
// This fixes "Page with redirect" errors in Google Search Console
// HTTPS redirects are handled by the hosting platform (Cloudflare Pages, etc.)

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname;
  
  // CRITICAL FIX: Redirect www to non-www (canonical URL)
  // This ensures consistent URLs and prevents duplicate content issues
  // Handles both production domain and any www variants
  if (hostname.startsWith('www.')) {
    // Remove www prefix
    url.hostname = hostname.replace(/^www\./, '');
    
    // Preserve path, query, and hash
    const redirectUrl = url.toString();
    
    return new Response(null, {
      status: 301, // Permanent redirect (tells Google this is the canonical URL)
      headers: {
        'Location': redirectUrl,
        // Add cache control to help with SEO
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  
  // Continue with the request (no redirect needed - already non-www)
  return next();
};

