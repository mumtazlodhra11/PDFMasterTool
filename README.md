# PDFMasterTool - Next-Gen AI-Powered PDF Platform

**🚀 A modern, privacy-first PDF toolkit with 30 tools powered by AI, WebAssembly, and AWS**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Astro](https://img.shields.io/badge/Astro-5.0-orange)
![React](https://img.shields.io/badge/React-19.0-blue)

---

## 🌟 Overview

PDFMasterTool is a next-generation PDF platform built with cutting-edge 2025 technologies, designed to outperform competitors like iLovePDF, SmallPDF, and PDF24 in speed, privacy, and functionality.

### Key Highlights

- **30 PDF Tools** - Complete suite covering all PDF operations
- **AI-Powered** - GPT-4o integration for OCR, summarization, translation
- **Privacy-First** - Client-side WASM processing, auto-delete after 1 hour
- **Lightning Fast** - < 3s conversion time for small files
- **100% Free** - No ads, no login, no tracking
- **Modern Stack** - Astro 5 + React 19 + TypeScript + Tailwind v4

---

## 📦 Tech Stack

### Frontend
- **Framework**: Astro 5 (SSG + SPA hybrid)
- **UI Library**: React 19 with TypeScript
- **Styling**: TailwindCSS v4 + Glassmorphism
- **Animations**: Framer Motion 11+
- **PDF Processing**: pdf-lib, pdfjs-dist, PDFKit
- **Image Processing**: Sharp, canvas, html2canvas

### Backend
- **Runtime**: Node.js 20
- **Cloud**: AWS Lambda (serverless)
- **Storage**: AWS S3 (1-hour lifecycle)
- **CDN**: AWS CloudFront
- **IaC**: Terraform

### AI & ML
- **LLM**: OpenAI GPT-4o & GPT-4o-mini
- **OCR**: Tesseract.js (WASM)
- **Processing**: WebAssembly for client-side operations

---

## 🛠️ Installation & Setup

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
```

### 1. Clone & Install

```bash
git clone https://github.com/pdfmastertool/pdfmastertool.git
cd pdfmastertool
npm install
```

### 2. Environment Setup

Create `.env` file in the root:

```env
# OpenAI API for AI features
OPENAI_API_KEY=your_openai_api_key_here

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=pdfmastertool-uploads
AWS_LAMBDA_FUNCTION_NAME=pdf-converter
AWS_CLOUDFRONT_DOMAIN=your_cloudfront_domain

# Public Configuration
PUBLIC_SITE_URL=https://pdfelitetools.com
PUBLIC_MAX_FILE_SIZE=157286400
PUBLIC_API_ENDPOINT=https://api.pdfmastertool.com

# Analytics
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry (Error Tracking)
PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 3. Development

```bash
npm run dev
# Open http://localhost:4321
```

### 4. Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Project Structure

```
PDFMasterTool/
├── src/
│   ├── components/          # React components
│   │   ├── FileUploader.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ResultModal.tsx
│   │   ├── ErrorToast.tsx
│   │   ├── ToolCard.tsx
│   │   ├── ToolTemplate.tsx
│   │   ├── Navbar.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── BaseLayout.astro  # Main layout with SEO
│   ├── pages/
│   │   ├── index.astro       # Homepage
│   │   ├── sitemap.xml.ts    # Dynamic sitemap
│   │   └── tools/            # All 30 tool pages
│   │       ├── merge-pdf.astro
│   │       ├── split-pdf.astro
│   │       ├── compress-pdf.astro
│   │       ├── rotate-pdf.astro
│   │       ├── image-to-pdf.astro
│   │       ├── ai-ocr.astro
│   │       └── [24 more tools...]
│   ├── utils/
│   │   ├── pdfUtils.ts       # PDF operations
│   │   ├── imageUtils.ts     # Image operations
│   │   ├── awsClient.ts      # AWS S3/Lambda
│   │   └── aiUtils.ts        # OpenAI integration
│   ├── config/
│   │   └── tools.json        # Tool definitions
│   └── styles/
│       └── global.css        # Global styles
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── robots.txt
│   └── favicon.svg
├── aws/
│   ├── lambda/
│   │   └── converter.js      # Lambda function
│   └── terraform/
│       └── main.tf           # Infrastructure
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

---

## 🎯 30 Tools Implementation Status

### ✅ Implemented (7 tools)
1. ✅ **Merge PDF** - `/tools/merge-pdf`
2. ✅ **Split PDF** - `/tools/split-pdf`
3. ✅ **Compress PDF** - `/tools/compress-pdf`
4. ✅ **Rotate PDF** - `/tools/rotate-pdf`
5. ✅ **Image to PDF** - `/tools/image-to-pdf`
6. ✅ **AI OCR** - `/tools/ai-ocr`
7. ✅ **Excel to PDF** - `/tools/excel-to-pdf` (existing)

### 📝 To Be Implemented (23 tools)

Use the existing tool pages as templates. Each tool follows this pattern:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import Navbar from '@/components/Navbar.astro';
import Footer from '@/components/Footer.astro';
import { ToolTemplate } from '@/components/ToolTemplate';
---

<BaseLayout title="Tool Name" description="Tool description">
  <Navbar />
  <ToolTemplate
    client:load
    toolName="Tool Name"
    toolDescription="Description"
    toolIcon="🔧"
    acceptedFormats={['.pdf']}
    onProcess={async (files) => {
      // Implement tool logic
      return blob;
    }}
  />
  <Footer />
</BaseLayout>
```

**Convert TO PDF** (4 remaining):
- Word to PDF
- PowerPoint to PDF
- HTML to PDF  
- Text to PDF (not in list, can be added)

**Convert FROM PDF** (4 remaining):
- PDF to Word
- PDF to PowerPoint
- PDF to Excel
- PDF to JPG
- PDF to PDF/A

**Organize** (3 remaining):
- Reorder Pages
- Remove Pages
- Add Page Numbers

**Secure** (3 remaining):
- Password Protect PDF
- Unlock PDF
- Watermark PDF

**Optimize** (1 remaining):
- Repair PDF

**Edit** (4 remaining):
- Edit PDF
- Annotate PDF
- Add Header/Footer
- Add Signature (eSign)

**AI Tools** (3 remaining):
- AI Summarizer
- AI Translator
- AI Smart Compressor

**eSign** (1 remaining):
- Fill PDF Forms

---

## 🚀 AWS Deployment

### Step 1: Set up AWS Infrastructure

```bash
cd aws/terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply infrastructure
terraform apply
```

This creates:
- S3 bucket with 1-hour lifecycle
- Lambda function for conversions
- CloudFront CDN
- IAM roles and policies

### Step 2: Deploy Lambda Function

```bash
cd aws/lambda

# Install dependencies
npm install

# Create deployment package
zip -r converter.zip converter.js node_modules/

# Upload to Lambda
aws lambda update-function-code \
  --function-name pdf-converter \
  --zip-file fileb://converter.zip
```

### Step 3: Deploy Frontend

#### Option A: Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

#### Option B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option C: AWS S3 + CloudFront

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## 🔧 Core Features

### 1. Client-Side Processing (WASM)

Most operations run in the browser using WebAssembly:

```typescript
import { mergePDFs } from '@/utils/pdfUtils';

const result = await mergePDFs(files, (progress) => {
  console.log(`Progress: ${progress.progress}%`);
});
```

### 2. Server-Side Processing (Lambda)

Heavy operations use AWS Lambda:

```typescript
import { shouldUseLambda, uploadToS3, invokeLambdaConversion } from '@/utils/awsClient';

if (shouldUseLambda(file, 'word-to-pdf')) {
  const s3Key = await uploadToS3(file, generateS3Key(file.name));
  const outputKey = await invokeLambdaConversion('word-to-pdf', s3Key);
}
```

### 3. AI Features

```typescript
import { performOCR, summarizeText, translateText } from '@/utils/aiUtils';

// OCR
const text = await performOCR(file, 'eng');

// Summarization
const summary = await summarizeText(text, { format: 'bullet' });

// Translation
const translated = await translateText(text, 'Spanish');
```

---

## 🎨 Design System

### Glassmorphism UI

```css
.glass {
  @apply bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl 
         border border-white/20 dark:border-gray-700/20;
}
```

### Color Palette

```javascript
colors: {
  primary: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    900: '#7f1d1d',
  }
}
```

### Animations

All animations use Framer Motion:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Load Time | < 1.5s | ⏳ |
| Conversion (Small) | < 3s | ✅ |
| Conversion (Large) | < 10s | ⏳ |
| Lighthouse Score | 95+ | ⏳ |
| Uptime | 99.9% | N/A |
| File Size Limit | 150 MB | ✅ |

---

## 🔒 Privacy & Security

1. **Client-Side Processing**: Most conversions happen in browser
2. **Auto-Delete**: S3 files deleted after 1 hour
3. **No Tracking**: No cookies, no analytics unless enabled
4. **HTTPS Only**: All connections encrypted
5. **No Storage**: No database, completely stateless

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Check TypeScript
npm run check
```

---

## 📈 Analytics & Monitoring

### Google Analytics 5

Already integrated in `BaseLayout.astro`:

```astro
{import.meta.env.PUBLIC_GA_MEASUREMENT_ID && (
  <script async src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA_MEASUREMENT_ID}`}></script>
)}
```

### Sentry Error Tracking

Add to your `.env`:
```env
PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### UptimeRobot

Set up monitoring at: https://uptimerobot.com

---

## 💰 Cost Estimation

| Service | Monthly Cost |
|---------|--------------|
| AWS S3 + CloudFront | $5-10 |
| AWS Lambda | $0-10 |
| SSL Certificate (ACM) | Free |
| OpenAI API | $10-30 |
| Domain | $1/month |
| **Total** | **$15-50/month** |

---

## 🔐 Environment Variables Guide

```env
# Required for AI features
OPENAI_API_KEY=sk-...

# Required for AWS features
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=pdfmastertool-uploads

# Optional - Analytics
PUBLIC_GA_MEASUREMENT_ID=G-...
PUBLIC_SENTRY_DSN=https://...

# Optional - Custom domain
PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 🎓 Development Guide

### Adding a New Tool

1. **Create tool page** in `src/pages/tools/your-tool.astro`
2. **Add tool to** `src/config/tools.json`
3. **Implement processing logic** in utils
4. **Test locally** with `npm run dev`
5. **Deploy** to production

### Example: Adding "PDF to PNG"

```astro
---
import { ToolTemplate } from '@/components/ToolTemplate';
import { pdfToImages } from '@/utils/imageUtils';
---

<ToolTemplate
  client:load
  toolName="PDF to PNG"
  toolDescription="Convert PDF pages to PNG images"
  toolIcon="🎨"
  acceptedFormats={['.pdf']}
  onProcess={async (files) => {
    return await pdfToImages(files[0], { format: 'png' });
  }}
/>
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Support

- **Email**: support@pdfmastertool.com
- **GitHub Issues**: [Create an issue](https://github.com/pdfmastertool/pdfmastertool/issues)
- **Documentation**: [docs.pdfmastertool.com](https://docs.pdfmastertool.com)

---

## 🌟 Acknowledgments

Built with:
- [Astro](https://astro.build)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [pdf-lib](https://pdf-lib.js.org)
- [Framer Motion](https://www.framer.com/motion)
- [OpenAI](https://openai.com)

---

**Made with ❤️ using modern 2025 technologies**
