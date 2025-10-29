@echo off
echo.
echo ============================================
echo    DEPLOYING 43 PDF TOOLS TO GITHUB PAGES
echo ============================================
echo.

echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Building project...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [3/5] Adding files to git...
git add .

echo.
echo [4/5] Committing changes...
git commit -m "Deploy 43 PDF tools - Better than competitors!"

echo.
echo [5/5] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Git push failed!
    echo Please check your GitHub credentials
    pause
    exit /b 1
)

echo.
echo ============================================
echo    DEPLOYMENT SUCCESSFUL! 
echo ============================================
echo.
echo Your website will be LIVE in 2-3 minutes at:
echo https://your-username.github.io/PDFMasterTool
echo.
echo Next steps:
echo 1. Wait 2-3 minutes for GitHub Pages to deploy
echo 2. Go to: Settings -^> Pages to enable GitHub Pages
echo 3. Your site will be live!
echo.
echo To deploy Cloud Run backend:
echo cd google-cloud-run
echo gcloud run deploy pdfmastertool --source . --region us-central1 --allow-unauthenticated
echo.
pause

