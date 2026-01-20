import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import connectDB from './db.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function addUsers() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const users = [
      {
        email: 'pranavsaikumar777@gmail.com',
        password: 'okay bro',
        name: 'Pranav Sai Kumar'
      },
      {
        email: 'imsanjay.ak@gmail.com',
        password: 'okay bro',
        name: 'Sanjay AK'
      }
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists. Updating...`);
        
        // Update existing user with unlimited credits
        await User.findOneAndUpdate(
          { email: userData.email },
          {
            $set: {
              password: hashPassword(userData.password),
              name: userData.name,
              plan: 'pro',
              proExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100), // 100 years
              paidInterviewCredits: 999999,
              paidChatCredits: 999999,
              updatedAt: new Date()
            }
          }
        );
        console.log(`✅ Updated user: ${userData.email}`);
      } else {
        // Create new user with unlimited credits
        const hashedPassword = hashPassword(userData.password);
        await User.create({
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          photo: '',
          plan: 'pro',
          proExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100), // 100 years
          paidInterviewCredits: 999999,
          paidChatCredits: 999999,
          interviewCreditsUsed: 0,
          chatCreditsUsed: 0,
          freeCredits: 0,
          creditsUsed: 0,
          updatedAt: new Date()
        });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    console.log('\n🎉 All users added/updated successfully!');
    console.log('\nLogin credentials:');
    console.log('1. Email: pranavsaikumar777@gmail.com');
    console.log('   Password: okay bro');
    console.log('   Credits: Unlimited (999999)');
    console.log('\n2. Email: imsanjay.ak@gmail.com');
    console.log('   Password: okay bro');
    console.log('   Credits: Unlimited (999999)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding users:', error);
    process.exit(1);
  }
}

addUsers();
