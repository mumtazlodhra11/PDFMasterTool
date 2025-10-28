# Complete Setup Guide for PDFMasterTool

This guide will walk you through setting up the entire PDFMasterTool platform from scratch.

---

## 📋 Prerequisites

### Required Software

1. **Node.js 20+** - [Download](https://nodejs.org/)
   ```bash
   node --version  # Should be v20.0.0 or higher
   ```

2. **npm 10+**
   ```bash
   npm --version  # Should be v10.0.0 or higher
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **AWS CLI** (for deployment)
   ```bash
   aws --version
   ```

5. **Terraform** (for infrastructure)
   ```bash
   terraform --version
   ```

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your keys

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:4321
```

---

## 🔑 API Keys Setup

### 1. OpenAI API Key (for AI features)

1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Create new API key
3. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   ```

### 2. AWS Credentials (for cloud features)

**Option A: AWS Console**

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create new user with programmatic access
3. Attach policies:
   - `AmazonS3FullAccess`
   - `AWSLambdaFullAccess`
   - `CloudFrontFullAccess`
4. Download credentials
5. Add to `.env`:
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   ```

**Option B: AWS CLI**

```bash
aws configure
# Enter your AWS Access Key ID, Secret Key, Region
```

---

## 🏗️ AWS Infrastructure Setup

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://pdfmastertool-uploads --region us-east-1
```

### Step 2: Configure Lifecycle Policy

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket pdfmastertool-uploads \
  --lifecycle-configuration file://aws/s3-lifecycle.json
```

Create `aws/s3-lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "delete-after-1-hour",
      "Status": "Enabled",
      "Expiration": {
        "Days": 1
      },
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 1
      }
    }
  ]
}
```

### Step 3: Deploy Lambda Function

```bash
cd aws/lambda

# Install dependencies
npm install

# Create deployment package
zip -r converter.zip .

# Create Lambda function
aws lambda create-function \
  --function-name pdf-converter \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler converter.handler \
  --zip-file fileb://converter.zip \
  --timeout 300 \
  --memory-size 3008
```

### Step 4: Set up CloudFront

Use Terraform for automatic setup:

```bash
cd aws/terraform
terraform init
terraform plan
terraform apply
```

Or use AWS Console:
1. Go to CloudFront
2. Create distribution
3. Set origin to your S3 bucket
4. Enable compression
5. Add custom domain (optional)

---

## 🎨 Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

This starts:
- Astro dev server on `http://localhost:4321`
- Hot reload enabled
- TypeScript checking

### 2. Add New Tool

1. Create new file in `src/pages/tools/`:
   ```bash
   touch src/pages/tools/new-tool.astro
   ```

2. Add tool to `src/config/tools.json`:
   ```json
   {
     "id": "new-tool",
     "name": "New Tool",
     "category": "convert-to-pdf",
     "icon": "📄",
     "description": "Description",
     "features": ["Feature 1", "Feature 2"],
     "inputFormats": [".pdf"],
     "outputFormat": ".pdf",
     "maxFileSize": 50,
     "aiEnhanced": false
   }
   ```

3. Implement tool using `ToolTemplate`:
   ```astro
   ---
   import { ToolTemplate } from '@/components/ToolTemplate';
   ---
   
   <ToolTemplate
     client:load
     toolName="New Tool"
     toolDescription="Tool description"
     toolIcon="📄"
     acceptedFormats={['.pdf']}
     onProcess={async (files) => {
       // Your logic here
       return blob;
     }}
   />
   ```

### 3. Test Tool

```bash
npm run dev
# Navigate to http://localhost:4321/tools/new-tool
```

---

## 📦 Building for Production

### 1. Build

```bash
npm run build
```

This creates `dist/` folder with optimized static files.

### 2. Preview Build

```bash
npm run preview
```

### 3. Deploy

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Type Checking

```bash
npm run check
```

### Linting

```bash
npm run lint
```

---

## 🎯 Configuration Files

### `astro.config.mjs`

```javascript
export default defineConfig({
  site: 'https://pdfmastertool.com',
  integrations: [react(), tailwind(), sitemap()],
  output: 'static',
  // ... more config
});
```

### `tailwind.config.mjs`

```javascript
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
      },
    },
  },
};
```

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🔧 Troubleshooting

### Issue: Module not found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build fails

```bash
# Check TypeScript errors
npm run check

# Fix linting issues
npm run lint -- --fix
```

### Issue: AWS Lambda timeout

Increase timeout in Lambda configuration:
```bash
aws lambda update-function-configuration \
  --function-name pdf-converter \
  --timeout 300
```

### Issue: CORS errors with S3

Update bucket CORS configuration:
```bash
aws s3api put-bucket-cors \
  --bucket pdfmastertool-uploads \
  --cors-configuration file://aws/cors.json
```

---

## 📊 Performance Optimization

### 1. Enable Compression

In `astro.config.mjs`:
```javascript
vite: {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
}
```

### 2. Image Optimization

```bash
npm install -D @astrojs/image
```

### 3. Code Splitting

Astro automatically splits code. For manual control:
```javascript
const Component = lazy(() => import('./Component'));
```

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to Git
   - Use different keys for dev/prod

2. **API Keys**
   - Rotate keys regularly
   - Use IAM roles for AWS

3. **CORS**
   - Restrict to your domain only

4. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
   ```

---

## 📈 Monitoring Setup

### Google Analytics

1. Create GA4 property
2. Get measurement ID
3. Add to `.env`:
   ```env
   PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Sentry

```bash
npm install @sentry/astro
```

Add to `astro.config.mjs`:
```javascript
import sentry from "@sentry/astro";

export default defineConfig({
  integrations: [
    sentry({
      dsn: process.env.PUBLIC_SENTRY_DSN,
    }),
  ],
});
```

---

## 🎓 Next Steps

1. **Complete remaining tools** (23 tools to implement)
2. **Set up CI/CD** (GitHub Actions)
3. **Add tests** for each tool
4. **Performance optimization** (achieve 95+ Lighthouse)
5. **Custom domain** setup
6. **SSL certificate** configuration

---

## 📚 Resources

- [Astro Documentation](https://docs.astro.build)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [pdf-lib Guide](https://pdf-lib.js.org)
- [AWS Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)

---

**Need help? Email support@pdfmastertool.com**












