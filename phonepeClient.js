import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { StandardCheckoutClient, Env } from 'pg-sdk-node';

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'SANDBOX'; // 'SANDBOX' or 'PRODUCTION'

if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
  console.error('⚠️  PhonePe credentials missing in .env file');
  throw new Error('PhonePe credentials are required');
}

// Initialize PhonePe client using getInstance (singleton pattern)
const phonepeEnv = PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;
const phonepeClient = StandardCheckoutClient.getInstance(
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  PHONEPE_CLIENT_VERSION,
  phonepeEnv
);

console.log(`✅ PhonePe StandardCheckoutClient initialized (${PHONEPE_ENV} mode)`);
console.log(`   Client ID: ${PHONEPE_CLIENT_ID}`);
console.log(`   Client Version: ${PHONEPE_CLIENT_VERSION}`);

export { phonepeClient, PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, Env };