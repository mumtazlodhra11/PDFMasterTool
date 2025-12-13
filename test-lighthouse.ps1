# Lighthouse Test Script for PDFMasterTool
# Run Lighthouse audit and save results

$ErrorActionPreference = 'Stop'

Write-Host "🔍 Starting Lighthouse Audit..." -ForegroundColor Cyan

# Check if Lighthouse is installed
$lighthouseInstalled = Get-Command lighthouse -ErrorAction SilentlyContinue

if (-not $lighthouseInstalled) {
    Write-Host "❌ Lighthouse not found. Installing..." -ForegroundColor Yellow
    npm install -g lighthouse
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Lighthouse" -ForegroundColor Red
        exit 1
    }
}

$baseUrl = "http://localhost:9001"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputDir = "lighthouse-reports"

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Pages to test
$pages = @(
    @{name="home"; url="/"},
    @{name="pdf-to-word"; url="/tools/pdf-to-word"},
    @{name="pdf-to-excel"; url="/tools/pdf-to-excel"},
    @{name="excel-to-pdf"; url="/tools/excel-to-pdf"},
    @{name="edit-pdf"; url="/tools/edit-pdf"}
)

Write-Host "`n📊 Testing ${($pages.Count)} pages..." -ForegroundColor Cyan

foreach ($page in $pages) {
    $fullUrl = "$baseUrl$($page.url)"
    $outputFile = "$outputDir\$($page.name)-$timestamp.json"
    $htmlFile = "$outputDir\$($page.name)-$timestamp.html"
    
    Write-Host "`n🔍 Testing: $($page.name) ($fullUrl)" -ForegroundColor Yellow
    
    try {
        # Run Lighthouse
        lighthouse $fullUrl `
            --output=json,html `
            --output-path="$outputFile" `
            --chrome-flags="--headless --no-sandbox" `
            --only-categories=performance,accessibility,best-practices,seo `
            --quiet
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Completed: $($page.name)" -ForegroundColor Green
            
            # Parse JSON and show scores
            $json = Get-Content $outputFile | ConvertFrom-Json
            $perf = [math]::Round($json.categories.performance.score * 100)
            $a11y = [math]::Round($json.categories.accessibility.score * 100)
            $best = [math]::Round($json.categories.'best-practices'.score * 100)
            $seo = [math]::Round($json.categories.seo.score * 100)
            
            Write-Host "   Performance: $perf" -ForegroundColor $(if ($perf -ge 90) { "Green" } elseif ($perf -ge 50) { "Yellow" } else { "Red" })
            Write-Host "   Accessibility: $a11y" -ForegroundColor $(if ($a11y -ge 90) { "Green" } elseif ($a11y -ge 50) { "Yellow" } else { "Red" })
            Write-Host "   Best Practices: $best" -ForegroundColor $(if ($best -ge 90) { "Green" } elseif ($best -ge 50) { "Yellow" } else { "Red" })
            Write-Host "   SEO: $seo" -ForegroundColor $(if ($seo -ge 90) { "Green" } elseif ($seo -ge 50) { "Yellow" } else { "Red" })
        } else {
            Write-Host "❌ Failed: $($page.name)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error testing $($page.name): $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Lighthouse audit complete!" -ForegroundColor Green
Write-Host "📁 Reports saved in: $outputDir" -ForegroundColor Cyan
Write-Host "`n💡 Open HTML files in browser to view detailed reports" -ForegroundColor Yellow













