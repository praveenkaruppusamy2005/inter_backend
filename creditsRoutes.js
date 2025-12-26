import express from 'express';
import User from './models/User.js';

const router = express.Router();

/**
 * Check user credits
 * GET /credits/check/:email
 */
router.get('/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({
        success: true,
        hasCredits: false,
        freeCredits: 0,
        creditsUsed: 0,
        isPro: false
      });
    }

    const isPro = user.plan === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
    const hasCredits = (user.freeCredits || 0) > (user.creditsUsed || 0);

    return res.json({
      success: true,
      hasCredits,
      freeCredits: user.freeCredits || 0,
      creditsUsed: user.creditsUsed || 0,
      remainingCredits: (user.freeCredits || 0) - (user.creditsUsed || 0),
      isPro,
      proExpiresAt: user.proExpiresAt
    });
  } catch (error) {
    console.error('❌ Check credits error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Use a free credit
 * POST /credits/use
 * Body: { email, feature }
 */
router.post('/use', async (req, res) => {
  try {
    const { email, feature = 'chat' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has credits available
    const remainingCredits = (user.freeCredits || 0) - (user.creditsUsed || 0);
    
    if (remainingCredits <= 0) {
      return res.json({
        success: false,
        error: 'No credits available',
        hasCredits: false,
        remainingCredits: 0
      });
    }

    // Use one credit
    await User.findOneAndUpdate(
      { email },
      {
        $inc: { creditsUsed: 1 },
        lastCreditUsedAt: new Date()
      }
    );

    console.log(`✅ Credit used by ${email} for ${feature}. Remaining: ${remainingCredits - 1}`);

    return res.json({
      success: true,
      hasCredits: remainingCredits - 1 > 0,
      remainingCredits: remainingCredits - 1,
      message: `Credit used successfully. ${remainingCredits - 1} credits remaining.`
    });
  } catch (error) {
    console.error('❌ Use credit error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset credits (admin only - for testing)
 * POST /credits/reset
 * Body: { email }
 */
router.post('/reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    await User.findOneAndUpdate(
      { email },
      {
        freeCredits: 1,
        creditsUsed: 0,
        lastCreditUsedAt: null
      }
    );

    console.log(`✅ Credits reset for ${email}`);

    return res.json({
      success: true,
      message: 'Credits reset successfully',
      freeCredits: 1,
      creditsUsed: 0
    });
  } catch (error) {
    console.error('❌ Reset credits error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
