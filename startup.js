// Azure startup script with better error handling
console.log('🚀 Starting Azure deployment...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Check critical environment variables
const requiredEnvVars = [
  'PHONEPE_CLIENT_ID',
  'PHONEPE_CLIENT_SECRET',
  'MONGODB_URI'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.log('💡 Please configure these in Azure App Service Configuration:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Import and start the main server
try {
  console.log('📦 Loading main server...');
  await import('./server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}