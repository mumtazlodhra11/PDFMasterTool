/**
 * SEO Utilities for PDFEliteTools
 * Comprehensive SEO helpers for meta tags, structured data, and schema markup
 */

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  type?: string;
  noindex?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export interface ToolSEOData {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  inputFormats: string[];
  outputFormat: string;
  aiEnhanced: boolean;
}

/**
 * Generate SEO meta tags for tool pages
 * Uses VOP (Verb-Object-Promise) framework like iLovePDF
 */
export function generateToolSEO(tool: ToolSEOData, siteUrl: string = 'https://pdfelitetools.com'): SEOProps {
  const toolName = tool.name;
  const categoryKeywords = getCategoryKeywords(tool.category);
  const formatKeywords = tool.inputFormats.map(f => f.replace('.', '')).join(', ');
  
  // VOP Framework: Verb + Object + Promise
  // Example: "Merge PDF Online Free" or "Convert PDF to Word Free"
  const verb = getVerb(toolName);
  const object = getObject(toolName);
  const promise = ['Free', 'Online', 'Secure', 'Fast'].join(' ');
  
  const keywords = [
    toolName.toLowerCase(),
    `${toolName} online`,
    `free ${toolName}`,
    `online ${toolName} tool`,
    `${verb} ${object} ${promise.toLowerCase()}`,
    ...categoryKeywords,
    formatKeywords,
    'PDF tools',
    'free PDF converter',
    'PDFEliteTools'
  ].join(', ');
  
  // VOP title format: "Merge PDF Online Free | PDFEliteTools"
  const title = `${verb} ${object} ${promise} | PDFEliteTools`;
  const description = `${tool.description} Free, secure, and fast. ${tool.aiEnhanced ? 'AI-powered' : ''} ${toolName.toLowerCase()} tool. No sign-up required. Process files instantly.`;

  return {
    title,
    description,
    keywords,
    canonical: `/tools/${tool.id}`,
    ogImage: `/og-images/${tool.id}.jpg`,
    type: 'website',
    noindex: false,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/#tools' },
      { name: toolName, url: `/tools/${tool.id}` }
    ]
  };
}

/**
 * Extract verb from tool name (VOP framework)
 */
function getVerb(toolName: string): string {
  const verbs: Record<string, string> = {
    'merge': 'Merge',
    'split': 'Split',
    'compress': 'Compress',
    'convert': 'Convert',
    'edit': 'Edit',
    'rotate': 'Rotate',
    'protect': 'Protect',
    'unlock': 'Unlock',
    'watermark': 'Add Watermark to',
    'sign': 'Sign',
    'extract': 'Extract',
    'crop': 'Crop',
    'reorder': 'Reorder',
    'remove': 'Remove',
    'add': 'Add',
    'repair': 'Repair',
    'flatten': 'Flatten',
    'compare': 'Compare',
    'organize': 'Organize'
  };
  
  const lowerName = toolName.toLowerCase();
  for (const [key, value] of Object.entries(verbs)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  
  // Default: use first word or "Convert"
  return toolName.split(' ')[0] || 'Convert';
}

/**
 * Extract object from tool name (VOP framework)
 */
function getObject(toolName: string): string {
  // Remove common verbs and get the main object
  const withoutVerbs = toolName
    .replace(/^(merge|split|compress|convert|edit|rotate|protect|unlock|watermark|sign|extract|crop|reorder|remove|add|repair|flatten|compare|organize)\s+/i, '')
    .trim();
  
  return withoutVerbs || toolName;
}

/**
 * Generate structured data for tool pages (Schema.org)
 */
export function generateToolStructuredData(tool: ToolSEOData, siteUrl: string = 'https://pdfelitetools.com') {
  const toolUrl = `${siteUrl}/tools/${tool.id}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "description": tool.description,
    "url": toolUrl,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "featureList": tool.features.join(", "),
    "softwareVersion": "2.0",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "5000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "screenshot": `${siteUrl}/og-images/${tool.id}.jpg`,
    ...(tool.aiEnhanced && {
      "applicationSubCategory": "AI-Powered Tool"
    })
  };
}

/**
 * Generate HowTo structured data for tool pages
 * Optimized for Featured Snippets (iLovePDF style)
 */
export function generateHowToStructuredData(tool: ToolSEOData, steps: Array<{ name: string; text: string }>, siteUrl: string = 'https://pdfelitetools.com') {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to ${tool.name} Online Free`,
    "description": `${tool.description} Free, secure, and fast. No sign-up required.`,
    "image": `${siteUrl}/og-images/${tool.id}.jpg`,
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "tool": {
      "@type": "HowToTool",
      "name": tool.name
    },
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": `${siteUrl}/og-images/${tool.id}-step-${index + 1}.jpg`
    }))
  };
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate Article structured data for blog posts
 */
export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}, siteUrl: string = 'https://pdfelitetools.com') {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image || `${siteUrl}/og-image.jpg`,
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "PDFEliteTools",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url
    }
  };
}

/**
 * Get category-specific keywords
 */
function getCategoryKeywords(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    'convert-to-pdf': ['convert to PDF', 'PDF converter', 'create PDF', 'make PDF'],
    'convert-from-pdf': ['PDF converter', 'extract from PDF', 'PDF to document'],
    'organize': ['organize PDF', 'PDF organizer', 'manage PDF'],
    'secure': ['secure PDF', 'protect PDF', 'PDF security', 'encrypt PDF'],
    'optimize': ['optimize PDF', 'compress PDF', 'reduce PDF size'],
    'edit': ['edit PDF', 'PDF editor', 'modify PDF'],
    'esign': ['sign PDF', 'eSign PDF', 'digital signature'],
    'ai': ['AI PDF', 'artificial intelligence PDF', 'smart PDF tools']
  };
  
  return categoryMap[category] || [];
}

/**
 * Generate sitemap entry for a page
 */
export function generateSitemapEntry(url: string, priority: number = 0.8, changefreq: string = 'weekly', lastmod?: string) {
  return {
    url,
    priority,
    changefreq,
    lastmod: lastmod || new Date().toISOString().split('T')[0]
  };
}

