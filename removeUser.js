import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function removeUser() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const emailToRemove = 'imsanjay.ak@gmail.com';

    // Check if user exists
    const user = await User.findOne({ email: emailToRemove });
    
    if (user) {
      await User.deleteOne({ email: emailToRemove });
      console.log(`✅ Successfully removed user: ${emailToRemove}`);
    } else {
      console.log(`⚠️  User ${emailToRemove} not found in database`);
    }

    console.log('\n✅ Operation completed!');
    console.log('\nRemaining active user:');
    console.log('Email: pranavsaikumar777@gmail.com');
    console.log('Password: okay bro');
    console.log('Credits: Unlimited (999999)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing user:', error);
    process.exit(1);
  }
}

removeUser();
