// Azure startup script with better error handling
console.log('🚀 Starting Azure deployment...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Working directory:', process.cwd());

// Check critical environment variables
const requiredEnvVars = [
  'PHONEPE_CLIENT_ID',
  'PHONEPE_CLIENT_SECRET'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.log('💡 Please configure these in Azure App Service Configuration:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  // Don't exit immediately, try to start server anyway for debugging
  console.log('⚠️  Starting server anyway for debugging purposes...');
}

console.log('✅ Starting server...');

// Import and start the main server
try {
  console.log('📦 Loading main server...');
  await import('./server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  
  // Try to start a minimal server for debugging
  console.log('🔧 Starting minimal debug server...');
  const express = (await import('express')).default;
  const app = express();
  
  app.get('/', (req, res) => {
    res.json({ 
      error: 'Server failed to start normally',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  const port = process.env.PORT || 60468;
  app.listen(port, () => {
    console.log(`🆘 Debug server running on port ${port}`);
  });
}