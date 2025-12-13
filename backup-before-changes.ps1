# ========================================
# BACKUP SCRIPT - ALWAYS RUN BEFORE CHANGES
# ========================================
#
# This script creates timestamped backups of important files
# Run this before making any changes!

param(
    [string]$FilePath = "",
    [switch]$All = $false
)

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = "backups"

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✅ Created backup directory: $backupDir" -ForegroundColor Green
}

function Backup-File {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    $fileName = Split-Path -Leaf $FilePath
    $fileDir = Split-Path -Parent $FilePath
    $backupPath = Join-Path $backupDir "$fileName.backup-$timestamp"
    
    try {
        Copy-Item -Path $FilePath -Destination $backupPath -Force
        Write-Host "✅ Backed up: $FilePath → $backupPath" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to backup: $FilePath - $_" -ForegroundColor Red
        return $false
    }
}

if ($All) {
    Write-Host "🔄 Creating backups of all important files..." -ForegroundColor Cyan
    
    # Cloud Run files
    Backup-File "google-cloud-run\app.py"
    Backup-File "google-cloud-run\Dockerfile"
    Backup-File "google-cloud-run\requirements.txt"
    
    # Frontend files
    Backup-File "astro.config.mjs"
    Backup-File "package.json"
    
    # Component files
    $componentFiles = @(
        "src\components\ToolTemplate.tsx",
        "src\components\FileUploader.tsx",
        "src\utils\pdfUtils.ts",
        "src\utils\awsClient.ts"
    )
    
    foreach ($file in $componentFiles) {
        if (Test-Path $file) {
            Backup-File $file
        }
    }
    
    Write-Host "`n✅ Backup complete! All files backed up to: $backupDir" -ForegroundColor Green
} elseif ($FilePath) {
    Backup-File $FilePath
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\backup-before-changes.ps1 -All           # Backup all important files" -ForegroundColor Gray
    Write-Host "  .\backup-before-changes.ps1 -FilePath 'path' # Backup specific file" -ForegroundColor Gray
}





