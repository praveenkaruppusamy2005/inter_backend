import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { StandardCheckoutClient, Env } from 'pg-sdk-node';

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });
if (process.resourcesPath) {
  dotenv.config({ path: path.join(process.resourcesPath, 'backend.env'), override: true });
  dotenv.config({ path: path.join(process.resourcesPath, 'backend', '.env'), override: true });
}

let PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
let PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
let PHONEPE_CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
let PHONEPE_ENV = process.env.PHONEPE_ENV || 'SANDBOX';

let cachedClient = null;

export function PhonepeClient() {
  if (cachedClient) return cachedClient;
  PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
  PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
  PHONEPE_CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
  PHONEPE_ENV = process.env.PHONEPE_ENV || 'SANDBOX';
  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    console.error('⚠️  PhonePe credentials missing');
    throw new Error('PhonePe credentials are required');
  }
  const phonepeEnv = PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;
  cachedClient = StandardCheckoutClient.getInstance(
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    PHONEPE_CLIENT_VERSION,
    phonepeEnv
  );
  console.log(`✅ PhonePe StandardCheckoutClient initialized (${PHONEPE_ENV} mode)`);
  console.log(`   Client ID: ${PHONEPE_CLIENT_ID}`);
  console.log(`   Client Version: ${PHONEPE_CLIENT_VERSION}`);
  return cachedClient;
}

export { PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, Env };
