# Azure Deployment Verification Script
Write-Host "🔍 Verifying Azure deployment..." -ForegroundColor Green

$baseUrl = "https://interview-pro-e3apb5g4g7h9fhf0.centralindia-01.azurewebsites.net"
$maxRetries = 10
$retryDelay = 30

for ($i = 1; $i -le $maxRetries; $i++) {
    Write-Host "Attempt $i/$maxRetries - Testing health endpoint..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint is responding!" -ForegroundColor Green
            Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
            break
        }
    }
    catch {
        $errorMessage = $_.Exception.Message
        Write-Host "❌ Attempt $i failed: $errorMessage" -ForegroundColor Red
        
        if ($errorMessage -like "*Site Under Construction*") {
            Write-Host "🚧 Site is still under construction - deployment in progress" -ForegroundColor Yellow
        }
        elseif ($errorMessage -like "*500*") {
            Write-Host "💥 Server error - check Azure logs for details" -ForegroundColor Red
        }
        elseif ($errorMessage -like "*404*") {
            Write-Host "🔍 Endpoint not found - check routing" -ForegroundColor Yellow
        }
    }
    
    if ($i -lt $maxRetries) {
        Write-Host "⏳ Waiting $retryDelay seconds before next attempt..." -ForegroundColor Gray
        Start-Sleep -Seconds $retryDelay
    }
}

Write-Host "`n📋 Next steps if deployment is still failing:" -ForegroundColor Cyan
Write-Host "1. Check Azure Portal > App Service > Deployment Center for build logs" -ForegroundColor White
Write-Host "2. Check Azure Portal > App Service > Log stream for runtime errors" -ForegroundColor White
Write-Host "3. Verify environment variables are configured in Azure Portal > Configuration" -ForegroundColor White
Write-Host "4. Ensure the startup command is set to 'node startup.js' in Azure Portal" -ForegroundColor White