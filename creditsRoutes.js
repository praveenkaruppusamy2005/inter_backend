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
        isPro: false,
        chatRemaining: 0,
        interviewRemaining: 0
      });
    }

    const isPro = user.plan === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
    const chatRemaining = Math.max(0, (user.paidChatCredits || 0) - (user.chatCreditsUsed || 0)) + Math.max(0, (user.freeCredits || 0) - (user.creditsUsed || 0));
    const interviewRemaining = Math.max(0, (user.paidInterviewCredits || 0) - (user.interviewCreditsUsed || 0)) + Math.max(0, (user.freeCredits || 0) - (user.creditsUsed || 0));
    const hasCredits = chatRemaining > 0 || interviewRemaining > 0;

    return res.json({
      success: true,
      hasCredits,
      freeCredits: user.freeCredits || 0,
      paidChatCredits: user.paidChatCredits || 0,
      paidInterviewCredits: user.paidInterviewCredits || 0,
      chatCreditsUsed: user.chatCreditsUsed || 0,
      interviewCreditsUsed: user.interviewCreditsUsed || 0,
      chatRemaining,
      interviewRemaining,
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

    // Determine remaining by feature
    const hasPaidChat = Math.max(0, (user.paidChatCredits || 0) - (user.chatCreditsUsed || 0)) > 0;
    const hasPaidInterview = Math.max(0, (user.paidInterviewCredits || 0) - (user.interviewCreditsUsed || 0)) > 0;
    const hasFree = Math.max(0, (user.freeCredits || 0) - (user.creditsUsed || 0)) > 0;

    let update = { lastCreditUsedAt: new Date() };
    if (feature === 'chat') {
      if (hasPaidChat) {
        update.$inc = { chatCreditsUsed: 1 };
      } else if (hasFree) {
        update.$inc = { creditsUsed: 1 };
      } else {
        return res.json({ success: false, error: 'No chat credits available', hasCredits: false, chatRemaining: 0 });
      }
    } else if (feature === 'interview') {
      if (hasPaidInterview) {
        update.$inc = { interviewCreditsUsed: 1 };
      } else if (hasFree) {
        update.$inc = { creditsUsed: 1 };
      } else {
        return res.json({ success: false, error: 'No interview credits available', hasCredits: false, interviewRemaining: 0 });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid feature' });
    }

    await User.findOneAndUpdate({ email }, update);

    const chatRemaining = Math.max(0, (user.paidChatCredits || 0) - ((user.chatCreditsUsed || 0) + (update.$inc?.chatCreditsUsed ? 1 : 0))) + Math.max(0, (user.freeCredits || 0) - ((user.creditsUsed || 0) + (update.$inc?.creditsUsed ? 1 : 0)));
    const interviewRemaining = Math.max(0, (user.paidInterviewCredits || 0) - ((user.interviewCreditsUsed || 0) + (update.$inc?.interviewCreditsUsed ? 1 : 0))) + Math.max(0, (user.freeCredits || 0) - ((user.creditsUsed || 0) + (update.$inc?.creditsUsed ? 1 : 0)));

    return res.json({
      success: true,
      hasCredits: chatRemaining > 0 || interviewRemaining > 0,
      chatRemaining,
      interviewRemaining,
      message: `Credit used successfully.`
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
