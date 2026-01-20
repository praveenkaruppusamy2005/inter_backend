import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';

dotenv.config();

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User Schema
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

async function checkUser() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'pranavsaikumar777@gmail.com';
    const password = 'okay bro';
    const hashedPassword = hashPassword(password);

    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🔒 Hashed Password:', hashedPassword);
    console.log('\n🔍 Searching for user in database...\n');

    const user = await User.findOne({ email });

    if (user) {
      console.log('✅ USER FOUND!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Plan:', user.plan);
      console.log('Stored Password Hash:', user.password);
      console.log('Expected Password Hash:', hashedPassword);
      console.log('Password Match:', user.password === hashedPassword ? '✅ YES' : '❌ NO');
      console.log('Interview Credits:', user.paidInterviewCredits);
      console.log('Chat Credits:', user.paidChatCredits);
      console.log('Pro Expires:', user.proExpiresAt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ USER NOT FOUND IN DATABASE!');
      console.log('The user does not exist in the production database.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
