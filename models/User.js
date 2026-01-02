import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  photo: String,
  googleId: String,
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  proExpiresAt: Date,
  resumePath: String, // Path to the stored resume file
  chatProvider: { type: String, enum: ['openrouter', 'groq'], default: 'openrouter' },
  // Free credits system
  freeCredits: { type: Number, default: 1 }, // Free trial credits (1 credit per user)
  creditsUsed: { type: Number, default: 0 }, // Track credits usage
  lastCreditUsedAt: Date, // When was last credit used
  // Paid credits
  paidCredits: { type: Number, default: 0 }, // legacy total credits
  paidChatCredits: { type: Number, default: 0 },
  paidInterviewCredits: { type: Number, default: 0 },
  // Usage counters
  chatCreditsUsed: { type: Number, default: 0 },
  interviewCreditsUsed: { type: Number, default: 0 },
  // Payment transaction history
  transactions: [{
    transactionId: String,
    amount: Number,
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'] },
    paymentMethod: { type: String, enum: ['phonepe', 'razorpay'] },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
  ,
  customApiKeys: {
    openRouter: { type: String, default: "" },
    deepgram: { type: String, default: "" },
    groq: { type: String, default: "" }
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

const User = mongoose.model('User', userSchema);

export default User;
