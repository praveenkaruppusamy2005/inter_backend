import express from 'express';
import { randomUUID } from 'crypto';
import { StandardCheckoutPayRequest, MetaInfo } from 'pg-sdk-node';
import { PhonepeClient } from './phonepeClient.js';
import User from './models/User.js';

const router = express.Router();


const pendingTransactions = new Map();

// Webhook credentials (use PhonePe Client credentials)
const WEBHOOK_USERNAME = process.env.PHONEPE_CLIENT_ID || process.env.PHONEPE_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = process.env.PHONEPE_CLIENT_SECRET || process.env.PHONEPE_WEBHOOK_PASSWORD;

/**
 * Initiate PhonePe Payment
 * POST /phonepe/initiate
 * Body: { email, amount, type, credits, duration }
 */
router.post('/initiate', async (req, res) => {
  try {
    const { email, amount, type = 'credits', credits = 1, duration = 10 } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    let finalAmount;
    let description;
    let planDetails = {};

    // Calculate amount and description based on plan type
    switch (type) {
      case 'credits':
        finalAmount = amount || (credits * 250);
        description = `${credits} Credit${credits > 1 ? 's' : ''} - ₹${finalAmount}`;
        planDetails = { type: 'credits', credits, amount: finalAmount };
        break;
      case 'subscription':
        finalAmount = amount || 999; // Allow override for testing
        description = `5-Day Subscription - ₹${finalAmount}`;
        planDetails = { type: 'subscription', duration: 5, amount: finalAmount };
        break;
      /*
      case 'lifetime':
        finalAmount = 5000; // Fixed price for lifetime
        description = `Lifetime Access - ₹${finalAmount}`;
        planDetails = { type: 'lifetime', amount: finalAmount };
        break;
      */
      default:
        return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }

    // Generate unique merchant transaction ID
    const merchantOrderId = randomUUID();
    const amountInPaise = finalAmount * 100; // Convert rupees to paise

    // Store transaction details
    pendingTransactions.set(merchantOrderId, {
      email,
      amount: finalAmount,
      planDetails,
      createdAt: new Date(),
      status: 'PENDING'
    });

    // Create meta info with user email and plan details
    const metaInfo = MetaInfo.builder()
      .udf1(email)
      .udf2(description)
      .build();

    // Build payment request using StandardCheckoutPayRequest
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:60468').replace(/\/$/, '');
    const paymentRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaise)
      .metaInfo(metaInfo)
      .redirectUrl(`${backendUrl}/phonepe/redirect?transactionId=${merchantOrderId}`)
      .expireAfter(3600) // 1 hour expiry
      .message(description)
      .build();

    console.log('📤 Initiating PhonePe payment:', {
      merchantOrderId,
      amount: amountInPaise,
      email,
      planDetails
    });

    const client = PhonepeClient();
    const response = await client.pay(paymentRequest);

    console.log('📥 PhonePe pay() response:', response);

    if (response && response.redirectUrl) {
      return res.json({
        success: true,
        paymentUrl: response.redirectUrl,
        transactionId: merchantOrderId,
        orderId: response.orderId,
        state: response.state
      });
    } else {
      pendingTransactions.delete(merchantOrderId);
      return res.status(400).json({
        success: false,
        error: 'Payment initiation failed - no redirect URL received'
      });
    }
  } catch (error) {
    console.error('❌ PhonePe initiate error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});


router.all('/redirect', async (req, res) => {
  try {
    const transactionId = req.query.transactionId || req.body.transactionId;
    console.log('🔄 PhonePe redirect received for:', transactionId);
    
    // Check the actual payment status
    let status = 'PENDING';
    let statusResponse = null;
    
    try {
      const client = PhonepeClient();
      statusResponse = await client.getOrderStatus(transactionId);
      console.log('📊 Status response:', statusResponse);
      
      if (statusResponse && statusResponse.state === 'COMPLETED') {
        status = 'SUCCESS';
      } else if (statusResponse && statusResponse.state === 'FAILED') {
        status = 'FAILED';
        console.log('❌ Payment failed/cancelled. State:', statusResponse.state, 'ErrorCode:', statusResponse.errorCode);
      } else {
        status = 'PENDING';
      }
    } catch (statusError) {
      console.error('❌ Error checking status:', statusError);
      status = 'FAILED'; // Default to failed if we can't check
    }
    
    // Redirect to the React app instead of showing HTML
    let redirectUrl;
    if (status === 'SUCCESS') {
      redirectUrl = `https://interviewpro-jet.vercel.app/payment-complete?transactionId=${encodeURIComponent(transactionId)}&status=SUCCESS`;
    } else if (status === 'FAILED') {
      redirectUrl = `https://interviewpro-jet.vercel.app/payment-complete?transactionId=${encodeURIComponent(transactionId)}&status=FAILED`;
    } else {
      redirectUrl = `https://interviewpro-jet.vercel.app/payment-complete?transactionId=${encodeURIComponent(transactionId)}`;
    }
    
    console.log('🔀 Redirecting to React app:', redirectUrl);
    res.redirect(307, redirectUrl);
    
  } catch (error) {
    console.error('❌ Redirect error:', error);
    // Fallback redirect to React app
    const transactionId = req.query.transactionId || req.body.transactionId;
    const fallbackUrl = `https://interviewpro-jet.vercel.app/payment-complete?transactionId=${encodeURIComponent(transactionId || 'unknown')}`;
    console.log('🔀 Fallback redirect to:', fallbackUrl);
    res.redirect(307, fallbackUrl);
  }
});

/**
 * PhonePe Webhook Handler
 * POST /phonepe/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 PhonePe webhook received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    const authorizationHeader = req.headers['authorization'] || req.headers['x-verify'];
    const responseBodyString = JSON.stringify(req.body);

    // Validate callback using PhonePe SDK method
    const client = PhonepeClient();
    const callbackResponse = client.validateCallback(
      WEBHOOK_USERNAME,
      WEBHOOK_PASSWORD,
      authorizationHeader,
      responseBodyString
    );

    console.log('📦 Decoded callback response:', callbackResponse);

    const eventType = callbackResponse.type;
    const payload = callbackResponse.payload;

    if (!payload || !payload.orderId) {
      console.error('❌ Invalid callback payload');
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }

    const merchantOrderId = payload.orderId;
    const transactionData = pendingTransactions.get(merchantOrderId);

    if (!transactionData) {
      console.error('❌ Transaction not found:', merchantOrderId);
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Check if payment is successful
    if (eventType === 'CHECKOUT_ORDER_COMPLETED' && payload.state === 'COMPLETED') {
      console.log('✅ Payment successful for:', transactionData.email);

      const planDetails = transactionData.planDetails;
      let proExpiresAt;
      let updateData = {
        plan: 'pro',
        $push: {
          transactions: {
            transactionId: merchantOrderId,
            amount: transactionData.amount,
            status: 'SUCCESS',
            paymentMethod: 'phonepe',
            planType: planDetails.type,
            createdAt: transactionData.createdAt,
            completedAt: new Date()
          }
        }
      };

      // Calculate Pro expiry based on plan type
      switch (planDetails.type) {
        case 'credits':
          // Treat purchased credits as interview credits, plus 12 chat credits per interview credit
          updateData.$inc = { 
            paidInterviewCredits: planDetails.credits, 
            paidChatCredits: planDetails.credits * 12,
            paidCredits: planDetails.credits // legacy total for compatibility
          };
          console.log(`✅ Adding ${planDetails.credits} interview credits and ${planDetails.credits * 12} chat credits`);
          break;
        case 'subscription':
          proExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
          updateData.proExpiresAt = proExpiresAt;
          updateData.subscriptionType = 'subscription';
          console.log(`✅ Granting 5-day subscription, expires at:`, proExpiresAt);
          break;
        /*
        case 'lifetime':
          // Lifetime access - set expiry to far future
          proExpiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
          updateData.proExpiresAt = proExpiresAt;
          updateData.subscriptionType = 'lifetime';
          console.log(`✅ Granting lifetime access`);
          break;
        */
        default:
          console.error('❌ Unknown plan type:', planDetails.type);
          return res.status(400).json({ success: false, error: 'Unknown plan type' });
      }
      
      await User.findOneAndUpdate(
        { email: transactionData.email },
        updateData,
        { upsert: true, new: true }
      );

      // Update transaction status
      transactionData.status = 'SUCCESS';
      transactionData.completedAt = new Date();

      console.log('✅ User upgraded to Pro:', transactionData.email);

      // Clean up after 5 minutes
      setTimeout(() => {
        pendingTransactions.delete(merchantOrderId);
      }, 5 * 60 * 1000);

      return res.json({ success: true, message: 'Payment processed successfully' });
    } else {
      console.log('❌ Payment not successful:', payload.state);
      transactionData.status = 'FAILED';
      return res.json({ success: false, error: `Payment ${payload.state}` });
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Check Payment Status
 * GET /phonepe/status/:transactionId
 */
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    console.log('🔍 Checking status for:', transactionId);

    const client = PhonepeClient();
    const statusResponse = await client.getOrderStatus(transactionId);

    console.log('📊 Status response:', statusResponse);

    // Check if payment is successful
    if (statusResponse && statusResponse.state === 'COMPLETED') {
      const transactionData = pendingTransactions.get(transactionId);
      
      if (transactionData && transactionData.status === 'PENDING') {
        const planDetails = transactionData.planDetails;
        let proExpiresAt;
        let updateData = {
          plan: 'pro',
          $push: {
            transactions: {
              transactionId,
              amount: transactionData.amount,
              status: 'SUCCESS',
              paymentMethod: 'phonepe',
              planType: planDetails.type,
              createdAt: transactionData.createdAt,
              completedAt: new Date()
            }
          }
        };

        // Calculate Pro expiry based on plan type
        switch (planDetails.type) {
          case 'credits':
            updateData.$inc = { 
              paidInterviewCredits: planDetails.credits, 
              paidChatCredits: planDetails.credits * 12,
              paidCredits: planDetails.credits
            };
            console.log(`✅ Status check: Adding ${planDetails.credits} interview credits and ${planDetails.credits * 12} chat credits`);
            break;
          case 'subscription':
            proExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            updateData.proExpiresAt = proExpiresAt;
            updateData.subscriptionType = 'subscription';
            console.log(`✅ Status check: Granting 5-day subscription, expires at:`, proExpiresAt);
            break;
          /*
          case 'lifetime':
            // Lifetime access - set expiry to far future
            proExpiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
            updateData.proExpiresAt = proExpiresAt;
            updateData.subscriptionType = 'lifetime';
            console.log(`✅ Status check: Granting lifetime access`);
            break;
          */
          default:
            console.error('❌ Unknown plan type:', planDetails.type);
            return res.status(400).json({ success: false, error: 'Unknown plan type' });
        }
        
        await User.findOneAndUpdate(
          { email: transactionData.email },
          updateData,
          { upsert: true, new: true }
        );

        
        transactionData.status = 'SUCCESS';
        console.log('✅ Status check: User upgraded to Pro:', transactionData.email);
      }

      return res.json({
        success: true,
        status: 'PAYMENT_SUCCESS',
        state: statusResponse.state,
        data: statusResponse
      });
    } else if (statusResponse && ['FAILED', 'CANCELLED', 'USER_CANCELLED', 'REJECTED'].includes(statusResponse.state?.toUpperCase())) {
      console.log('❌ Payment failed/cancelled. State:', statusResponse.state, 'ErrorCode:', statusResponse.errorCode);
      return res.json({
        success: false,
        status: 'PAYMENT_FAILED',
        state: statusResponse.state,
        errorCode: statusResponse.errorCode,
        detailedErrorCode: statusResponse.detailedErrorCode,
        data: statusResponse
      });
    } else {
      return res.json({
        success: false,
        status: 'PAYMENT_PENDING',
        state: statusResponse?.state || 'PENDING',
        data: statusResponse
      });
    }
  } catch (error) {
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
