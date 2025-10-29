# Test Google Cloud Run API

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceUrl
)

Write-Host "🧪 Testing Cloud Run API" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method Get
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Root Endpoint
Write-Host "2️⃣ Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ServiceUrl/" -Method Get
    Write-Host "✅ Root endpoint passed!" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Root endpoint failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check if test PDF exists
$testPdf = "test.pdf"
if (Test-Path $testPdf) {
    Write-Host "3️⃣ Testing PDF to Word conversion..." -ForegroundColor Yellow
    
    try {
        # Create multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $fileContent = [System.IO.File]::ReadAllBytes($testPdf)
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"test.pdf`"",
            "Content-Type: application/pdf",
            "",
            [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileContent),
            "--$boundary--"
        ) -join "`r`n"
        
        $response = Invoke-RestMethod `
            -Uri "$ServiceUrl/convert/pdf-to-word" `
            -Method Post `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $bodyLines
        
        if ($response.success) {
            Write-Host "✅ PDF to Word conversion passed!" -ForegroundColor Green
            Write-Host "   Filename: $($response.filename)" -ForegroundColor Gray
            Write-Host "   Size: $($response.size) bytes" -ForegroundColor Gray
            
            # Save output
            $outputFile = "output.docx"
            $bytes = [Convert]::FromBase64String($response.file)
            [System.IO.File]::WriteAllBytes($outputFile, $bytes)
            Write-Host "   Saved to: $outputFile" -ForegroundColor Green
        } else {
            Write-Host "❌ Conversion failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ PDF to Word conversion failed!" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  No test.pdf file found - skipping conversion test" -ForegroundColor Yellow
    Write-Host "   Create test.pdf to test conversions" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ Testing complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan


