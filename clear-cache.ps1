# Clear Astro and Vite cache
Write-Host "🧹 Clearing cache directories..." -ForegroundColor Cyan

# Clear .vite cache if exists
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force .vite
    Write-Host "✅ Cleared .vite cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .vite cache not found (may not exist yet)" -ForegroundColor Yellow
}

# Clear .astro cache if exists
if (Test-Path ".astro") {
    Remove-Item -Recurse -Force .astro
    Write-Host "✅ Cleared .astro cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .astro cache not found (may not exist yet)" -ForegroundColor Yellow
}

# Clear node_modules/.vite if exists
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force node_modules\.vite
    Write-Host "✅ Cleared node_modules/.vite cache" -ForegroundColor Green
}

Write-Host "`n✅ Cache clearing complete!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Cyan






