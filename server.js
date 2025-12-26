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
apiApp.use(express.json());
apiApp.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
await connectDB();

// PhonePe routes
apiApp.use("/phonepe", phonepeRoutes);

// Credits routes
apiApp.use("/credits", creditsRoutes);

// Health check endpoint
apiApp.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PhonePe Payment API' });
});

const PORT = process.env.PORT || 60468; // Changed from 60467 to avoid conflicts

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
