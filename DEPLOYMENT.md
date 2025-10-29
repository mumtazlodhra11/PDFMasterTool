# PDFMasterTool - Complete Deployment Guide

This guide covers deploying PDFMasterTool to production with maximum performance and reliability.

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Pros**: Zero config, auto SSL, global CDN, edge functions
**Cost**: Free for hobby, $20/month for pro

#### Steps:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables
vercel env add OPENAI_API_KEY
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add PUBLIC_GA_MEASUREMENT_ID
```

#### Vercel Configuration (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "rewrites": [
    {
      "source": "/tools/:path*",
      "destination": "/tools/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

### Option 2: Netlify

**Pros**: Great DX, form handling, split testing
**Cost**: Free for hobby, $19/month for pro

#### Steps:

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize
netlify init

# 4. Deploy
netlify deploy --prod
```

#### Netlify Configuration (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

### Option 3: AWS S3 + CloudFront (Full Control)

**Pros**: Complete control, cheapest for high traffic
**Cost**: ~$5-10/month

#### Steps:

```bash
# 1. Build
npm run build

# 2. Create S3 bucket
aws s3 mb s3://pdfmastertool-prod

# 3. Configure as static website
aws s3 website s3://pdfmastertool-prod \
  --index-document index.html \
  --error-document 404.html

# 4. Upload files
aws s3 sync dist/ s3://pdfmastertool-prod \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "sitemap.xml"

# 5. Upload HTML with no-cache
aws s3 sync dist/ s3://pdfmastertool-prod \
  --delete \
  --cache-control "no-cache" \
  --exclude "*" \
  --include "*.html" \
  --include "sitemap.xml"

# 6. Make public
aws s3api put-bucket-policy \
  --bucket pdfmastertool-prod \
  --policy file://s3-policy.json

# 7. Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name pdfmastertool-prod.s3.amazonaws.com \
  --default-root-object index.html
```

---

### Option 4: Cloudflare Pages

**Pros**: Free unlimited bandwidth, excellent CDN
**Cost**: Free

#### Steps:

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set build output: `dist`
5. Deploy

---

## 🔧 Environment Variables Setup

### Production Environment

```env
# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-proj-your-key

# AWS (Required for heavy processing)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=pdfmastertool-uploads
AWS_LAMBDA_FUNCTION_NAME=pdf-converter
AWS_CLOUDFRONT_DOMAIN=d111111abcdef8.cloudfront.net

# Site Configuration
PUBLIC_SITE_URL=https://pdfmastertool.com
PUBLIC_MAX_FILE_SIZE=157286400
PUBLIC_API_ENDPOINT=https://api.pdfmastertool.com

# Analytics (Optional)
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking (Optional)
PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Setting Variables in Vercel

```bash
vercel env add OPENAI_API_KEY production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_S3_BUCKET production
vercel env add PUBLIC_GA_MEASUREMENT_ID production
```

### Setting Variables in Netlify

```bash
netlify env:set OPENAI_API_KEY "your-key"
netlify env:set AWS_ACCESS_KEY_ID "your-key"
netlify env:set AWS_SECRET_ACCESS_KEY "your-secret"
```

---

## 🔐 SSL/TLS Configuration

### Vercel/Netlify (Automatic)
SSL certificates are automatically provisioned and renewed.

### AWS CloudFront (Manual)

1. **Request Certificate** (AWS Certificate Manager):
   ```bash
   aws acm request-certificate \
     --domain-name pdfmastertool.com \
     --subject-alternative-names www.pdfmastertool.com \
     --validation-method DNS
   ```

2. **Validate Domain**:
   - Add DNS records as instructed by ACM
   - Wait for validation (5-30 minutes)

3. **Attach to CloudFront**:
   ```bash
   aws cloudfront update-distribution \
     --id YOUR_DIST_ID \
     --viewer-certificate \
     "ACMCertificateArn=arn:aws:acm:...,SSLSupportMethod=sni-only"
   ```

---

## 🌐 Custom Domain Setup

### Vercel

```bash
# Add domain
vercel domains add pdfmastertool.com

# Follow instructions to update DNS:
# A Record: 76.76.21.21
# AAAA Record: 2606:4700:3033::ac43:bd91
```

### Netlify

```bash
# Add domain
netlify domains:add pdfmastertool.com

# Update DNS:
# CNAME: pdfmastertool.netlify.app
```

### CloudFlare

1. Add site to Cloudflare
2. Update nameservers
3. Create CNAME pointing to your deployment

---

## 📊 Performance Optimization

### 1. Enable Compression

Already configured in Astro! But verify:

```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    build: {
      minify: 'terser',
      cssMinify: true,
    },
  },
});
```

### 2. Image Optimization

```bash
npm install -D @astrojs/image sharp
```

```javascript
// astro.config.mjs
import image from '@astrojs/image';

export default defineConfig({
  integrations: [image()],
});
```

### 3. Preload Critical Assets

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

### 4. Service Worker (PWA)

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('pdfmastertool-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles/global.css',
        '/manifest.json',
      ]);
    })
  );
});
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📈 Monitoring & Analytics

### 1. Google Analytics Setup

Already integrated! Just add your measurement ID:

```env
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Sentry Error Tracking

```bash
npm install @sentry/astro @sentry/browser
```

```javascript
// astro.config.mjs
import sentry from '@sentry/astro';

export default defineConfig({
  integrations: [
    sentry({
      dsn: process.env.PUBLIC_SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 1.0,
    }),
  ],
});
```

### 3. UptimeRobot

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Add new monitor:
   - Type: HTTP(S)
   - URL: https://pdfmastertool.com
   - Interval: 5 minutes
3. Set up alerts via email/SMS

### 4. LogRocket (User Session Recording)

```bash
npm install logrocket
```

```javascript
// src/layouts/BaseLayout.astro
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('your-app-id');
}
```

---

## 🔒 Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Content Security Policy set
- [ ] Rate limiting enabled
- [ ] API keys rotated regularly
- [ ] S3 bucket not publicly accessible
- [ ] Lambda function permissions minimal
- [ ] No sensitive data in logs
- [ ] Regular security audits

---

## 🧪 Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Build passes locally (`npm run build`)
- [ ] Type checking passes (`npm run check`)
- [ ] All tests pass (`npm test`)
- [ ] Lighthouse score 95+ (mobile & desktop)
- [ ] Works offline (PWA)
- [ ] All 30 tools tested
- [ ] Error handling works
- [ ] Analytics tracking working
- [ ] SEO meta tags correct
- [ ] Sitemap generated
- [ ] robots.txt configured
- [ ] Custom 404 page
- [ ] Legal pages (Privacy, Terms)

---

## 📱 Post-Deployment

### 1. Verify Deployment

```bash
# Check site is live
curl -I https://pdfmastertool.com

# Check SSL
openssl s_client -connect pdfmastertool.com:443 -servername pdfmastertool.com

# Test tool
curl https://pdfmastertool.com/tools/merge-pdf
```

### 2. Submit to Search Engines

```bash
# Google Search Console
https://search.google.com/search-console

# Bing Webmaster Tools
https://www.bing.com/webmasters

# Submit sitemap
https://pdfmastertool.com/sitemap.xml
```

### 3. Performance Testing

```bash
# Lighthouse
npx lighthouse https://pdfmastertool.com --view

# WebPageTest
https://www.webpagetest.org/

# GTmetrix
https://gtmetrix.com/
```

### 4. Set Up Monitoring Alerts

- Server errors (5xx)
- High response times (> 3s)
- Low uptime (< 99%)
- SSL expiration warnings
- Lambda errors
- S3 quota warnings

---

## 💰 Cost Optimization

### Vercel
- Free tier: 100GB bandwidth
- Pro tier: $20/month
- Bandwidth overage: $40/TB

### Netlify
- Free tier: 100GB bandwidth  
- Pro tier: $19/month
- Bandwidth overage: $55/TB

### AWS
- S3: $0.023/GB storage
- CloudFront: $0.085/GB (first 10TB)
- Lambda: $0.20 per 1M requests
- **Estimated**: $5-10/month for 10K users

### Optimization Tips

1. **Use CloudFront** for static assets
2. **Enable compression** (Gzip/Brotli)
3. **Cache aggressively** (1 year for assets)
4. **Use WebP images** instead of PNG/JPG
5. **Lazy load** components
6. **Tree-shake** unused code

---

## 🎯 Scaling Strategy

### Phase 1: 0-10K users/month
- Single Vercel/Netlify deployment
- Client-side processing only
- Free tier sufficient

### Phase 2: 10K-100K users/month
- Add AWS Lambda for heavy files
- Enable CloudFront CDN
- Implement rate limiting

### Phase 3: 100K-1M users/month
- Multi-region deployment
- Redis caching
- Load balancing
- Dedicated infrastructure

### Phase 4: 1M+ users/month
- Kubernetes cluster
- Microservices architecture
- Auto-scaling
- Global CDN

---

## 📞 Support & Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs
- Check uptime status
- Review analytics

**Weekly**:
- Update dependencies
- Review performance metrics
- Check SSL certificates

**Monthly**:
- Security audit
- Cost optimization review
- Feature usage analysis
- A/B testing results

---

## 🎓 Additional Resources

- [Astro Deployment](https://docs.astro.build/en/guides/deploy/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
- [Web Performance](https://web.dev/performance/)

---

**Ready to deploy? Let's go! 🚀**














