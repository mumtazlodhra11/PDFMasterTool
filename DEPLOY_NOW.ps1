# PDFMasterTool Deployment Script
# Deploys 43 tools to GitHub Pages

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   DEPLOYING 43 PDF TOOLS TO GITHUB PAGES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Build project
Write-Host ""
Write-Host "[2/5] Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Add files to git
Write-Host ""
Write-Host "[3/5] Adding files to git..." -ForegroundColor Yellow
git add .

# Step 4: Commit changes
Write-Host ""
Write-Host "[4/5] Committing changes..." -ForegroundColor Yellow
git commit -m "🚀 Deploy 43 PDF tools - Better than competitors!"

# Step 5: Push to GitHub
Write-Host ""
Write-Host "[5/5] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git push failed!" -ForegroundColor Red
    Write-Host "Please check your GitHub credentials" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Success message
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT SUCCESSFUL! " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your website will be LIVE in 2-3 minutes at:" -ForegroundColor Cyan
Write-Host "https://mumtazlodhra11.github.io/PDFMasterTool" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 minutes for GitHub Pages to deploy" -ForegroundColor White
Write-Host "2. Go to: Settings -> Pages to enable GitHub Pages" -ForegroundColor White
Write-Host "3. Your site will be live!" -ForegroundColor White
Write-Host ""
Write-Host "To deploy Cloud Run backend:" -ForegroundColor Yellow
Write-Host "cd google-cloud-run" -ForegroundColor White
Write-Host "gcloud run deploy pdfmastertool --source . --region us-central1 --allow-unauthenticated" -ForegroundColor White
Write-Host ""
Write-Host "Total tools: 43 (38 working NOW, 5 coming soon)" -ForegroundColor Cyan
Write-Host "Cost: $0/month" -ForegroundColor Green
Write-Host "Better than: iLovePDF, SmallPDF, Sejda" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

