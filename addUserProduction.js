import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User Schema (inline for this script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String,
  name: String,
  photo: String,
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  proExpiresAt: Date,
  paidInterviewCredits: { type: Number, default: 0 },
  paidChatCredits: { type: Number, default: 0 },
  interviewCreditsUsed: { type: Number, default: 0 },
  chatCreditsUsed: { type: Number, default: 0 },
  freeCredits: { type: Number, default: 0 },
  creditsUsed: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function addUser() {
  try {
    // Connect to production MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI or MONGO_URI not found in environment variables');
    }
    console.log('Connecting to production MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production MongoDB');

    const userData = {
      email: 'pranavsaikumar777@gmail.com',
      password: 'okay bro',
      name: 'Pranav Sai Kumar'
    };

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
            proExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100),
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
        proExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100),
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

    console.log('\n🎉 User added to PRODUCTION database!');
    console.log('\nLogin credentials:');
    console.log('Email: pranavsaikumar777@gmail.com');
    console.log('Password: okay bro');
    console.log('Credits: Unlimited (999999)');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addUser();
