# PowerShell script to create deployment package for Azure
Write-Host "Creating deployment package for Azure Web App..." -ForegroundColor Green

# Files to include in deployment
$filesToInclude = @(
    "server.js",
    "package.json",
    "web.config",
    "iisnode.yml",
    ".deployment",
    "deploy.cmd",
    "startup.txt",
    "phonepeClient.js",
    "phonepeRoutes.js",
    "creditsRoutes.js",
    "db.js",
    "models"
)

# Create deployment directory
$deployDir = "deployment"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir

# Copy files
foreach ($file in $filesToInclude) {
    if (Test-Path $file) {
        if ((Get-Item $file).PSIsContainer) {
            Copy-Item $file -Destination $deployDir -Recurse
        } else {
            Copy-Item $file -Destination $deployDir
        }
        Write-Host "Copied: $file" -ForegroundColor Yellow
    }
}

# Create ZIP file
$zipPath = "azure-deployment.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath
Write-Host "Created deployment package: $zipPath" -ForegroundColor Green

# Cleanup
Remove-Item $deployDir -Recurse -Force

Write-Host "Deployment package ready! Upload $zipPath to Azure." -ForegroundColor Cyan