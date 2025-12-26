import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import phonepeRoutes from "./phonepeRoutes.js";
import creditsRoutes from "./creditsRoutes.js";
import connectDB from "./db.js";

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('📁 Loading .env from:', path.join(__dirname, '.env'));

const apiApp = express();

// Add error handling middleware
apiApp.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

apiApp.use(express.json());
apiApp.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with error handling
try {
  await connectDB();
} catch (error) {
  console.error('❌ Failed to connect to MongoDB:', error);
  process.exit(1);
}

// Simple test endpoint that doesn't require dependencies
apiApp.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// PhonePe routes
apiApp.use("/phonepe", phonepeRoutes);

// Credits routes
apiApp.use("/credits", creditsRoutes);

// Health check endpoint
apiApp.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PhonePe Payment API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Diagnostic endpoint for troubleshooting
apiApp.get('/debug', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    PHONEPE_CLIENT_ID: process.env.PHONEPE_CLIENT_ID ? 'set' : 'not set',
    PHONEPE_CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET ? 'set' : 'not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set',
    BACKEND_URL: process.env.BACKEND_URL || 'not set'
  };
  
  res.json({
    status: 'debug',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environmentVariables: envVars,
    workingDirectory: process.cwd()
  });
});

// 404 handler
apiApp.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 60468; // Azure will provide PORT environment variable

apiApp.listen(PORT, () => {
  console.log(`🚀 PhonePe API server running on http://localhost:${PORT}`);
  console.log("🔗 Endpoints:");
  console.log("   POST /phonepe/initiate");
  console.log("   POST /phonepe/webhook");
  console.log("   GET/POST /phonepe/redirect");
  console.log("   GET  /phonepe/status/:transactionId");
  console.log("   GET  /credits/check/:email");
  console.log("   POST /credits/use");
  console.log("   GET  /health");
});
