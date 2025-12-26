# Azure Deployment Fix Script
Write-Host "🔧 Fixing Azure deployment issues..." -ForegroundColor Green

# Install correct dependencies
Write-Host "📦 Installing pg-sdk-node..." -ForegroundColor Yellow
npm uninstall phonepe-kit
npm install pg-sdk-node@latest

# Verify environment variables
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow
if (-not $env:PHONEPE_CLIENT_ID) {
    Write-Host "❌ PHONEPE_CLIENT_ID not set" -ForegroundColor Red
}
if (-not $env:MONGODB_URI) {
    Write-Host "❌ MONGODB_URI not set" -ForegroundColor Red
}

# Test MongoDB connection
Write-Host "🔗 Testing MongoDB connection..." -ForegroundColor Yellow
node -e "
import mongoose from 'mongoose';
const uri = process.env.MONGODB_URI || 'mongodb+srv://ipraveen982005_db_user:jT2Jwg9Wrzlp3uMS@user.ckoc9vn.mongodb.net/?appName=user';
try {
  await mongoose.connect(uri);
  console.log('✅ MongoDB connection successful');
  process.exit(0);
} catch (err) {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
}
"

Write-Host "✅ Deployment fix complete!" -ForegroundColor Green