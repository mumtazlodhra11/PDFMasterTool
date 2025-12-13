# Quick Diagnostic Script for Dev Server Issues

Write-Host "🔍 Checking Dev Server Status..." -ForegroundColor Cyan
Write-Host ""

# Check if port 9001 is in use
Write-Host "1️⃣ Checking port 9001..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 9001 -ErrorAction SilentlyContinue

if ($portCheck) {
    Write-Host "   ✅ Port 9001 is in use!" -ForegroundColor Green
    Write-Host "   Process ID: $($portCheck.OwningProcess)" -ForegroundColor Gray
    
    try {
        $process = Get-Process -Id $portCheck.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   Process Name: $($process.ProcessName)" -ForegroundColor Gray
            Write-Host "   Command: $($process.Path)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   (Could not get process details)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Port 9001 is NOT in use" -ForegroundColor Red
    Write-Host "   → Dev server is not running!" -ForegroundColor Red
    Write-Host "   → Run: npm run dev" -ForegroundColor Cyan
}

Write-Host ""

# Check Node.js version
Write-Host "2️⃣ Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 20) {
        Write-Host "   ⚠️  Warning: Node.js version should be >= 20.0.0" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   → Install Node.js from nodejs.org" -ForegroundColor Cyan
}

Write-Host ""

# Check if package.json exists
Write-Host "3️⃣ Checking project files..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
    Write-Host "   → Make sure you're in the project root directory" -ForegroundColor Cyan
}

if (Test-Path "astro.config.mjs") {
    Write-Host "   ✅ astro.config.mjs found" -ForegroundColor Green
} else {
    Write-Host "   ❌ astro.config.mjs not found" -ForegroundColor Red
}

Write-Host ""

# Check cache directories
Write-Host "4️⃣ Checking cache directories..." -ForegroundColor Yellow
$hasCache = $false
if (Test-Path ".vite") {
    Write-Host "   ⚠️  .vite cache found" -ForegroundColor Yellow
    $hasCache = $true
}
if (Test-Path ".astro") {
    Write-Host "   ⚠️  .astro cache found" -ForegroundColor Yellow
    $hasCache = $true
}
if (-not $hasCache) {
    Write-Host "   ✅ No cache directories found (clean state)" -ForegroundColor Green
} else {
    Write-Host "   → Consider running: .\clear-cache.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($portCheck) {
    Write-Host ""
    Write-Host "✅ Server appears to be running on port 9001" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Try opening:" -ForegroundColor Cyan
    Write-Host "   http://localhost:9001" -ForegroundColor White
    Write-Host "   or" -ForegroundColor Gray
    Write-Host "   http://127.0.0.1:9001" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 If still not working:" -ForegroundColor Yellow
    Write-Host "   1. Hard refresh browser: Ctrl + Shift + R" -ForegroundColor Gray
    Write-Host "   2. Check browser console (F12)" -ForegroundColor Gray
    Write-Host "   3. Try incognito mode" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Dev server is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "🚀 To start the server:" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "   Then wait for:" -ForegroundColor Gray
    Write-Host "   Local: http://localhost:9001/" -ForegroundColor White
}

Write-Host ""






