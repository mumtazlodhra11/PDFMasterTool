#!/bin/bash

# PDFMasterTool Deployment Script
# This script prepares the project for deployment to various hosting platforms

echo "🚀 PDFMasterTool Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_info "Node.js version: $(node --version)"
print_info "npm version: $(npm --version)"

# Install dependencies
print_info "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create build directory
print_info "Creating build directory..."
mkdir -p build
if [ $? -eq 0 ]; then
    print_status "Build directory created"
else
    print_error "Failed to create build directory"
    exit 1
fi

# Copy files to build directory
print_info "Copying files to build directory..."
cp -r index.html tools/ assets/ public/ build/
if [ $? -eq 0 ]; then
    print_status "Files copied to build directory"
else
    print_error "Failed to copy files"
    exit 1
fi

# Create deployment configurations
print_info "Creating deployment configurations..."

# Vercel configuration
cat > build/vercel.json << EOF
{
  "version": 2,
  "name": "pdfmastertool",
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
EOF

# Netlify configuration
cat > build/netlify.toml << EOF
[build]
  publish = "."
  command = "echo 'Static site ready'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
EOF

# GitHub Pages configuration
cat > build/.nojekyll << EOF
# This file tells GitHub Pages not to process the site with Jekyll
EOF

# Create CNAME file for custom domain
cat > build/CNAME << EOF
pdfmastertool.com
EOF

print_status "Deployment configurations created"

# Create deployment instructions
cat > build/DEPLOYMENT.md << EOF
# PDFMasterTool Deployment Instructions

## Quick Deploy Options

### 1. Vercel (Recommended)
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

### 2. Netlify
1. Drag and drop the build folder to netlify.com
2. Or connect your GitHub repository
3. Set build command: \`echo 'Static site ready'\`
4. Set publish directory: \`.\`

### 3. GitHub Pages
1. Push the build folder contents to your repository
2. Enable GitHub Pages in repository settings
3. Select source: Deploy from a branch
4. Select branch: main

### 4. AWS S3
1. Create an S3 bucket
2. Enable static website hosting
3. Upload all files from build folder
4. Set bucket policy for public read access

### 5. Cloudflare Pages
1. Connect your GitHub repository
2. Set build command: \`echo 'Static site ready'\`
3. Set build output directory: \`.\`

## Environment Variables (Optional)
- GOOGLE_ANALYTICS_ID: For analytics tracking
- APP_NAME: Custom application name
- APP_URL: Custom application URL

## Custom Domain
1. Update CNAME file with your domain
2. Configure DNS settings
3. Enable HTTPS (automatic with most platforms)

## Performance Optimization
- Enable gzip compression
- Set up CDN
- Configure caching headers
- Enable HTTP/2

## Security
- Enable HTTPS
- Set security headers
- Configure CSP (Content Security Policy)
- Regular security updates
EOF

print_status "Deployment instructions created"

# Create package.json for build
cat > build/package.json << EOF
{
  "name": "pdfmastertool-build",
  "version": "1.0.0",
  "description": "PDFMasterTool - Professional PDF Tools Suite",
  "main": "index.html",
  "scripts": {
    "start": "npx http-server -p 3000 -c-1 --cors",
    "dev": "npx http-server -p 3000 -c-1 --cors -o"
  },
  "keywords": ["pdf", "tools", "converter", "editor"],
  "author": "PDFMasterTool",
  "license": "MIT"
}
EOF

# Create .gitignore for build
cat > build/.gitignore << EOF
node_modules/
.DS_Store
*.log
.env
.env.local
.env.production
EOF

# Test the build
print_info "Testing the build..."
cd build
if [ -f "index.html" ] && [ -d "tools" ]; then
    print_status "Build test passed"
else
    print_error "Build test failed"
    exit 1
fi

# Count files
FILE_COUNT=$(find . -type f | wc -l)
print_info "Total files in build: $FILE_COUNT"

# Calculate build size
BUILD_SIZE=$(du -sh . | cut -f1)
print_info "Build size: $BUILD_SIZE"

cd ..

# Create deployment summary
cat > DEPLOYMENT_SUMMARY.md << EOF
# PDFMasterTool Deployment Summary

## Build Information
- **Build Date**: $(date)
- **Node.js Version**: $(node --version)
- **npm Version**: $(npm --version)
- **Total Files**: $FILE_COUNT
- **Build Size**: $BUILD_SIZE

## Files Included
- ✅ index.html (Main application)
- ✅ tools/ (18 PDF tools)
- ✅ assets/ (CSS, JS, images)
- ✅ public/ (Static assets)
- ✅ vercel.json (Vercel configuration)
- ✅ netlify.toml (Netlify configuration)
- ✅ CNAME (Custom domain)
- ✅ .nojekyll (GitHub Pages)
- ✅ DEPLOYMENT.md (Deployment instructions)

## Ready for Deployment
The build folder contains everything needed for deployment to:
- ✅ Vercel
- ✅ Netlify
- ✅ GitHub Pages
- ✅ AWS S3
- ✅ Cloudflare Pages
- ✅ Any static hosting service

## Next Steps
1. Choose your deployment platform
2. Follow the instructions in build/DEPLOYMENT.md
3. Configure your custom domain (optional)
4. Set up analytics (optional)
5. Test your deployment

## Support
- GitHub: https://github.com/pdfmastertool/pdfmastertool
- Email: support@pdfmastertool.com
- Documentation: https://pdfmastertool.com/docs
EOF

print_status "Deployment summary created"

# Final status
echo ""
echo "🎉 PDFMasterTool Build Complete!"
echo "================================"
print_status "Build directory: ./build/"
print_status "Total files: $FILE_COUNT"
print_status "Build size: $BUILD_SIZE"
print_status "Ready for deployment to any static hosting service"
echo ""
print_info "Next steps:"
echo "1. Review DEPLOYMENT_SUMMARY.md"
echo "2. Choose your deployment platform"
echo "3. Follow instructions in build/DEPLOYMENT.md"
echo "4. Deploy and enjoy your PDF tools!"
echo ""
print_warning "Remember to test your deployment before going live!"
echo ""
