import express from 'express';
import User from './models/User.js';
import crypto from 'crypto';

const router = express.Router();

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Create new user with hashed password and UNLIMITED credits
    const hashedPassword = hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      photo: '',
      plan: 'pro', // Email users get pro plan
      proExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100), // 100 years
      paidInterviewCredits: 999999, // Unlimited
      paidChatCredits: 999999, // Unlimited
      interviewCreditsUsed: 0,
      chatCreditsUsed: 0,
      freeCredits: 0,
      creditsUsed: 0,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        photo: user.photo,
        plan: user.plan,
        proExpiresAt: user.proExpiresAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register user' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        photo: user.photo,
        plan: user.plan,
        proExpiresAt: user.proExpiresAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to login' 
    });
  }
});

export default router;
