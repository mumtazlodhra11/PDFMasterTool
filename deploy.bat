@echo off
REM PDFMasterTool Deployment Script for Windows
REM This script prepares the project for deployment to various hosting platforms

echo.
echo 🚀 PDFMasterTool Deployment Script
echo ==================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ℹ️  Node.js version: 
node --version
echo ℹ️  npm version: 
npm --version
echo.

REM Install dependencies
echo ℹ️  Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Create build directory
echo ℹ️  Creating build directory...
if not exist "build" mkdir build
if %errorlevel% neq 0 (
    echo ❌ Failed to create build directory
    pause
    exit /b 1
)
echo ✅ Build directory created
echo.

REM Copy files to build directory
echo ℹ️  Copying files to build directory...
xcopy /E /I /Y index.html build\
xcopy /E /I /Y tools build\tools\
xcopy /E /I /Y assets build\assets\
xcopy /E /I /Y public build\public\
if %errorlevel% neq 0 (
    echo ❌ Failed to copy files
    pause
    exit /b 1
)
echo ✅ Files copied to build directory
echo.

REM Create deployment configurations
echo ℹ️  Creating deployment configurations...

REM Vercel configuration
(
echo {
echo   "version": 2,
echo   "name": "pdfmastertool",
echo   "builds": [
echo     {
echo       "src": "**/*",
echo       "use": "@vercel/static"
echo     }
echo   ],
echo   "routes": [
echo     {
echo       "src": "/(.*)",
echo       "dest": "/$1"
echo     }
echo   ]
echo }
) > build\vercel.json

REM Netlify configuration
(
echo [build]
echo   publish = "."
echo   command = "echo 'Static site ready'"
echo.
echo [[redirects]]
echo   from = "/*"
echo   to = "/index.html"
echo   status = 200
echo.
echo [build.environment]
echo   NODE_VERSION = "18"
) > build\netlify.toml

REM GitHub Pages configuration
echo. > build\.nojekyll

REM Create CNAME file for custom domain
echo pdfmastertool.com > build\CNAME

echo ✅ Deployment configurations created
echo.

REM Create deployment instructions
(
echo # PDFMasterTool Deployment Instructions
echo.
echo ## Quick Deploy Options
echo.
echo ### 1. Vercel ^(Recommended^)
echo ```bash
echo # Install Vercel CLI
echo npm i -g vercel
echo.
echo # Deploy
echo vercel --prod
echo ```
echo.
echo ### 2. Netlify
echo 1. Drag and drop the build folder to netlify.com
echo 2. Or connect your GitHub repository
echo 3. Set build command: `echo 'Static site ready'`
echo 4. Set publish directory: `.\`
echo.
echo ### 3. GitHub Pages
echo 1. Push the build folder contents to your repository
echo 2. Enable GitHub Pages in repository settings
echo 3. Select source: Deploy from a branch
echo 4. Select branch: main
echo.
echo ### 4. AWS S3
echo 1. Create an S3 bucket
echo 2. Enable static website hosting
echo 3. Upload all files from build folder
echo 4. Set bucket policy for public read access
echo.
echo ### 5. Cloudflare Pages
echo 1. Connect your GitHub repository
echo 2. Set build command: `echo 'Static site ready'`
echo 3. Set build output directory: `.\`
echo.
echo ## Environment Variables ^(Optional^)
echo - GOOGLE_ANALYTICS_ID: For analytics tracking
echo - APP_NAME: Custom application name
echo - APP_URL: Custom application URL
echo.
echo ## Custom Domain
echo 1. Update CNAME file with your domain
echo 2. Configure DNS settings
echo 3. Enable HTTPS ^(automatic with most platforms^)
echo.
echo ## Performance Optimization
echo - Enable gzip compression
echo - Set up CDN
echo - Configure caching headers
echo - Enable HTTP/2
echo.
echo ## Security
echo - Enable HTTPS
echo - Set security headers
echo - Configure CSP ^(Content Security Policy^)
echo - Regular security updates
) > build\DEPLOYMENT.md

echo ✅ Deployment instructions created
echo.

REM Create package.json for build
(
echo {
echo   "name": "pdfmastertool-build",
echo   "version": "1.0.0",
echo   "description": "PDFMasterTool - Professional PDF Tools Suite",
echo   "main": "index.html",
echo   "scripts": {
echo     "start": "npx http-server -p 3000 -c-1 --cors",
echo     "dev": "npx http-server -p 3000 -c-1 --cors -o"
echo   },
echo   "keywords": ["pdf", "tools", "converter", "editor"],
echo   "author": "PDFMasterTool",
echo   "license": "MIT"
echo }
) > build\package.json

REM Create .gitignore for build
(
echo node_modules/
echo .DS_Store
echo *.log
echo .env
echo .env.local
echo .env.production
) > build\.gitignore

REM Test the build
echo ℹ️  Testing the build...
cd build
if exist "index.html" (
    if exist "tools" (
        echo ✅ Build test passed
    ) else (
        echo ❌ Build test failed - tools directory missing
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ❌ Build test failed - index.html missing
    cd ..
    pause
    exit /b 1
)

REM Count files
for /f %%i in ('dir /s /b /a-d ^| find /c /v ""') do set FILE_COUNT=%%i
echo ℹ️  Total files in build: %FILE_COUNT%

cd ..

REM Create deployment summary
(
echo # PDFMasterTool Deployment Summary
echo.
echo ## Build Information
echo - **Build Date**: %date% %time%
echo - **Node.js Version**: 
node --version
echo - **npm Version**: 
npm --version
echo - **Total Files**: %FILE_COUNT%
echo.
echo ## Files Included
echo - ✅ index.html ^(Main application^)
echo - ✅ tools/ ^(18 PDF tools^)
echo - ✅ assets/ ^(CSS, JS, images^)
echo - ✅ public/ ^(Static assets^)
echo - ✅ vercel.json ^(Vercel configuration^)
echo - ✅ netlify.toml ^(Netlify configuration^)
echo - ✅ CNAME ^(Custom domain^)
echo - ✅ .nojekyll ^(GitHub Pages^)
echo - ✅ DEPLOYMENT.md ^(Deployment instructions^)
echo.
echo ## Ready for Deployment
echo The build folder contains everything needed for deployment to:
echo - ✅ Vercel
echo - ✅ Netlify
echo - ✅ GitHub Pages
echo - ✅ AWS S3
echo - ✅ Cloudflare Pages
echo - ✅ Any static hosting service
echo.
echo ## Next Steps
echo 1. Choose your deployment platform
echo 2. Follow the instructions in build/DEPLOYMENT.md
echo 3. Configure your custom domain ^(optional^)
echo 4. Set up analytics ^(optional^)
echo 5. Test your deployment
echo.
echo ## Support
echo - GitHub: https://github.com/pdfmastertool/pdfmastertool
echo - Email: support@pdfmastertool.com
echo - Documentation: https://pdfmastertool.com/docs
) > DEPLOYMENT_SUMMARY.md

echo ✅ Deployment summary created
echo.

REM Final status
echo.
echo 🎉 PDFMasterTool Build Complete!
echo ================================
echo ✅ Build directory: .\build\
echo ✅ Total files: %FILE_COUNT%
echo ✅ Ready for deployment to any static hosting service
echo.
echo ℹ️  Next steps:
echo 1. Review DEPLOYMENT_SUMMARY.md
echo 2. Choose your deployment platform
echo 3. Follow instructions in build\DEPLOYMENT.md
echo 4. Deploy and enjoy your PDF tools!
echo.
echo ⚠️  Remember to test your deployment before going live!
echo.

pause
