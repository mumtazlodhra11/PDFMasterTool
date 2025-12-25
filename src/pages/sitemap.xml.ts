import type { APIRoute } from 'astro';
import toolsData from '@/config/tools.json';

const { tools } = toolsData;

export const GET: APIRoute = async () => {
  // CRITICAL: Always use non-www canonical URL for sitemap
  // This matches the site config and prevents redirect issues
  // Ensures Google indexes non-www version
  const siteUrl = 'https://pdfelitetools.com'; // Non-www only
  const currentDate = new Date().toISOString().split('T')[0];

  // Static pages with optimized priorities
  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/pricing', changefreq: 'weekly', priority: '0.8' },
    { url: '/about', changefreq: 'monthly', priority: '0.7' },
    { url: '/contact', changefreq: 'monthly', priority: '0.6' },
    { url: '/privacy', changefreq: 'yearly', priority: '0.5' },
    { url: '/terms', changefreq: 'yearly', priority: '0.5' },
    { url: '/security', changefreq: 'monthly', priority: '0.6' },
    { url: '/faq', changefreq: 'weekly', priority: '0.8' },
    { url: '/blog', changefreq: 'daily', priority: '0.9' },
  ];

  // Tool pages with higher priority for popular tools
  const popularToolIds = [
    'merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-word', 
    'word-to-pdf', 'pdf-to-excel', 'pdf-to-powerpoint', 'image-to-pdf'
  ];

  const toolPages = tools.map((tool: any) => ({
    url: `/tools/${tool.id}`,
    changefreq: 'weekly',
    priority: popularToolIds.includes(tool.id) ? '0.95' : (tool.aiEnhanced ? '0.9' : '0.85'),
    lastmod: currentDate,
  }));

  // Blog category pages (for future blog implementation)
  const blogCategories = [
    'pdf-tips', 'tutorials', 'product-updates', 'comparisons'
  ];

  const blogCategoryPages = blogCategories.map(cat => ({
    url: `/blog/${cat}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: currentDate,
  }));

  const allPages = [...staticPages, ...toolPages, ...blogCategoryPages];

  // Function to escape XML entities
  const escapeXml = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Generate sitemap with image support
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${allPages
  .map(
    (page) => {
      const isToolPage = page.url.startsWith('/tools/');
      const toolId = isToolPage ? page.url.replace('/tools/', '') : null;
      const tool = isToolPage ? tools.find((t: any) => t.id === toolId) : null;
      
      return `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${isToolPage && toolId && tool ? `
    <image:image>
      <image:loc>${siteUrl}/og-images/${toolId}.jpg</image:loc>
      <image:title>${escapeXml(tool.name || 'PDF Tool')}</image:title>
      <image:caption>${escapeXml(tool.description || '')}</image:caption>
    </image:image>` : ''}
  </url>`;
    }
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
















