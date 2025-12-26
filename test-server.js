// Simple test to verify server dependencies and basic functionality
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🧪 Testing server dependencies...');

// Test 1: Express
try {
  const app = express();
  console.log('✅ Express loaded successfully');
} catch (err) {
  console.error('❌ Express failed:', err.message);
  process.exit(1);
}

// Test 2: Environment variables
console.log('🔍 Environment variables:');
console.log('  PHONEPE_CLIENT_ID:', process.env.PHONEPE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('  PORT:', process.env.PORT || 'Using default 60468');

// Test 3: PhonePe SDK
try {
  const pkg = await import('pg-sdk-node');
  console.log('✅ pg-sdk-node loaded successfully');
  console.log('  Available exports:', Object.keys(pkg.default || pkg));
} catch (err) {
  console.error('❌ pg-sdk-node failed:', err.message);
  console.log('💡 Run: npm install pg-sdk-node');
}

// Test 4: MongoDB
try {
  const mongoose = await import('mongoose');
  console.log('✅ Mongoose loaded successfully');
} catch (err) {
  console.error('❌ Mongoose failed:', err.message);
}

console.log('🏁 Test complete');