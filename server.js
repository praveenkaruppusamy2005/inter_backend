import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from "./db.js";

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });
if (process.resourcesPath) {
  dotenv.config({ path: path.join(process.resourcesPath, 'backend.env'), override: true });
  dotenv.config({ path: path.join(process.resourcesPath, 'backend', '.env'), override: true });
}

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

// Lazily load and mount routes to avoid startup failure if deps missing
try {
  const { default: phonepeRoutes } = await import("./phonepeRoutes.js");
  apiApp.use("/phonepe", phonepeRoutes);
  console.log("✅ PhonePe routes mounted");
} catch (err) {
  console.error("⚠️ PhonePe routes not mounted:", err?.message || err);
}

try {
  const { default: creditsRoutes } = await import("./creditsRoutes.js");
  apiApp.use("/credits", creditsRoutes);
  console.log("✅ Credits routes mounted");
} catch (err) {
  console.error("⚠️ Credits routes not mounted:", err?.message || err);
}

try {
  const { default: authRoutes } = await import("./authRoutes.js");
  apiApp.use("/auth", authRoutes);
  console.log("✅ Auth routes mounted");
} catch (err) {
  console.error("⚠️ Auth routes not mounted:", err?.message || err);
}

// Connect to MongoDB with error handling
let dbConnected = false;
try {
  await connectDB();
  dbConnected = true;
} catch (error) {
  console.error('❌ Failed to connect to MongoDB:', error);
  console.error('⚠️  Continuing to start server without DB connection for health/debug endpoints');
  dbConnected = false;
  setTimeout(async () => {
    try {
      console.log('🔁 Retrying MongoDB connection...');
      await connectDB();
      dbConnected = true;
      console.log('✅ MongoDB connected successfully after retry');
    } catch (retryError) {
      console.error('❌ Retry failed:', retryError);
    }
  }, 10000);
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

// Health check endpoint
apiApp.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PhonePe Payment API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    db: dbConnected ? 'connected' : 'not_connected'
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
  console.log("   POST /auth/register");
  console.log("   POST /auth/login");
  console.log("   GET  /health");
  
  // Keep-alive mechanism for Render free tier
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    console.log('🏓 Starting keep-alive pinger...');
    setInterval(async () => {
      try {
        const response = await fetch(`${process.env.BACKEND_URL || 'https://inter-backend-lpmb.onrender.com'}/health`);
        if (response.ok) {
          console.log('✅ Keep-alive ping successful');
        }
      } catch (error) {
        console.error('❌ Keep-alive ping failed:', error.message);
      }
    }, 10 * 60 * 1000); // Ping every 10 minutes
  }
});
