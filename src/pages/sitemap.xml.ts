import type { APIRoute } from 'astro';
import toolsData from '@/config/tools.json';

const { tools } = toolsData;

export const GET: APIRoute = async () => {
  const siteUrl = 'https://pdfmastertool.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: '/pricing', changefreq: 'weekly', priority: '0.8' },
    { url: '/about', changefreq: 'monthly', priority: '0.7' },
    { url: '/contact', changefreq: 'monthly', priority: '0.6' },
    { url: '/privacy', changefreq: 'monthly', priority: '0.5' },
    { url: '/terms', changefreq: 'monthly', priority: '0.5' },
    { url: '/security', changefreq: 'monthly', priority: '0.6' },
    { url: '/faq', changefreq: 'weekly', priority: '0.7' },
  ];

  const toolPages = tools.map((tool: any) => ({
    url: `/tools/${tool.id}`,
    changefreq: 'weekly',
    priority: tool.aiEnhanced ? '0.9' : '0.8',
  }));

  const allPages = [...staticPages, ...toolPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};














